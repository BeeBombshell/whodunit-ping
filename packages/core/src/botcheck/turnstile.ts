import type { BotCheck } from "../types.js";

/**
 * Cloudflare Turnstile token verifier.
 */
export class TurnstileBotCheck implements BotCheck {
  readonly name = "turnstile";

  constructor(private secretKey: string) {}

  async verify(token?: string, ip?: string): Promise<boolean> {
    if (!token) {
      return false;
    }

    try {
      const formData = new URLSearchParams();
      formData.append("secret", this.secretKey);
      formData.append("response", token);
      if (ip) {
        formData.append("remoteip", ip);
      }

      const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        return false;
      }

      const outcome = (await res.json()) as { success?: boolean };
      return outcome.success === true;
    } catch {
      return false;
    }
  }
}
