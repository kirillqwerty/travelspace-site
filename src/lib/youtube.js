const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function getYoutubeVideoId(value = "") {
  const input = String(value || "").trim();
  if (!input) return "";
  if (YOUTUBE_ID_RE.test(input)) return input;

  const iframeSrc = input.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
  const source = (iframeSrc || input).replaceAll("&amp;", "&");

  try {
    const url = new URL(source);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let candidate = "";

    if (host === "youtu.be") candidate = url.pathname.split("/").filter(Boolean)[0];
    if (
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtube-nocookie.com" ||
      host.endsWith(".youtube-nocookie.com")
    ) {
      candidate =
        url.searchParams.get("v") ||
        url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1] ||
        "";
    }

    return YOUTUBE_ID_RE.test(candidate || "") ? candidate : "";
  } catch {
    return "";
  }
}

export function getYoutubeThumbnail(value = "") {
  const id = getYoutubeVideoId(value);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

export function getYoutubeEmbedUrl(value = "") {
  const id = getYoutubeVideoId(value);
  return id
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
    : "";
}
