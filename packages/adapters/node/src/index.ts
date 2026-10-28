import type { IncomingMessage, ServerResponse } from "node:http";
import type { Config } from "@whodunit/core";
import { createHandler, MemoryRateLimitStore, NoopBotCheck, TurnstileBotCheck } from "@whodunit/core";
import { resolveProviders } from "@whodunit/providers";

/**
 * Converts standard Node.js IncomingMessage into a Web-standard Request object.
 */
export async function nodeRequestToWebRequest(req: IncomingMessage): Promise<Request> {
  const protocol = (req.headers["x-forwarded-proto"] as string) || "http";
  const host = req.headers.host || "localhost";
  const url = `${protocol}://${host}${req.url || "/"}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else {
        headers.set(key, value);
      }
    }
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let body: ReadableStream<Uint8Array> | null = null;

  if (hasBody) {
    body = new ReadableStream<Uint8Array>({
      start(controller) {
        req.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
        req.on("end", () => controller.close());
        req.on("error", (err) => controller.error(err));
      },
    });
  }

  return new Request(url, {
    method: req.method,
    headers,
    body: hasBody ? (body as any) : undefined,
    duplex: hasBody ? "half" : undefined,
  } as RequestInit);
}

/**
 * Streams a Web-standard Response object into a Node.js ServerResponse.
 */
export async function sendWebResponseToNode(webRes: Response, res: ServerResponse): Promise<void> {
  res.statusCode = webRes.status;
  res.statusMessage = webRes.statusText;

  webRes.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!webRes.body) {
    res.end();
    return;
  }

  const reader = webRes.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } finally {
    res.end();
  }
}

/**
 * Creates a Node.js request listener from an environment config.
 */
export function createNodeHandler(env: Record<string, string | undefined> = process.env) {
  const providers = resolveProviders(env);
  const store = new MemoryRateLimitStore();

  const botCheck =
    env["BOT_CHECK"] === "turnstile" && env["TURNSTILE_SECRET_KEY"]
      ? new TurnstileBotCheck(env["TURNSTILE_SECRET_KEY"])
      : new NoopBotCheck();

  const config: Config = {
    allowedOrigins: env["ALLOWED_ORIGINS"]
      ? env["ALLOWED_ORIGINS"].split(",").map((s) => s.trim())
      : undefined,
    maxLength: env["MAX_LENGTH"] ? parseInt(env["MAX_LENGTH"], 10) : 500,
    rateLimit: env["RATE_LIMIT"] ? parseInt(env["RATE_LIMIT"], 10) : 5,
    rateLimitWindowSec: env["RATE_LIMIT_WINDOW_SEC"]
      ? parseInt(env["RATE_LIMIT_WINDOW_SEC"], 10)
      : 3600,
    dailyCap: env["DAILY_CAP"] ? parseInt(env["DAILY_CAP"], 10) : undefined,
    title: env["TITLE_PREFIX"] || "Whodunit Ping",
    disabled: env["DISABLED"] === "true",
    salt: env["SALT"] || "whodunit-node-salt",
  };

  const handler = createHandler(config, { providers, store, botCheck });

  return async (req: IncomingMessage, res: ServerResponse) => {
    // Basic health check endpoint
    if (req.url === "/health" || req.url === "/healthz") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ status: "healthy", version: "0.1.0" }));
      return;
    }

    try {
      const webReq = await nodeRequestToWebRequest(req);
      const webRes = await handler(webReq);
      await sendWebResponseToNode(webRes, res);
    } catch {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "internal_server_error" }));
    }
  };
}
