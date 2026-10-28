import type { RateLimitStore } from "@whodunit/core";

export interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/**
 * Cloudflare KV rate limit store adapter.
 */
export class KVRateLimitStore implements RateLimitStore {
  constructor(private kv: KVNamespaceLike) {}

  async hit(key: string, limit: number, windowSec: number): Promise<boolean> {
    const kvKey = `rl:${key}`;
    const raw = await this.kv.get(kvKey);
    const count = raw ? parseInt(raw, 10) : 0;

    if (count >= limit) {
      return false;
    }

    await this.kv.put(kvKey, String(count + 1), { expirationTtl: windowSec });
    return true;
  }
}
