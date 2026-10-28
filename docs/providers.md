# Supported Notification Providers

Whodunit ships with adapters for the most popular notification channels.

## 1. ntfy (Recommended)

[ntfy.sh](https://ntfy.sh) is a free, open-source HTTP-based pub-sub push notification service. You don't even need an account to use it.

1. Install the ntfy app on your phone (iOS / Android) or use desktop web notifications.
2. Subscribe to a hard-to-guess topic name (e.g., `whodunit-ping-8f3a9e2c`).
3. Set your environment variables:
   ```env
   PROVIDER=ntfy
   NTFY_TOPIC=whodunit-ping-8f3a9e2c
   # Optional self-hosted server:
   # NTFY_SERVER=https://ntfy.example.com
   ```

## 2. Pushover

[Pushover](https://pushover.net) delivers real-time notifications to Android, iPhone, iPad, and Desktop.

1. Sign up on Pushover and note your **User Key**.
2. Create an Application in your dashboard to get an **API Token**.
3. Set environment variables:
   ```env
   PROVIDER=pushover
   PUSHOVER_TOKEN=your_app_token_here
   PUSHOVER_USER=your_user_key_here
   ```

## 3. Telegram

Receive pings directly in your private Telegram chat or channel.

1. Message [@BotFather](https://t.me/BotFather) on Telegram to create a bot and get a bot token.
2. Send a message to your new bot, then retrieve your user/chat ID using [@userinfobot](https://t.me/userinfobot).
3. Set environment variables:
   ```env
   PROVIDER=telegram
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
   TELEGRAM_CHAT_ID=987654321
   ```

## 4. Discord

Post anonymous pings into a private Discord channel.

1. In your Discord server, go to **Server Settings > Integrations > Webhooks**.
2. Click **New Webhook**, select your private channel, and copy the Webhook URL.
3. Set environment variables:
   ```env
   PROVIDER=discord
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   ```

## 5. Multi-Provider Dispatch

You can notify multiple services simultaneously by comma-separating provider names:

```env
PROVIDER=ntfy,discord
NTFY_TOPIC=my-secret-topic
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```
