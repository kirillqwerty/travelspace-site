import { Helmet } from "react-helmet-async";
import { mediaUrl } from "@/lib/media";

const SITE_URL = (
  process.env.REACT_APP_SITE_URL ||
  process.env.REACT_APP_PUBLIC_URL ||
  (typeof window !== "undefined" ? window.location.origin : "https://travelspace.by")
).replace(/\/$/, "");

const DEFAULT_SITE_NAME = "TRAVELSPACE";
const DEFAULT_TITLE =
  "TRAVELSPACE — автобусные и авиа-туры из Минска";
const DEFAULT_DESCRIPTION =
  "Автобусные и авиа-туры из Минска. Продуманные программы, заботливые гиды и понятная цена без сюрпризов.";
const DEFAULT_IMAGE = "/og-image.jpg";

function stripText(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/[*_`#>\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function limitText(value = "", max = 170) {
  const text = stripText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function absoluteUrl(url = "") {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) return url;

  if (url.startsWith("/uploads")) {
    return mediaUrl(url);
  }

  return `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function normalizePath(path = "") {
  if (!path) return typeof window !== "undefined" ? window.location.pathname : "/";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
}

export function Seo({
  title,
  description,
  image,
  path,
  type = "website",
  noIndex = false,
  siteName = DEFAULT_SITE_NAME,
  structuredData,
}) {
  const normalizedTitle = limitText(title || DEFAULT_TITLE, 80);
  const normalizedDescription = limitText(description || DEFAULT_DESCRIPTION, 180);
  const canonicalPath = normalizePath(path);
  const canonicalUrl = /^https?:\/\//i.test(canonicalPath)
    ? canonicalPath
    : absoluteUrl(canonicalPath);
  const imageUrl = absoluteUrl(image || DEFAULT_IMAGE);

  return (
    <Helmet prioritizeSeoTags>
      <title>{normalizedTitle}</title>
      <meta name="description" content={normalizedDescription} />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:title" content={normalizedTitle} />
      <meta property="og:description" content={normalizedDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:secure_url" content={imageUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={normalizedTitle} />
      <meta name="twitter:description" content={normalizedDescription} />
      <meta name="twitter:image" content={imageUrl} />

      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

export { absoluteUrl, limitText, stripText };
