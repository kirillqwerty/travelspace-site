import { BACKEND_URL } from "@/lib/api";

function getOriginFallback() {
  if (typeof window !== "undefined") return window.location.origin;
  return "https://travelspace.by";
}

export function mediaUrl(url) {
  url = typeof url === "string" ? url.trim() : "";
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const base = BACKEND_URL || getOriginFallback();
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

export function optimizedMediaUrl(url, width = 800) {
  const normalized = typeof url === "string" ? url.trim() : "";
  const match = normalized.match(/^\/uploads\/([^/?#]+)$/i);
  if (!match) return mediaUrl(normalized);

  const safeWidth = Math.min(1600, Math.max(160, Math.round(Number(width) || 800)));
  const base = BACKEND_URL || getOriginFallback();
  return `${base}/media/${encodeURIComponent(match[1])}?width=${safeWidth}`;
}
