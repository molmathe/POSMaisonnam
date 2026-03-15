/**
 * Resolve menu image URL so it works with relative paths and when app is
 * served from a different origin (e.g. production, Docker, reverse proxy).
 * Use NEXT_PUBLIC_APP_URL in .env for production so /uploads/... loads correctly.
 */
export function getMenuImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const base = typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_APP_URL ?? "") : "";
  if (!base) return trimmed;
  const baseClean = base.replace(/\/$/, "");
  return trimmed.startsWith("/") ? `${baseClean}${trimmed}` : `${baseClean}/${trimmed}`;
}
