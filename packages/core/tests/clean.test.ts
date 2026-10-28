import { describe, expect, it } from "vitest";
import { cleanMessage } from "../src/clean.js";

describe("cleanMessage", () => {
  it("rejects non-strings and empty input", () => {
    expect(cleanMessage(null)).toBeNull();
    expect(cleanMessage(undefined)).toBeNull();
    expect(cleanMessage(1234)).toBeNull();
    expect(cleanMessage("")).toBeNull();
    expect(cleanMessage("    ")).toBeNull();
  });

  it("trims whitespace and preserves valid printable text", () => {
    expect(cleanMessage("  Hello anonymous world!  ")).toBe("Hello anonymous world!");
    expect(cleanMessage("Line 1\nLine 2\tTabbed")).toBe("Line 1\nLine 2\tTabbed");
  });

  it("strips harmful control characters and escape sequences", () => {
    const raw = "Dangerous\x00\x07\x1B[31mText\x7F";
    const cleaned = cleanMessage(raw);
    expect(cleaned).toBe("Dangerous[31mText");
  });

  it("truncates at maxLength limit", () => {
    const long = "a".repeat(100);
    const cleaned = cleanMessage(long, 10);
    expect(cleaned?.length).toBe(10);
    expect(cleaned).toBe("aaaaaaaaaa");
  });
});
