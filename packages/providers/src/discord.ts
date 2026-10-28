import type { Provider } from "@whodunit/core";

export interface DiscordProviderConfig {
  webhookUrl: string;
}

/**
 * Discord Webhook notification provider.
 */
export class DiscordProvider implements Provider {
  readonly name = "discord";

  constructor(private config: DiscordProviderConfig) {
    if (!config.webhookUrl) {
      throw new Error("DiscordProvider requires 'webhookUrl'");
    }
  }

  async send(msg: { text: string; title?: string }): Promise<void> {
    const payload = {
      embeds: [
        {
          title: msg.title || "Whodunit Ping",
          description: msg.text,
          color: 0x5865f2, // Discord Blurple
          footer: {
            text: "Anonymous ping via Whodunit",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const res = await fetch(this.config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Discord delivery failed with status ${res.status}: ${res.statusText}`);
    }
  }
}
