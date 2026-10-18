/**
 * Tiny UUID v4 utility — no dependency on the `uuid` package.
 * Uses crypto.randomUUID() where available (modern browsers + Node 19+),
 * falls back to Math.random() for older environments.
 */
export function v4(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback (RFC 4122 version 4)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
