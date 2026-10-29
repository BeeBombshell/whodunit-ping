import { cleanMessage } from "./clean.js";
import { extractClientIp } from "./client-ip.js";
import { applyCorsHeaders, handleCorsPreflight, isOriginAllowed } from "./cors.js";
import { dailyHash } from "./crypto.js";
import type { Config, HandlerDeps, PingPayload } from "./types.js";

function jsonResponse(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates a portable Web-standard (Request -> Promise<Response>) HTTP handler.
 */
export function createHandler(config: Config = {}, deps: HandlerDeps) {
  const maxLength = config.maxLength ?? 500;
  const rateLimit = config.rateLimit ?? 5;
  const rateLimitWindowSec = config.rateLimitWindowSec ?? 3600;
  const title = config.title ?? "Whodunit Ping";

  return async (req: Request): Promise<Response> => {
    // 1. Emergency kill-switch
    if (config.disabled) {
      return jsonResponse(503, { error: "service_disabled" });
    }

    // 2. CORS Preflight
    if (req.method === "OPTIONS") {
      return handleCorsPreflight(req, config);
    }

    // 3. HTTP Method check
    if (req.method !== "POST") {
      const res = jsonResponse(405, { error: "method_not_allowed" });
      return applyCorsHeaders(res, req, config);
    }

    // 4. Origin validation
    const origin = req.headers.get("Origin");
    if (!isOriginAllowed(origin, config.allowedOrigins)) {
      const res = jsonResponse(403, { error: "forbidden_origin" });
      return applyCorsHeaders(res, req, config);
    }

    // 5. Parse JSON body
    const body: PingPayload | null = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      const res = jsonResponse(400, { error: "invalid_payload" });
      return applyCorsHeaders(res, req, config);
    }

    // 6. Honeypot trap: if filled out, silently discard and pretend success (204)
    if (body.hp) {
      const res = new Response(null, { status: 204 });
      return applyCorsHeaders(res, req, config);
    }

    // 7. Sanitize and validate message
    const text = cleanMessage(body.message, maxLength);
    if (!text) {
      const res = jsonResponse(400, { error: "invalid_message" });
      return applyCorsHeaders(res, req, config);
    }

    // 8. Bot verification
    if (deps.botCheck) {
      const isHuman = await deps.botCheck.verify(body.token);
      if (!isHuman) {
        const res = jsonResponse(403, { error: "bot_check_failed" });
        return applyCorsHeaders(res, req, config);
      }
    }

    // 9. Daily rotating salted IP rate limiting (raw IP is NEVER logged or stored)
    const clientIp = extractClientIp(req);
    const rateLimitKey = await dailyHash(clientIp, config.salt);
    const allowed = await deps.store.hit(rateLimitKey, rateLimit, rateLimitWindowSec);
    if (!allowed) {
      const res = jsonResponse(429, { error: "rate_limited" });
      return applyCorsHeaders(res, req, config);
    }

    // 10. Optional global daily cap
    if (config.dailyCap && config.dailyCap > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const capKey = `global:daily:${today}`;
      const withinCap = await deps.store.hit(capKey, config.dailyCap, 86400);
      if (!withinCap) {
        const res = jsonResponse(429, { error: "daily_capacity_reached" });
        return applyCorsHeaders(res, req, config);
      }
    }

    // 10b. Demo mode check: if request is a demo, acknowledge success without notifying real providers
    const reqUrl = new URL(req.url, "http://localhost");
    const isDemo = Boolean(
      body.demo ||
      req.headers.get("x-whodunit-demo") === "true" ||
      reqUrl.searchParams.get("demo") === "1" ||
      reqUrl.searchParams.get("demo") === "true"
    );
    if (isDemo) {
      const res = new Response(null, { status: 204 });
      return applyCorsHeaders(res, req, config);
    }

    // 11. Multi-provider dispatch
    if (!deps.providers || deps.providers.length === 0) {
      const res = jsonResponse(500, { error: "no_providers_configured" });
      return applyCorsHeaders(res, req, config);
    }

    try {
      await Promise.all(deps.providers.map((p) => p.send({ text, title })));
      const res = new Response(null, { status: 204 });
      return applyCorsHeaders(res, req, config);
    } catch {
      const res = jsonResponse(502, { error: "delivery_failed" });
      return applyCorsHeaders(res, req, config);
    }
  };
}
