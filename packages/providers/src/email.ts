import type { Provider } from "@whodunit/core";

export interface EmailProviderConfig {
  /**
   * Resend API Key or Webhook endpoint URL.
   */
  apiKey?: string;
  toEmail?: string;
  fromEmail?: string;
  webhookUrl?: string;
}

/**
 * Email notification provider using Resend API or generic email webhook.
 */
export class EmailProvider implements Provider {
  readonly name = "email";

  constructor(private config: EmailProviderConfig) {
    if (!config.apiKey && !config.webhookUrl) {
      throw new Error("EmailProvider requires either 'apiKey' (Resend) or 'webhookUrl'");
    }
  }

  async send(msg: { text: string; title?: string }): Promise<void> {
    if (this.config.apiKey && this.config.toEmail) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.config.fromEmail || "Whodunit <onboarding@resend.dev>",
          to: this.config.toEmail,
          subject: msg.title || "Whodunit Ping",
          text: msg.text,
        }),
      });

      if (!res.ok) {
        throw new Error(`Resend email delivery failed with status ${res.status}`);
      }
      return;
    }

    if (this.config.webhookUrl) {
      const res = await fetch(this.config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: msg.title || "Whodunit Ping",
          text: msg.text,
        }),
      });

      if (!res.ok) {
        throw new Error(`Email webhook delivery failed with status ${res.status}`);
      }
    }
  }
}
