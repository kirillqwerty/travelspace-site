// const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const API_BASE_URL = "https://api.travelspace.by";
export function mediaUrl(url) {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}
