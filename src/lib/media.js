import { BACKEND_URL } from "@/lib/api";

function getOriginFallback() {
  if (typeof window !== "undefined") return window.location.origin;
  return "https://travelspace.by";
}

export function mediaUrl(url) {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const base = BACKEND_URL || getOriginFallback();
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}
