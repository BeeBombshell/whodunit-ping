# Architecture & Project Decisions Record (ADR)

This document tracks all foundational architectural, technical, security, and governance decisions made for **Whodunit**.

---

## Index of Decisions

- [ADR-001: Web-Standard Portable Core](#adr-001-web-standard-portable-core)
- [ADR-002: Zero Sender Retention & Ephemeral Daily-Salted IP Hashing](#adr-002-zero-sender-retention--ephemeral-daily-salted-ip-hashing)
- [ADR-003: Monorepo Architecture with pnpm Workspaces](#adr-003-monorepo-architecture-with-pnpm-workspaces)
- [ADR-004: Decoupled Provider Interface](#adr-004-decoupled-provider-interface)
- [ADR-005: Zero-Dependency Vanilla Web Component for Frontend](#adr-005-zero-dependency-vanilla-web-component-for-frontend)
- [ADR-006: Silent Honeypot Trap for Bot Mitigation](#adr-006-silent-honeypot-trap-for-bot-mitigation)
- [ADR-007: Default-Deny CORS Policy](#adr-007-default-deny-cors-policy)
- [ADR-008: Explicit Non-Goals for Version 1.0](#adr-008-explicit-non-goals-for-version-10)
- [ADR-009: Tooling (TypeScript, Vitest, tsup)](#adr-009-tooling-typescript-vitest-tsup)
- [ADR-010: Open Source Licensing (MIT) and Governance](#adr-010-open-source-licensing-mit-and-governance)

---

### ADR-001: Web-Standard Portable Core

- **Status**: Accepted
- **Context**: Whodunit needs to run on diverse deployment targets: Cloudflare Workers, Node.js servers, Docker containers, Vercel Edge functions, Deno, and Bun. Tying the core to a specific runtime framework (like Express or Fastify) would introduce heavy runtime overhead and prevent edge deployment.
- **Decision**: Build the core (`@whodunit/core`) purely against standard Web APIs (`Request`, `Response`, `Headers`, `ReadableStream`, Web Crypto `SubtleCrypto`, and `fetch`). Every runtime adapter is a thin wrapper that maps the host environment to a standard `Request` -> `Response` execution.
- **Consequences**:
  - Zero external dependencies in `@whodunit/core`.
  - Runs unchanged across Cloudflare Workers, Node 18+, Vercel Edge, Deno, and Bun.
  - Runtime adapters remain minimal (< 60 lines each).

---

### ADR-002: Zero Sender Retention & Ephemeral Daily-Salted IP Hashing

- **Status**: Accepted
- **Context**: The core value proposition of Whodunit is true sender anonymity. At the same time, open forms are vulnerable to spam and denial-of-service, which necessitates rate limiting. Traditional rate limiters persist client IP addresses in databases or caches.
- **Decision**:
  1. Never forward, store, or log the sender's raw IP address, User-Agent, referer, or client headers.
  2. Implement rate limiting using a one-way cryptographic hash that rotates every 24 hours:
     $$\text{Key} = \text{SHA-256}(\text{YYYY-MM-DD} \parallel \text{salt} \parallel \text{Client IP})$$
  3. Discard the raw IP address immediately after generating the ephemeral hash key.
- **Consequences**:
  - Mathematically prevents correlating user requests across days.
  - Eliminates compliance burdens (e.g. GDPR IP storage concerns).
  - Raw client IPs never touch logs, files, or database tables.

---

### ADR-003: Monorepo Architecture with pnpm Workspaces

- **Status**: Accepted
- **Context**: The project spans a core engine, multiple notification providers, a frontend widget, and deployment runtime adapters. Managing these as isolated repositories would create synchronization friction, while a monolithic single package would force edge users to bundle unused Node dependencies.
- **Decision**: Use a `pnpm` monorepo with scoped packages:
  - `packages/core`: Core request handler, validation, rate limiting, and contracts.
  - `packages/providers`: Notification provider implementations (`ntfy`, `pushover`, `telegram`, `discord`, `email`).
  - `packages/widget`: Vanilla `<whodunit-form>` custom element.
  - `packages/adapters/*`: Minimal deployment wrappers (`cloudflare`, `node`, `vercel`, `deno`).
  - `examples/*`: Deployment and integration blueprints.
- **Consequences**:
  - Independent publishing or lightweight bundled distribution.
  - Fast workspace installs and shared root testing.

---

### ADR-004: Decoupled Provider Interface

- **Status**: Accepted
- **Context**: Outside contributors are most likely to contribute new notification destinations (e.g., Matrix, Slack, Gotify, Signal, Webhooks). The integration pattern must be trivial to understand and extend without modifying core logic.
- **Decision**: Define a minimal `Provider` contract:
  ```ts
  export interface Provider {
    readonly name: string;
    send(msg: { text: string; title?: string }): Promise<void>;
  }
  ```
  Provide a centralized resolver factory (`resolveProviders(env)`) that instantiates active providers from comma-separated names (e.g. `PROVIDER=ntfy,discord`).
- **Consequences**:
  - Adding a new notification provider takes a single file, a unit test, and an env documentation entry.
  - Multi-provider simultaneous notification dispatch is supported out of the box via `Promise.all`.

---

### ADR-005: Zero-Dependency Vanilla Web Component for Frontend

- **Status**: Accepted
- **Context**: Users want to embed the anonymous form into static websites (Hugo, Astro, Jekyll), modern Single Page Apps (Next.js, Vite), or CMS platforms (WordPress). Requiring React, Vue, or Tailwind would limit adoption.
- **Decision**: Implement `<whodunit-form>` as a standard custom element (`Web Component`) with Shadow DOM encapsulation:
  - Zero external npm runtime dependencies.
  - Bundled as ESM and IIFE (~3 KB minified).
  - Configurable via HTML attributes (`endpoint`, `max-length`, `placeholder`, `button-text`).
  - Styled with CSS Custom Properties (`--whodunit-bg`, `--whodunit-text`, etc.) for seamless host site theming.
  - Native states: `idle`, `sending`, `sent` (success confirmation), and `error` (with retry button).
- **Consequences**:
  - Can be embedded with a single `<script type="module">` tag anywhere.
  - CSS styles inside the component cannot leak out or be broken by host stylesheets.

---

### ADR-006: Silent Honeypot Trap for Bot Mitigation

- **Status**: Accepted
- **Context**: Automated scrapers and spam bots fill in every input field found in DOM forms.
- **Decision**: Include a hidden input named `hp` (`tabindex="-1"`, offscreen positioning). If `body.hp` contains any value on form submission, the server immediately halts processing and returns an HTTP `204 No Content` response without dispatching a notification.
- **Consequences**:
  - Spam bots receive a fake "success" response and do not attempt evasion or retry alternate vectors.
  - Zero CPU cycles spent calling third-party challenge services for simple scrapers.

---

### ADR-007: Default-Deny CORS Policy

- **Status**: Accepted
- **Context**: Anyone discovering a user's Whodunit API URL could theoretically submit requests from arbitrary domains or spam the owner's phone.
- **Decision**: Whodunit requires explicit origin allowlisting via `ALLOWED_ORIGINS`. If `ALLOWED_ORIGINS` is not defined or does not match the request `Origin` header, the request is rejected with `403 Forbidden` (`{"error": "forbidden_origin"}`).
- **Consequences**:
  - Protects the owner from unauthorized cross-origin form embedding.
  - Allows wildcards (`*`) when open public submission is explicitly desired.

---

### ADR-008: Explicit Non-Goals for Version 1.0

- **Status**: Accepted
- **Context**: Feature creep often dilutes small tools into complex SaaS products.
- **Decision**: Explicitly declare non-goals for v1.0:
  1. **No user accounts / logins**.
  2. **No admin dashboard**.
  3. **No database storage of past messages**.
  4. **No sender replies or threaded conversations**.
- **Consequences**:
  - Keeps the codebase auditable in an afternoon (< 500 lines of core logic).
  - Eliminates database provisioning and maintenance for self-hosters.
  - Preserves the purity of the "somebody pinged you, nobody knows who" promise.

---

### ADR-009: Tooling (TypeScript, Vitest, tsup)

- **Status**: Accepted
- **Context**: Fast developer feedback and type-safe contracts are essential for community contributions.
- **Decision**:
  - **Language**: TypeScript with strict mode enabled.
  - **Testing**: `vitest` with native workspace project definitions (`vitest.config.ts`).
  - **Build**: `tsup` (esbuild) targeting ES2022 with automatic `.d.ts` declaration generation.
- **Consequences**:
  - Lightning-fast sub-second test execution.
  - Dual ESM and CJS/IIFE builds where appropriate.

---

### ADR-010: Open Source Licensing (MIT) and Governance

- **Status**: Accepted
- **Context**: As a lightweight self-hostable utility, frictionless adoption and contribution are paramount.
- **Decision**: License Whodunit under the **MIT License**. Provide standard open-source documentation (`CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `.github` issue and PR templates).
- **Consequences**:
  - Broadest possible adoption for personal sites, open-source projects, and commercial blogs.
