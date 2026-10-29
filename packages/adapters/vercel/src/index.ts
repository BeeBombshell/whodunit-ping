import type { Config } from "@whodunit/core";
import { createHandler, MemoryRateLimitStore, NoopBotCheck, TurnstileBotCheck } from "@whodunit/core";
import { resolveProviders } from "@whodunit/providers";

/**
 * Vercel Edge / Serverless Web-standard handler.
 */
export function createVercelHandler(env: Record<string, string | undefined> = process.env) {
  let cachedHandler: ((req: Request) => Promise<Response>) | null = null;
  let initError: Error | null = null;

  function getHandler() {
    if (cachedHandler) return cachedHandler;
    if (initError) throw initError;

    try {
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
        salt: env["SALT"] || "whodunit-vercel-salt",
      };

      cachedHandler = createHandler(config, { providers, store, botCheck });
      return cachedHandler;
    } catch (err: any) {
      initError = err;
      throw err;
    }
  }

  return async (req: Request): Promise<Response> => {
    try {
      const url = new URL(req.url);
      if (url.pathname === "/health" || url.pathname === "/healthz") {
        return new Response(JSON.stringify({ status: "healthy", version: "0.1.0" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch {}

    try {
      const handler = getHandler();
      return await handler(req);
    } catch (err: any) {
      console.error("[Whodunit Initialization Error]", err.message);
      return new Response(
        JSON.stringify({
          error: "configuration_error",
          message: err.message || "Failed to initialize Whodunit provider configuration",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}

export default createVercelHandler();
