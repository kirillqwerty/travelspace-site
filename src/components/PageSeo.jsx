import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Seo } from "@/components/Seo";

let settingsCache = null;
let settingsPromise = null;

function getSeoPages(settings) {
  return settings?.seo_pages && typeof settings.seo_pages === "object"
    ? settings.seo_pages
    : {};
}

function getPageConfig(settings, pageKey) {
  if (!pageKey) return {};
  return getSeoPages(settings)[pageKey] || {};
}

export default function PageSeo({
  pageKey,
  title,
  description,
  image,
  path,
  type,
  noIndex,
  structuredData,
}) {
  const [settings, setSettings] = useState(settingsCache);

  useEffect(() => {
    if (!pageKey || settingsCache) return;

    if (!settingsPromise) {
      settingsPromise = api
        .get("/settings")
        .then((response) => response.data || {})
        .catch(() => ({}))
        .then((data) => {
          settingsCache = data;
          return data;
        });
    }

    settingsPromise.then((data) => setSettings(data));
  }, [pageKey]);

  const pageConfig = getPageConfig(settings, pageKey);

  return (
    <Seo
      title={pageConfig.title || title}
      description={pageConfig.description || description}
      image={pageConfig.image || image || settings?.seo_default_image}
      path={pageConfig.path || path}
      type={type}
      noIndex={pageConfig.no_index ?? noIndex}
      siteName={settings?.company_short || "TRAVELSPACE"}
      structuredData={structuredData}
    />
  );
}
