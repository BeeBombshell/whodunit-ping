import type { Config } from "@whodunit/core";
import { createHandler, MemoryRateLimitStore, NoopBotCheck, TurnstileBotCheck } from "@whodunit/core";
import { resolveProviders } from "@whodunit/providers";
import { KVRateLimitStore, type KVNamespaceLike } from "./kv-store.js";

export interface Env {
  RATE_LIMIT_KV?: KVNamespaceLike;
  PROVIDER?: string;
  NTFY_TOPIC?: string;
  NTFY_SERVER?: string;
  NTFY_TOKEN?: string;
  PUSHOVER_TOKEN?: string;
  PUSHOVER_USER?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  DISCORD_WEBHOOK_URL?: string;
  ALLOWED_ORIGINS?: string;
  MAX_LENGTH?: string;
  RATE_LIMIT?: string;
  RATE_LIMIT_WINDOW_SEC?: string;
  DAILY_CAP?: string;
  TITLE_PREFIX?: string;
  BOT_CHECK?: string;
  TURNSTILE_SECRET_KEY?: string;
  DISABLED?: string;
  SALT?: string;
  [key: string]: any;
}

export { KVRateLimitStore };

/**
 * Standard Cloudflare Worker export.
 */
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const providers = resolveProviders(env as any);
    const store = env.RATE_LIMIT_KV ? new KVRateLimitStore(env.RATE_LIMIT_KV) : new MemoryRateLimitStore();

    const botCheck =
      env.BOT_CHECK === "turnstile" && env.TURNSTILE_SECRET_KEY
        ? new TurnstileBotCheck(env.TURNSTILE_SECRET_KEY)
        : new NoopBotCheck();

    const config: Config = {
      allowedOrigins: env.ALLOWED_ORIGINS
        ? env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
        : undefined,
      maxLength: env.MAX_LENGTH ? parseInt(env.MAX_LENGTH, 10) : 500,
      rateLimit: env.RATE_LIMIT ? parseInt(env.RATE_LIMIT, 10) : 5,
      rateLimitWindowSec: env.RATE_LIMIT_WINDOW_SEC
        ? parseInt(env.RATE_LIMIT_WINDOW_SEC, 10)
        : 3600,
      dailyCap: env.DAILY_CAP ? parseInt(env.DAILY_CAP, 10) : undefined,
      title: env.TITLE_PREFIX || "Whodunit Ping",
      disabled: env.DISABLED === "true",
      salt: env.SALT || "whodunit-cloudflare-salt",
    };

    const handler = createHandler(config, { providers, store, botCheck });
    return handler(req);
  },
};
