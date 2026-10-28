/**
 * Sanitizes input text:
 * - Ensures string type
 * - Strips non-printable ASCII / ANSI escape control codes (except \n, \r, \t)
 * - Trims leading/trailing whitespace
 * - Enforces server-side maximum character length
 */
export function cleanMessage(raw: unknown, maxLength = 500): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  // Remove non-printable characters below 32 (except tab \x09, newline \x0A, return \x0D) and DEL \x7F
  // Also strip zero-width spaces and bidirection override characters
  const sanitized = raw
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, "")
    .trim();

  if (sanitized.length === 0) {
    return null;
  }

  // Truncate to maximum permitted length
  return sanitized.slice(0, maxLength);
}
