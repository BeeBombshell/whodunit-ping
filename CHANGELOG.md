# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-27

### Added
- Monorepo structure with `@whodunit/core`, `@whodunit/providers`, and `@whodunit/widget`.
- Portable web-standard request handler with zero telemetry and zero raw IP retention.
- Salted daily rotating IP hashing for rate limiting.
- In-memory sliding window rate limit store.
- Honeypot and bot check verification hooks.
- Notification providers for `ntfy`, `Pushover`, `Telegram`, and `Discord`.
- Zero-dependency `<whodunit-form>` custom element with customizable CSS variables.
- Runtime adapters for Node.js, Cloudflare Workers, Vercel, and Deno.
- Standalone demo page and Docker compose template.
