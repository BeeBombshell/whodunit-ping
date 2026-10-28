import type { Provider } from "@whodunit/core";

export interface PushoverProviderConfig {
  token: string;
  user: string;
  device?: string;
  sound?: string;
}

/**
 * Pushover notification provider.
 */
export class PushoverProvider implements Provider {
  readonly name = "pushover";

  constructor(private config: PushoverProviderConfig) {
    if (!config.token || !config.user) {
      throw new Error("PushoverProvider requires both 'token' and 'user'");
    }
  }

  async send(msg: { text: string; title?: string }): Promise<void> {
    const formData = new URLSearchParams();
    formData.append("token", this.config.token);
    formData.append("user", this.config.user);
    formData.append("message", msg.text);
    if (msg.title) {
      formData.append("title", msg.title);
    }
    if (this.config.device) {
      formData.append("device", this.config.device);
    }
    if (this.config.sound) {
      formData.append("sound", this.config.sound);
    }

    const res = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Pushover delivery failed with status ${res.status}: ${res.statusText}`);
    }
  }
}
