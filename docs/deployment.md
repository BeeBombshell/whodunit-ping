# Deployment Guide

Whodunit was architected from day one to run on virtually any modern edge or containerized runtime.

## Cloudflare Workers

Cloudflare Workers provides the lowest latency and is completely free for typical personal traffic limits:

```bash
cd examples/cloudflare-worker
npx wrangler deploy
```

Set environment secrets via Wrangler:
```bash
npx wrangler secret put NTFY_TOPIC
```

## Docker Container

A multi-stage `Dockerfile` is provided in `examples/docker-compose/`:

```bash
docker compose -f examples/docker-compose/docker-compose.yml up -d
```

## Self-Hosted Node.js Server

Run on any Linux VPS or Raspberry Pi:

```bash
pnpm install
pnpm build
node packages/adapters/node/dist/server.js
```

Use systemd, pm2, or supervisor to keep the process running.

## Vercel Edge Functions

Import `@whodunit/adapter-vercel` into your API route (`api/ping.ts`):

```ts
import handler from "@whodunit/adapter-vercel";

export const config = {
  runtime: "edge",
};

export default handler;
```
