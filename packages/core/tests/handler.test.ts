import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHandler } from "../src/handler.js";
import { MemoryRateLimitStore } from "../src/stores/memory.js";
import type { Provider } from "../src/types.js";

describe("createHandler", () => {
  let mockProvider: Provider;
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    mockProvider = {
      name: "mock",
      send: vi.fn().mockResolvedValue(undefined),
    };
    store = new MemoryRateLimitStore();
  });

  it("handles OPTIONS preflight with CORS headers", async () => {
    const handler = createHandler(
      { allowedOrigins: ["https://example.com"] },
      { providers: [mockProvider], store }
    );

    const req = new Request("https://api.example.com/ping", {
      method: "OPTIONS",
      headers: { Origin: "https://example.com" },
    });

    const res = await handler(req);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
  });

  it("rejects unauthorized CORS origins", async () => {
    const handler = createHandler(
      { allowedOrigins: ["https://example.com"] },
      { providers: [mockProvider], store }
    );

    const req = new Request("https://api.example.com/ping", {
      method: "POST",
      headers: {
        Origin: "https://evil.com",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "hello" }),
    });

    const res = await handler(req);
    expect(res.status).toBe(403);
  });

  it("rejects non-POST methods", async () => {
    const handler = createHandler({}, { providers: [mockProvider], store });
    const req = new Request("https://api.example.com/ping", { method: "GET" });
    const res = await handler(req);
    expect(res.status).toBe(405);
  });

  it("processes valid message and dispatches to providers", async () => {
    const handler = createHandler({}, { providers: [mockProvider], store });
    const req = new Request("https://api.example.com/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Whodunit secret note" }),
    });

    const res = await handler(req);
    expect(res.status).toBe(204);
    expect(mockProvider.send).toHaveBeenCalledWith({
      text: "Whodunit secret note",
      title: "Whodunit Ping",
    });
  });

  it("silently traps bot honeypot and returns 204 without sending message", async () => {
    const handler = createHandler({}, { providers: [mockProvider], store });
    const req = new Request("https://api.example.com/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Spam message",
        hp: "I am a bot filling every input",
      }),
    });

    const res = await handler(req);
    expect(res.status).toBe(204);
    expect(mockProvider.send).not.toHaveBeenCalled();
  });

  it("enforces rate limits", async () => {
    const handler = createHandler(
      { rateLimit: 2, rateLimitWindowSec: 60 },
      { providers: [mockProvider], store }
    );

    const createReq = () =>
      new Request("https://api.example.com/ping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CF-Connecting-IP": "203.0.113.195",
        },
        body: JSON.stringify({ message: "ping" }),
      });

    const res1 = await handler(createReq());
    expect(res1.status).toBe(204);

    const res2 = await handler(createReq());
    expect(res2.status).toBe(204);

    const res3 = await handler(createReq());
    expect(res3.status).toBe(429);
  });

  it("honors emergency kill switch", async () => {
    const handler = createHandler({ disabled: true }, { providers: [mockProvider], store });
    const req = new Request("https://api.example.com/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "ping" }),
    });

    const res = await handler(req);
    expect(res.status).toBe(503);
    expect(mockProvider.send).not.toHaveBeenCalled();
  });
});
