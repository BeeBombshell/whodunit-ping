import { describe, expect, it } from "vitest";
import { dailyHash } from "../src/crypto.js";

describe("dailyHash", () => {
  it("produces deterministic 64-char sha-256 hex string for same input on same day", async () => {
    const hash1 = await dailyHash("192.168.1.100", "my-salt");
    const hash2 = await dailyHash("192.168.1.100", "my-salt");

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
  });

  it("produces different hashes for different IPs or salts", async () => {
    const hash1 = await dailyHash("1.1.1.1", "salt");
    const hash2 = await dailyHash("1.1.1.2", "salt");
    const hash3 = await dailyHash("1.1.1.1", "other-salt");

    expect(hash1).not.toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });
});
