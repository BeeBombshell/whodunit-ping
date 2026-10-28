# Privacy & Cryptography Architecture

Most contact forms collect and log your visitors' digital fingerprints (IP address, location, browser version, headers). Whodunit is intentionally designed to make sender identification mathematically impossible.

## 1. Daily Rotating Ephemeral Salt

To enforce rate limits without storing client IP addresses, Whodunit computes a one-way cryptographic SHA-256 hash:

$$\text{Key} = \text{SHA-256}(\text{YYYY-MM-DD} \parallel \text{salt} \parallel \text{Client IP})$$

- **Daily Salt Rotation**: The current UTC date (`YYYY-MM-DD`) is baked into the pre-image. Even if an attacker records the hashes, they cannot correlate requests from the same user across different days.
- **Irreversibility**: SHA-256 is a one-way cryptographic function.
- **No Raw Storage**: The client's raw IP address is discarded from memory immediately after computing the hash. It is never logged to stdout, files, or database tables.

## 2. Zero Telemetry Guarantee

- No Google Analytics, PostHog, or tracking pixels.
- No update checking or "call home" telemetry requests.
- No external CDN scripts required.

## 3. Safe Content Sanitization

To protect the receiver's notifications and devices:
- Non-printable control characters, ANSI escape sequences, and bidirectional override characters are stripped server-side.
- All messages are truncated to `MAX_LENGTH` (default: 500 characters).
