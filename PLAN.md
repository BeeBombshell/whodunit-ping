# Implementation Plan: `whodunit` Monorepo Scaffold

"Somebody pinged you. Nobody knows who."
A tiny, portable, privacy-first anonymous "ping me" form and notification dispatch engine.

## Overview & Architecture

Whodunit is designed as a modular, provider-agnostic, zero-telemetry push notification bridge. A web visitor submits a short anonymous note via `<whodunit-form>` or HTTP POST, and the owner receives a push notification on their phone (via ntfy, Pushover, Telegram, Discord, etc.) with zero sender identification, zero persistent logs, and zero tracking.

```
 Any website / Static page
 ┌─────────────────────────────────────────┐
 │ <whodunit-form endpoint="/ping">        │  Web component (custom element)
 └────────────────────┬────────────────────┘
                      │ POST /ping { message, token?, hp }
                      ▼
 ┌────────────────────────────────────────────────────────┐
 │ @whodunit/core (Web-standard Request → Response)       │
 │  1. CORS & allowed origins check                       │
 │  2. Parse & length/type validation                     │
 │  3. Honeypot check (silent discard on bots)            │
 │  4. Bot check verifier (Turnstile / hCaptcha / none)   │
 │  5. Ephemeral salted rate limiting (daily rotating)    │
 │  6. Content sanitization (control characters stripped) │
 │  7. Multi-provider dispatch                            │
 └─────────────┬────────────────────────────┬─────────────┘
               │ RateLimitStore             │ Provider adapters
               ▼                            ▼
        Memory / KV / Redis       ntfy · Pushover · Telegram · Discord
```

---

## Monorepo Layout

```
whodunit/
├── packages/
│   ├── core/                  # @whodunit/core: web-standard request handler & engine
│   ├── providers/             # @whodunit/providers: ntfy, pushover, telegram, discord, email
│   ├── widget/                # @whodunit/widget: <whodunit-form> custom element
│   └── adapters/
│       ├── cloudflare/        # @whodunit/adapter-cloudflare
│       ├── node/              # @whodunit/adapter-node
│       ├── vercel/            # @whodunit/adapter-vercel
│       └── deno/              # @whodunit/adapter-deno
├── examples/
│   ├── static-page/           # Standalone /ping demo with live widget
│   ├── cloudflare-worker/     # Deploy-ready CF Worker with wrangler.jsonc
│   ├── docker-compose/        # Node-based containerized server & Dockerfile
│   └── hugo-astro-next/       # Snippets for embedding into static site generators
├── docs/                      # Platform setup guides, provider specs, privacy FAQ
├── .github/
│   ├── workflows/ci.yml       # Vitest, lint, typecheck, build
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── LICENSE                    # MIT
├── README.md                  # Quickstart, architecture, privacy promise
├── DECISIONS.md               # Architecture Decision Records (ADRs)
├── CONTRIBUTING.md            # "How to add a provider", dev setup
├── CODE_OF_CONDUCT.md         # Contributor Covenant
├── SECURITY.md                # Privacy guarantees & vulnerability reporting
└── CHANGELOG.md
```

---

## Scaffolding Status & Checklist

- [x] **Phase 0: Foundations & Project Configuration**
  - [x] Initialized Git repository
  - [x] Root `package.json` with pnpm workspace scripts
  - [x] `pnpm-workspace.yaml` configuring `packages/*`, `packages/adapters/*`, and `examples/*`
  - [x] Root `tsconfig.json` & shared build configs
  - [x] Root `vitest.config.ts` workspace test configuration
  - [x] `.gitignore` & comprehensive `.env.example`
  - [x] Open-source community files: `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`
  - [x] CI workflow in `.github/workflows/ci.yml` and issue / PR templates

- [x] **Phase 1: Core Package (`@whodunit/core`)**
  - [x] Web-standard interfaces: `Provider`, `RateLimitStore`, `BotCheck`, `Config`, `HandlerDeps`
  - [x] Request handler (`createHandler`) with standard `Request` -> `Response`
  - [x] CORS origin allowlist filtering and preflight handling
  - [x] Content sanitization: strip non-printable/ANSI control characters, enforce max length
  - [x] Ephemeral IP rate limiting with daily rotating salt (zero raw IP persistence)
  - [x] In-memory sliding window store with automatic prune
  - [x] Turnstile / bot check hooks & silent honeypot (`hp`) trap
  - [x] Comprehensive Vitest unit tests (handler, clean, crypto)

- [x] **Phase 2: Providers Package (`@whodunit/providers`)**
  - [x] `ntfy` provider (free push notifications without accounts)
  - [x] `pushover` provider
  - [x] `telegram` bot provider
  - [x] `discord` webhook provider
  - [x] `email` provider (Resend / webhook)
  - [x] Provider factory helper `resolveProviders(config)` with validation
  - [x] Vitest unit test suite with network mocks

- [x] **Phase 3: Widget Package (`@whodunit/widget`)**
  - [x] Custom Element `<whodunit-form>` (zero external runtime dependencies)
  - [x] Interactive states: idle, sending, sent, error with retry
  - [x] Live character counter & auto-resize textarea
  - [x] Hidden honeypot field (`hp`)
  - [x] Accessible ARIA roles and keyboard focus management
  - [x] Theming variables (CSS custom properties)

- [x] **Phase 4: Runtime Adapters (`packages/adapters/*`)**
  - [x] `adapter-node`: standalone server for Node.js / Docker
  - [x] `adapter-cloudflare`: Worker fetch export & KV rate-limit store adapter
  - [x] `adapter-vercel`: Vercel Edge / Serverless entry
  - [x] `adapter-deno`: Deno / Bun fetch handler

- [x] **Phase 5: Examples, Documentation & Verification**
  - [x] Standalone test & showcase page in `examples/static-page`
  - [x] Multi-stage `Dockerfile` & `docker-compose.yml`
  - [x] Cloudflare Worker configuration (`wrangler.jsonc`)
  - [x] SSG & framework embedding snippets in `examples/hugo-astro-next`
  - [x] Comprehensive `README.md` with architecture diagram
  - [x] Detailed documentation guides in `docs/` (providers, deployment, privacy)
  - [x] Full build & test pass verification across all packages
