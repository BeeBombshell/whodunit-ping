# PLAN: `whodunit` — an open source anonymous "ping me" form

A tiny self-hostable tool. A visitor types a message into a form, and it arrives
as a push notification on the owner's phone, with no identity attached to the
sender. Anyone can deploy their own copy in a few minutes.

Inspired by https://samwho.dev/ping. That page does not publish its
implementation, so the architecture here is my own design, built for reuse.

**Name: Whodunit.** Tagline: *"Somebody pinged you. Nobody knows who."*

"Whodunit" is a common word, so the plain name may already be taken on npm and
GitHub. Check availability before publishing. If it is taken, use a
descriptive suffix: `whodunit-ping`, or scoped packages like `@<you>/whodunit`.
Packages: `whodunit-core`, `whodunit-widget`, `whodunit-providers`.

Branding note: the name is about the sender being unknowable, but it can read
as "finding out who did it". The README and the form itself should say plainly
that senders are never identified, tracked or logged.

## Goals

1. **Deploy in under 10 minutes**: one-click deploy button or one command.
2. **Provider-agnostic**: ntfy, Pushover, Telegram, Discord, email, and more via adapters.
3. **Runs anywhere**: Cloudflare Workers, Vercel/Netlify, Node, Docker.
4. **Private by default**: no sender IPs forwarded or stored, no telemetry, no third-party analytics.
5. **Embeddable**: drop a `<script>` or web component into any site, or use the standalone page.
6. **Small and auditable**: few dependencies, readable in an afternoon.

Non-goals (for v1): user accounts, a dashboard, message history/database,
replies to senders. These conflict with "anonymous and tiny".

## Architecture

```
 Any website
 ┌──────────────────────────────┐
 │ <whodunit-form endpoint="...">  │  web component (or standalone page)
 └──────────────┬───────────────┘
                │ POST /ping { message, token?, hp }
                ▼
 ┌──────────────────────────────────────────────┐
 │ core (Web-standard Request → Response)       │
 │  1. CORS / origin check                      │
 │  2. parse + validate (length, type)          │
 │  3. honeypot + bot-check verifier            │
 │  4. rate limiter (pluggable store)           │
 │  5. sanitize                                 │
 │  6. dispatch to configured provider(s)       │
 └───────┬───────────────────┬─────────────────┘
         │ RateLimitStore    │ Provider adapters
         ▼                   ▼
   memory / KV / Redis    ntfy · Pushover · Telegram · Discord · email
```

### The key design decision: a portable core

Write the core as a function using only web-standard APIs
(`Request`, `Response`, `fetch`, Web Crypto). Then every platform is a thin
wrapper of ~10 lines around the same core:

| Target | Wrapper |
|---|---|
| Cloudflare Workers | `export default { fetch: handler }` |
| Vercel / Netlify | export handler from the function file |
| Node / Docker | `@hono/node-server` or `http.createServer` adapter |
| Deno / Bun | `Deno.serve(handler)` / `Bun.serve({ fetch: handler })` |

A framework like **Hono** is a good fit: tiny, built on web standards, and
runs on all of the above. This is what makes the project genuinely reusable
rather than "works on the author's setup".

### Interfaces (the extension points contributors will use)

```ts
interface Provider {
  name: string;
  send(msg: { text: string; title?: string }): Promise<void>;
}

interface RateLimitStore {
  // returns true if the request is allowed
  hit(key: string, limit: number, windowSec: number): Promise<boolean>;
}

interface BotCheck {
  verify(token: string | undefined, ip?: string): Promise<boolean>;
}
```

Adding a provider = one file implementing `Provider` plus a docs entry and a test.
That is the main thing you want outside contributors to do.

### Configuration

All config via environment variables (12-factor), validated at startup with
clear error messages. Nothing is hardcoded.

| Variable | Purpose |
|---|---|
| `PROVIDER` | `ntfy`, `pushover`, `telegram`, `discord`, `email` (comma-separate for several) |
| `NTFY_TOPIC`, `NTFY_SERVER` | ntfy settings (server can be self-hosted) |
| `PUSHOVER_TOKEN`, `PUSHOVER_USER` | Pushover credentials |
| `ALLOWED_ORIGINS` | CORS allowlist |
| `MAX_LENGTH` | default 500 |
| `RATE_LIMIT` | e.g. `5/hour` |
| `DAILY_CAP` | global cap so a flood cannot bury your phone |
| `BOT_CHECK` | `none`, `turnstile`, `hcaptcha` |
| `TITLE_PREFIX` | e.g. `ping` |

Provide a `.env.example` and a startup check that fails fast if a required
variable for the chosen provider is missing.

## Privacy and security (matters more for an open source tool)

Other people will run this and their visitors will trust it, so the defaults must be safe.

- Never forward or log the sender's IP, user agent or headers. Logs contain only status codes and timings.
- Rate-limit keys are a salted hash of the IP that **rotates daily**, so no raw IP is stored.
- No telemetry, no analytics, no phone-home. State this in the README.
- Secrets live only in environment variables or the platform's secret store; document that `.env` is gitignored.
- Output is plain text only; strip control characters; cap length server-side regardless of the client.
- CORS defaults to **deny**; the owner must set `ALLOWED_ORIGINS`.
- Page and README should tell visitors plainly: messages are anonymous, and the owner may publish them.
- Add `SECURITY.md` with a private reporting address and a response expectation.
- Pin dependencies, enable Dependabot, and run `npm audit` in CI.
- Abuse note in the docs: the tool can be used to send harassment. Document a safe-use section, the daily cap, and how to block or lock the endpoint quickly (e.g. set `DISABLED=true`).

## Repository layout

```
whodunit/
├─ packages/
│  ├─ core/            # handler, validation, rate limit, provider interface
│  ├─ providers/       # ntfy.ts, pushover.ts, telegram.ts, discord.ts, email.ts
│  ├─ widget/          # <whodunit-form> web component (vanilla, ~3 KB)
│  └─ adapters/        # cloudflare/, vercel/, node/, deno/
├─ examples/
│  ├─ static-page/     # standalone /ping page
│  ├─ cloudflare-worker/
│  ├─ docker-compose/
│  └─ hugo-astro-next/ # embedding snippets
├─ docs/               # setup per platform, provider guides, privacy, FAQ
├─ .github/
│  ├─ workflows/ci.yml
│  ├─ ISSUE_TEMPLATE/
│  └─ PULL_REQUEST_TEMPLATE.md
├─ LICENSE
├─ README.md
├─ CONTRIBUTING.md
├─ CODE_OF_CONDUCT.md
├─ SECURITY.md
└─ CHANGELOG.md
```

A monorepo (npm/pnpm workspaces) is fine. If you want to start smaller, begin
with a single package and split once there are two or more adapters.

## Open source decisions

| Decision | Recommendation | Why |
|---|---|---|
| License | **MIT** (or Apache-2.0 if you want an explicit patent grant) | Most permissive and widely adopted for small tools. |
| Language | **TypeScript** | Types document the Provider/Store interfaces for contributors. |
| Package manager | pnpm or npm workspaces | Simple monorepo story. |
| Testing | Vitest | Fast, works with Web-standard APIs. |
| Lint/format | Biome or ESLint + Prettier | One command, enforced in CI. |
| Versioning | SemVer, Conventional Commits, Changesets | Automated changelogs and releases. |
| Distribution | npm packages + Docker image + "Deploy" buttons | Different people want different install paths. |
| Governance | Single maintainer to start; document how to become a co-maintainer | Keep it light. |
| Name/branding | **Whodunit**; verify package, repo and domain availability first | Avoid renaming after launch. |
| Credit | Link the original inspiration in the README | Courteous; do not copy its code or text. |

## Roadmap

### Phase 0: Foundations (half day)
- [ ] Name is Whodunit: check GitHub, npm and a `.dev` domain; fall back to `whodunit-ping` or a scoped package if taken; check trademarks.
- [ ] Choose license, add `LICENSE`.
- [ ] Init monorepo, TypeScript, Vitest, lint, CI skeleton.
- [ ] Write a short README stub with the goal and the privacy promise.

### Phase 1: MVP core + one provider (1 day)
- [ ] Implement core handler (validate → provider → response).
- [ ] ntfy provider, tested end to end against a real topic.
- [ ] Config loader with validation and `.env.example`.
- [ ] Cloudflare Worker adapter.
- [ ] Unit tests: validation edge cases, provider failure, bad JSON.

### Phase 2: Frontend + abuse protection (1 day)
- [ ] `<whodunit-form>` web component: states (idle/sending/sent/error), char counter, accessible labels, theming through CSS variables.
- [ ] Standalone example page.
- [ ] Honeypot, Turnstile verifier, rate limiter (memory store + KV store).
- [ ] Daily cap and `DISABLED` kill switch.
- [ ] CORS allowlist.

### Phase 3: Portability (1-2 days)
- [ ] Node/Docker adapter and `Dockerfile`; Vercel and Netlify adapters.
- [ ] More providers: Pushover, Telegram, Discord webhook, email (SMTP/Resend).
- [ ] Redis rate-limit store for long-running deployments.
- [ ] CI matrix testing the core on Node, Workers runtime (`workerd`/Miniflare) and Deno or Bun.

### Phase 4: Docs and community (1-2 days)
- [ ] README: 60-second quickstart with a GIF, deploy buttons, FAQ.
- [ ] Per-platform and per-provider guides in `docs/`.
- [ ] `CONTRIBUTING.md` including "how to add a provider" with a worked example.
- [ ] `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue/PR templates.
- [ ] Label starter issues `good first issue` (new providers, translations, themes).

### Phase 5: Release
- [ ] Security pass: review logs for leakage, test CORS, test rate-limit bypass attempts.
- [ ] Publish `0.1.0` to npm and push a Docker image (GHCR).
- [ ] Tag release, publish changelog, announce (Show HN, r/selfhosted, Lobsters).
- [ ] Set up Dependabot and a basic issue triage routine.

### Later ideas
- i18n for the widget strings.
- Optional encrypted archive (D1/SQLite) for owners who want to publish messages.
- Reply-less "reactions" so senders can say "thanks" without identity.
- Optional signed request tokens to support multiple "inboxes" on one deployment.

## Definition of done for v0.1.0

- A stranger can follow the README and have a working form in under 10 minutes on Cloudflare Workers **and** via Docker.
- Messages reach the phone through ntfy and at least one other provider.
- Tests and CI pass; the core runs unchanged on three runtimes.
- No sender IPs or headers appear in logs or in the notification.
- A new provider can be added by following `CONTRIBUTING.md` without asking the maintainer anything.

## Minimal core sketch

```ts
// packages/core/src/handler.ts
export function createHandler(cfg: Config, deps: Deps) {
  return async (req: Request): Promise<Response> => {
    if (cfg.disabled) return new Response(null, { status: 503 });
    if (req.method === "OPTIONS") return cors(cfg, req);
    if (req.method !== "POST") return new Response(null, { status: 405 });
    if (!originAllowed(cfg, req)) return new Response(null, { status: 403 });

    const body = await req.json().catch(() => null);
    const text = clean(body?.message, cfg.maxLength);
    if (!text) return json(400, "invalid_message");
    if (body?.hp) return new Response(null, { status: 204 }); // honeypot: pretend success

    if (!(await deps.botCheck.verify(body?.token)))
      return json(403, "bot_check_failed");

    const key = await dailyHash(clientIp(req), cfg.salt); // never stored raw
    if (!(await deps.store.hit(key, cfg.limit, cfg.windowSec)))
      return json(429, "rate_limited");

    try {
      await Promise.all(deps.providers.map((p) => p.send({ text, title: cfg.title })));
      return new Response(null, { status: 204 });
    } catch {
      return json(502, "delivery_failed");
    }
  };
}
```
