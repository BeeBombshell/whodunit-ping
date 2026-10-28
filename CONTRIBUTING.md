# Contributing to Whodunit

Thank you for contributing to Whodunit! We want to make it as simple as possible to add new notification providers, rate-limit stores, runtime adapters, or frontend improvements.

## Development Setup

Whodunit uses a `pnpm` monorepo:

```bash
# Clone the repository
git clone https://github.com/your-username/whodunit.git
cd whodunit

# Install dependencies across all packages
pnpm install

# Run unit tests
pnpm test

# Build all packages
pnpm build
```

## Repository Structure

- `packages/core`: Core request handler, validation, rate limiting, and provider contracts.
- `packages/providers`: Notification provider adapters (ntfy, Pushover, Telegram, Discord, email).
- `packages/widget`: `<whodunit-form>` web component.
- `packages/adapters`: Deployment entrypoints (Cloudflare Workers, Node/Docker, Vercel, Deno).
- `examples`: Standalone showcase and deployment templates.

## How to Add a New Provider in 10 Minutes

Adding a new notification service (e.g. Matrix, Slack, Gotify, Apprise) takes just one file:

1. Create `packages/providers/src/myprovider.ts`:
   ```ts
   import type { Provider } from "@whodunit/core";

   export interface MyProviderConfig {
     webhookUrl: string;
   }

   export class MyProvider implements Provider {
     readonly name = "myprovider";

     constructor(private config: MyProviderConfig) {}

     async send(msg: { text: string; title?: string }): Promise<void> {
       const res = await fetch(this.config.webhookUrl, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ content: `**${msg.title ?? "Ping"}**: ${msg.text}` }),
       });

       if (!res.ok) {
         throw new Error(`MyProvider failed with status ${res.status}`);
       }
     }
   }
   ```
2. Export it in `packages/providers/src/index.ts` and register it in `packages/providers/src/factory.ts`.
3. Add a unit test in `packages/providers/tests/myprovider.test.ts`.
4. Document the environment variables in `.env.example` and `docs/`.

## Pull Request Guidelines

- Ensure tests pass with `pnpm test`.
- Ensure types pass with `pnpm typecheck`.
- Keep core dependencies minimal — web standards only.
