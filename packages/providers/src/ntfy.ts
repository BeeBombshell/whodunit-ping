import type { Provider } from "@whodunit/core";

export interface NtfyProviderConfig {
  /**
   * The private ntfy topic name.
   */
  topic: string;

  /**
   * Optional custom/self-hosted ntfy server URL (default: "https://ntfy.sh").
   */
  serverUrl?: string;

  /**
   * Optional access token for password/token-protected ntfy topics.
   */
  token?: string;
}

/**
 * ntfy provider: simple, open-source HTTP-based push notifications.
 */
export class NtfyProvider implements Provider {
  readonly name = "ntfy";

  constructor(private config: NtfyProviderConfig) {
    if (!config.topic) {
      throw new Error("NtfyProvider requires a 'topic' configuration");
    }
  }

  async send(msg: { text: string; title?: string }): Promise<void> {
    const server = (this.config.serverUrl || "https://ntfy.sh").replace(/\/+$/, "");
    const url = `${server}/${encodeURIComponent(this.config.topic)}`;

    const headers: Record<string, string> = {
      Title: msg.title || "Whodunit Ping",
      Priority: "default",
      Tags: "speech_balloon,mailbox",
    };

    if (this.config.token) {
      headers["Authorization"] = `Bearer ${this.config.token}`;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: msg.text,
    });

    if (!res.ok) {
      throw new Error(`ntfy delivery failed with status ${res.status}: ${res.statusText}`);
    }
  }
}
