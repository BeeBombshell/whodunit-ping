import type { Provider } from "@whodunit/core";

export interface TelegramProviderConfig {
  botToken: string;
  chatId: string;
}

/**
 * Telegram Bot notification provider.
 */
export class TelegramProvider implements Provider {
  readonly name = "telegram";

  constructor(private config: TelegramProviderConfig) {
    if (!config.botToken || !config.chatId) {
      throw new Error("TelegramProvider requires both 'botToken' and 'chatId'");
    }
  }

  async send(msg: { text: string; title?: string }): Promise<void> {
    const titlePart = msg.title ? `🔔 <b>${escapeHtml(msg.title)}</b>\n\n` : "";
    const htmlMessage = `${titlePart}${escapeHtml(msg.text)}`;

    const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: this.config.chatId,
        text: htmlMessage,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      throw new Error(`Telegram delivery failed with status ${res.status}: ${res.statusText}`);
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
