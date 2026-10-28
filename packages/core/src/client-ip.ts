/**
 * Extracts client IP address from common reverse proxy headers.
 * Used exclusively for computing rotating daily hashes — never stored in raw form.
 */
export function extractClientIp(req: Request): string {
  // Cloudflare
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  // Standard reverse proxies (X-Forwarded-For: client, proxy1, proxy2)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  // Nginx / Vercel
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}
