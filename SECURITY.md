# Security & Privacy Policy

Whodunit is built around a single non-negotiable principle: **uncompromising privacy for the sender and safety for the receiver.**

## Privacy Commitments

1. **Zero Sender Identification**: We never forward, store, or log the sender's IP address, User-Agent, referer, or client headers to push providers or disk.
2. **Rotating Ephemeral Rate Limits**: Rate limit keys are generated using a one-way cryptographic hash of the client's IP combined with a daily rotating salt: `SHA-256(IP + salt)`. Raw IPs are never written to any persistent store or cache. When the day rolls over, old hashes become irrecoverable.
3. **No Telemetry**: Whodunit contains zero telemetry, zero metrics phone-homes, zero third-party scripts, and zero advertising SDKs.
4. **Content Sanitization**: Message bodies are stripped of non-printable control characters, normalized to plain text, and strictly capped at `MAX_LENGTH` server-side before dispatch.
5. **CORS Isolation**: Cross-origin requests are blocked unless explicitly allowed by the host via `ALLOWED_ORIGINS`.

## Reporting a Security Vulnerability

If you discover a security vulnerability within Whodunit, please report it responsibly:

- **Email**: Send details to `security@whodunit.dev` (or the maintainer's PGP key if configured).
- **Do not open a public GitHub issue** for undisclosed security vulnerabilities.
- Please include:
  - Description of the vulnerability.
  - Steps to reproduce or proof-of-concept payload.
  - Potential impact.

We commit to acknowledging reports within 48 hours and providing a coordinated patch release timeline.
