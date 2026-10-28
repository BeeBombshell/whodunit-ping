import type { Provider } from "@whodunit/core";
import { DiscordProvider } from "./discord.js";
import { EmailProvider } from "./email.js";
import { NtfyProvider } from "./ntfy.js";
import { PushoverProvider } from "./pushover.js";
import { TelegramProvider } from "./telegram.js";

/**
 * Resolves and instantiates active notification providers from environment variables.
 * Multiple providers can be configured by separating names with commas: e.g. "ntfy,telegram"
 */
export function resolveProviders(env: Record<string, string | undefined>): Provider[] {
  const providerNames = (env["PROVIDER"] || "ntfy")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const providers: Provider[] = [];

  for (const name of providerNames) {
    switch (name) {
      case "ntfy": {
        const topic = env["NTFY_TOPIC"];
        if (!topic) {
          throw new Error("Missing required environment variable 'NTFY_TOPIC' for ntfy provider");
        }
        providers.push(
          new NtfyProvider({
            topic,
            serverUrl: env["NTFY_SERVER"],
            token: env["NTFY_TOKEN"],
          })
        );
        break;
      }

      case "pushover": {
        const token = env["PUSHOVER_TOKEN"];
        const user = env["PUSHOVER_USER"];
        if (!token || !user) {
          throw new Error(
            "Missing required environment variables 'PUSHOVER_TOKEN' or 'PUSHOVER_USER' for pushover provider"
          );
        }
        providers.push(new PushoverProvider({ token, user }));
        break;
      }

      case "telegram": {
        const botToken = env["TELEGRAM_BOT_TOKEN"];
        const chatId = env["TELEGRAM_CHAT_ID"];
        if (!botToken || !chatId) {
          throw new Error(
            "Missing required environment variables 'TELEGRAM_BOT_TOKEN' or 'TELEGRAM_CHAT_ID' for telegram provider"
          );
        }
        providers.push(new TelegramProvider({ botToken, chatId }));
        break;
      }

      case "discord": {
        const webhookUrl = env["DISCORD_WEBHOOK_URL"];
        if (!webhookUrl) {
          throw new Error(
            "Missing required environment variable 'DISCORD_WEBHOOK_URL' for discord provider"
          );
        }
        providers.push(new DiscordProvider({ webhookUrl }));
        break;
      }

      case "email": {
        providers.push(
          new EmailProvider({
            apiKey: env["RESEND_API_KEY"],
            toEmail: env["EMAIL_TO"],
            fromEmail: env["EMAIL_FROM"],
            webhookUrl: env["EMAIL_WEBHOOK_URL"],
          })
        );
        break;
      }

      default:
        throw new Error(
          `Unknown provider '${name}'. Supported providers: ntfy, pushover, telegram, discord, email`
        );
    }
  }

  return providers;
}
