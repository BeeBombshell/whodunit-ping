import { afterEach, describe, expect, it, vi } from "vitest";
import { DiscordProvider } from "../src/discord.js";
import { resolveProviders } from "../src/factory.js";
import { NtfyProvider } from "../src/ntfy.js";
import { PushoverProvider } from "../src/pushover.js";
import { TelegramProvider } from "../src/telegram.js";

describe("Providers", () => {
  const globalFetch = global.fetch;

  afterEach(() => {
    global.fetch = globalFetch;
  });

  it("NtfyProvider formats request and sends to topic", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock;

    const provider = new NtfyProvider({ topic: "secret-topic" });
    await provider.send({ text: "Ping test", title: "Whodunit" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://ntfy.sh/secret-topic",
      expect.objectContaining({
        method: "POST",
        body: "Ping test",
        headers: expect.objectContaining({
          Title: "Whodunit",
        }),
      })
    );
  });

  it("TelegramProvider sends HTML formatted message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock;

    const provider = new TelegramProvider({ botToken: "tok123", chatId: "chat456" });
    await provider.send({ text: "Hello <world>", title: "Alert" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.telegram.org/bottok123/sendMessage",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          chat_id: "chat456",
          text: "🔔 <b>Alert</b>\n\nHello &lt;world&gt;",
          parse_mode: "HTML",
        }),
      })
    );
  });

  it("DiscordProvider sends formatted embed", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock;

    const provider = new DiscordProvider({ webhookUrl: "https://discord.com/webhook" });
    await provider.send({ text: "Discord msg", title: "Note" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://discord.com/webhook",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("Discord msg"),
      })
    );
  });

  it("PushoverProvider encodes URL form parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock;

    const provider = new PushoverProvider({ token: "appToken", user: "userKey" });
    await provider.send({ text: "Pushover note", title: "Pushover Title" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.pushover.net/1/messages.json",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
    );
  });

  it("resolveProviders parses multiple providers and validates env", () => {
    const providers = resolveProviders({
      PROVIDER: "ntfy,discord",
      NTFY_TOPIC: "test-topic",
      DISCORD_WEBHOOK_URL: "https://discord.com/webhook",
    });

    expect(providers).toHaveLength(2);
    expect(providers[0].name).toBe("ntfy");
    expect(providers[1].name).toBe("discord");
  });

  it("resolveProviders throws error for missing required credentials", () => {
    expect(() =>
      resolveProviders({
        PROVIDER: "telegram",
      })
    ).toThrowError(/TELEGRAM_BOT_TOKEN/);
  });
});
