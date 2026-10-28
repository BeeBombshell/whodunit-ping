import type { BotCheck } from "../types.js";

/**
 * No-operation bot check. Always approves requests.
 */
export class NoopBotCheck implements BotCheck {
  readonly name = "none";

  async verify(_token?: string, _ip?: string): Promise<boolean> {
    return true;
  }
}
