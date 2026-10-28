import type { Config } from "./types.js";

/**
 * Checks if the Origin header is allowed by the configuration.
 */
export function isOriginAllowed(origin: string | null, allowedOrigins?: string[]): boolean {
  // If no origin header (same-origin, curl, server-to-server), allow it
  if (!origin) {
    return true;
  }

  // If no allowedOrigins configured, deny by default for security
  if (!allowedOrigins || allowedOrigins.length === 0) {
    return false;
  }

  // Wildcard allow
  if (allowedOrigins.includes("*")) {
    return true;
  }

  return allowedOrigins.includes(origin);
}

/**
 * Returns CORS preflight Response for OPTIONS requests.
 */
export function handleCorsPreflight(req: Request, config: Config): Response {
  const origin = req.headers.get("Origin");

  if (!isOriginAllowed(origin, config.allowedOrigins)) {
    return new Response(null, { status: 403 });
  }

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin ?? "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Vary", "Origin");

  return new Response(null, { status: 204, headers });
}

/**
 * Attaches CORS headers to an outgoing response.
 */
export function applyCorsHeaders(res: Response, req: Request, config: Config): Response {
  const origin = req.headers.get("Origin");
  if (!origin || !isOriginAllowed(origin, config.allowedOrigins)) {
    return res;
  }

  const newHeaders = new Headers(res.headers);
  newHeaders.set("Access-Control-Allow-Origin", config.allowedOrigins?.includes("*") ? "*" : origin);
  newHeaders.set("Vary", "Origin");

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders,
  });
}
