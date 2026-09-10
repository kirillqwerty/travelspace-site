import { Helmet } from "react-helmet-async";
import { mediaUrl } from "@/lib/media";
import { richTextToPlain } from "@/lib/richText";

const configuredSiteUrl =
  process.env.REACT_APP_SITE_URL || process.env.REACT_APP_PUBLIC_URL || "";
const SITE_URL = /^https?:\/\//i.test(configuredSiteUrl)
  ? configuredSiteUrl.replace(/\/$/, "")
  : "https://travelspace.by";

const DEFAULT_SITE_NAME = "TRAVELSPACE";
const DEFAULT_TITLE = "TRAVELSPACE — автобусные и авиа туры из Минска";
const DEFAULT_DESCRIPTION =
  "Автобусные и авиа туры из Минска. Программы, даты и стоимость поездок.";
const DEFAULT_IMAGE = "/og-image.jpg";

function stripText(value = "") {
  return richTextToPlain(value);
}

function limitText(value = "", max = 170) {
  const text = stripText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim().replace(/[ ,.;:-]+$/, "")}…`;
}

export function firstSeoText(...values) {
  return values.map((value) => stripText(value || "")).find(Boolean) || "";
}

function absoluteUrl(url = "") {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads")) return mediaUrl(url);
  return `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function normalizePath(path = "") {
  const value = path || (typeof window !== "undefined" ? window.location.pathname : "/");
  if (/^https?:\/\//i.test(value)) return value;
  const normalized = value.startsWith("/") ? value : `/${value}`;
  return normalized === "/" ? normalized : normalized.replace(/\/$/, "");
}

function normalizeCanonical(canonical = "", fallbackPath = "/") {
  const fallback = normalizePath(fallbackPath);
  const value = String(canonical || "").trim();
  if (!value) return fallback;
  if (value.startsWith("/")) return normalizePath(value);

  try {
    const candidate = new URL(value);
    const publicSite = new URL(SITE_URL);
    if (candidate.hostname !== publicSite.hostname) return fallback;
    return normalizePath(candidate.pathname || "/");
  } catch {
    return fallback;
  }
}

function canonicalUrl(canonical = "", fallbackPath = "/") {
  return absoluteUrl(normalizeCanonical(canonical, fallbackPath));
}

function breadcrumbLabel(segment = "") {
  const labels = {
    tours: "Туры",
    blog: "Блог",
    gruziya: "Туры в Грузию",
    "sankt-peterburg": "Туры в Санкт-Петербург",
    dagestan: "Туры в Дагестан",
    kareliya: "Туры в Карелию",
    abhaziya: "Туры в Абхазию",
    "severnaya-osetiya": "Туры в Северную Осетию",
    moskva: "Туры в Москву",
    arktika: "Туры в Арктику",
    "avtobusnye-iz-minska": "Автобусные туры",
    "avia-iz-minska": "Авиа туры",
  };
  return labels[segment] || segment.replace(/-/g, " ");
}

function withoutContext(value) {
  if (!value || typeof value !== "object") return value;
  const { "@context": _context, ...rest } = value;
  return rest;
}

function buildStructuredGraph({ canonicalUrl, canonicalPath, title, description, siteName, structuredData }) {
  const graph = [
    {
      "@type": ["Organization", "TravelAgency"],
      "@id": `${SITE_URL}/#organization`,
      name: siteName,
      url: `${SITE_URL}/`,
      logo: absoluteUrl(DEFAULT_IMAGE),
      image: absoluteUrl(DEFAULT_IMAGE),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: siteName,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "ru-BY",
    },
    {
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: title,
      description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      inLanguage: "ru-BY",
    },
  ];

  if (!/^https?:\/\//i.test(canonicalPath) && canonicalPath !== "/") {
    const segments = canonicalPath.split("/").filter(Boolean);
    const items = [
      { "@type": "ListItem", position: 1, name: "Главная", item: `${SITE_URL}/` },
    ];
    segments.forEach((segment, index) => {
      const partialPath = `/${segments.slice(0, index + 1).join("/")}`;
      items.push({
        "@type": "ListItem",
        position: index + 2,
        name: index === segments.length - 1 ? title.replace(/\s*\|.*$/, "") : breadcrumbLabel(segment),
        item: absoluteUrl(partialPath),
      });
    });
    graph.push({ "@type": "BreadcrumbList", itemListElement: items });
  }

  if (structuredData?.["@graph"]) {
    graph.push(...structuredData["@graph"].map(withoutContext));
  } else if (Array.isArray(structuredData)) {
    graph.push(...structuredData.map(withoutContext));
  } else if (structuredData) {
    graph.push(withoutContext(structuredData));
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export function Seo({
  title,
  description,
  image,
  path,
  canonical,
  type = "website",
  noIndex = false,
  noFollow = false,
  siteName = DEFAULT_SITE_NAME,
  structuredData,
  serverSeo,
}) {
  const normalizedTitle = serverSeo?.title || limitText(stripText(title) || DEFAULT_TITLE, 80);
  const normalizedDescription = serverSeo?.description || limitText(stripText(description) || DEFAULT_DESCRIPTION, 180);
  const pagePath = normalizePath(path);
  const canonicalPath = normalizeCanonical(canonical, pagePath);
  const canonicalUrlValue = serverSeo?.canonical || absoluteUrl(canonicalPath);
  const imageUrl = serverSeo?.image || absoluteUrl(image || DEFAULT_IMAGE);
  const resolvedNoIndex = serverSeo?.noIndex ?? noIndex;
  const resolvedNoFollow = serverSeo?.noFollow ?? noFollow;
  const graph = serverSeo?.graph || buildStructuredGraph({
    canonicalUrl: canonicalUrlValue,
    canonicalPath: pagePath,
    title: normalizedTitle,
    description: normalizedDescription,
    siteName,
    structuredData,
  });

  return (
    <Helmet prioritizeSeoTags>
      <title>{normalizedTitle}</title>
      <meta name="description" content={normalizedDescription} />
      <meta
        name="robots"
        content={`${resolvedNoIndex ? "noindex" : "index"}, ${resolvedNoFollow ? "nofollow" : "follow"}`}
      />
      <link rel="canonical" href={canonicalUrlValue} />

      <meta property="og:type" content={serverSeo?.type || type} />
      <meta property="og:site_name" content={serverSeo?.siteName || siteName} />
      <meta property="og:locale" content="ru_BY" />
      <meta property="og:title" content={normalizedTitle} />
      <meta property="og:description" content={normalizedDescription} />
      <meta property="og:url" content={canonicalUrlValue} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:secure_url" content={imageUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={normalizedTitle} />
      <meta name="twitter:description" content={normalizedDescription} />
      <meta name="twitter:image" content={imageUrl} />

      <script type="application/ld+json">{JSON.stringify(graph)}</script>
    </Helmet>
  );
}

export { absoluteUrl, canonicalUrl, limitText, stripText };
