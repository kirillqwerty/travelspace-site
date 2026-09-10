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
