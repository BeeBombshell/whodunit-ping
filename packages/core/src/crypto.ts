/**
 * Creates an ephemeral salted hash of a client IP address.
 * The hash incorporates UTC date (YYYY-MM-DD), so hashes rotate daily and past
 * identities become cryptographically irrecoverable. Raw IPs are NEVER persisted.
 */
export async function dailyHash(ip: string, salt = "whodunit-default-salt"): Promise<string> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD in UTC
  const input = `${today}:${salt}:${ip}`;

  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  // Web-standard subtle crypto
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
