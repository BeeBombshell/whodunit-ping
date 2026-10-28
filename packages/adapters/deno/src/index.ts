import type { Config } from "@whodunit/core";
import { createHandler, MemoryRateLimitStore, NoopBotCheck, TurnstileBotCheck } from "@whodunit/core";
import { resolveProviders } from "@whodunit/providers";

/**
 * Creates a Deno / Bun native fetch handler from environment variables.
 * Usage:
 *   Deno.serve(createDenoHandler());
 *   or Bun.serve({ fetch: createDenoHandler() });
 */
export function createDenoHandler(env: Record<string, string | undefined> = (globalThis as any).Deno?.env?.toObject() || (globalThis as any).process?.env || {}) {
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
    salt: env["SALT"] || "whodunit-deno-salt",
  };

  return createHandler(config, { providers, store, botCheck });
}
