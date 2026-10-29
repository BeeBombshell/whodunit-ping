/**
 * Notification provider contract.
 * Any service (ntfy, Pushover, Telegram, Discord, etc.) implements this interface.
 */
export interface Provider {
  readonly name: string;
  send(msg: { text: string; title?: string }): Promise<void>;
}

/**
 * Ephemeral rate-limiting storage interface.
 * Returns true if request is permitted, false if rate limited.
 */
export interface RateLimitStore {
  hit(key: string, limit: number, windowSec: number): Promise<boolean>;
}

/**
 * Anti-bot verification interface (Turnstile, hCaptcha, or no-op).
 */
export interface BotCheck {
  readonly name: string;
  verify(token?: string, ip?: string): Promise<boolean>;
}

/**
 * Core engine configuration options.
 */
export interface Config {
  /**
   * Allowed CORS origins. Can be exact origin strings or '*' for any origin.
   * If empty or undefined, all cross-origin requests are denied.
   */
  allowedOrigins?: string[];

  /**
   * Maximum character length allowed for incoming message (default: 500).
   */
  maxLength?: number;

  /**
   * Rate limit threshold: maximum allowed hits per window (default: 5).
   */
  rateLimit?: number;

  /**
   * Rate limit window duration in seconds (default: 3600 = 1 hour).
   */
  rateLimitWindowSec?: number;

  /**
   * Global daily cap to prevent phone notification floods (optional).
   */
  dailyCap?: number;

  /**
   * Prefix or title for notifications (default: "Whodunit").
   */
  title?: string;

  /**
   * Emergency kill-switch: if true, all requests receive 503 Service Unavailable.
   */
  disabled?: boolean;

  /**
   * Secret salt used for hashing client IP addresses in rate limit checks.
   */
  salt?: string;
}

/**
 * Injected dependencies for the handler.
 */
export interface HandlerDeps {
  providers: Provider[];
  store: RateLimitStore;
  botCheck?: BotCheck;
}

/**
 * Request payload structure expected from web clients.
 */
export interface PingPayload {
  message?: string;
  hp?: string; // Honeypot trap: must be empty
  token?: string; // Bot challenge response token
  demo?: boolean; // If true, simulated demo mode (delivers only on-page, no notification push)
}

