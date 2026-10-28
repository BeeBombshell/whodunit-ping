import type { RateLimitStore } from "../types.js";

/**
 * Sliding-window in-memory rate limit store.
 * Automatically purges expired timestamps. Suitable for single-instance Node or dev use.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly hits = new Map<string, number[]>();
  private lastPrune = Date.now();

  async hit(key: string, limit: number, windowSec: number): Promise<boolean> {
    const now = Date.now();
    const windowMs = windowSec * 1000;
    const threshold = now - windowMs;

    // Prune stale records occasionally
    if (now - this.lastPrune > 60000) {
      this.prune(now, windowMs);
    }

    const timestamps = this.hits.get(key) ?? [];
    const active = timestamps.filter((t) => t > threshold);

    if (active.length >= limit) {
      this.hits.set(key, active);
      return false; // Limit exceeded
    }

    active.push(now);
    this.hits.set(key, active);
    return true;
  }

  private prune(now: number, windowMs: number): void {
    this.lastPrune = now;
    const cutoff = now - windowMs;
    for (const [key, timestamps] of this.hits.entries()) {
      const active = timestamps.filter((t) => t > cutoff);
      if (active.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, active);
      }
    }
  }

  /**
   * Clears all recorded entries (useful for testing).
   */
  clear(): void {
    this.hits.clear();
  }
}
