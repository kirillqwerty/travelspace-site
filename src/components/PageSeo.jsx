import { Seo } from "@/components/Seo";
import { useSiteData } from "@/lib/useSiteData";
import { getPageBootstrap } from "@/lib/pageBootstrap";

function getPageConfig(settings, pageKey) {
  if (!pageKey || !settings?.seo_pages || typeof settings.seo_pages !== "object") {
    return {};
  }
  return settings.seo_pages[pageKey] || {};
}

export default function PageSeo({
  pageKey,
  title,
  description,
  image,
  path,
  canonical,
  type,
  noIndex,
  noFollow,
  structuredData,
}) {
  const { settings } = useSiteData();
  // Detail records own their metadata, just as in the server HTML. Global
  // defaults must not overwrite a tour's title or its publication settings.
  const pageConfig = ["tour", "article"].includes(pageKey) ? {} : getPageConfig(settings, pageKey);
  const serverSeo = getPageBootstrap(path)?.seo;

  return (
    <Seo
      serverSeo={serverSeo}
      title={pageConfig.title || title}
      description={pageConfig.description || description}
      image={pageConfig.image || image || settings?.seo_default_image}
      path={pageConfig.path || path}
      canonical={canonical}
      type={type}
      noIndex={pageConfig.no_index ?? noIndex}
      noFollow={noFollow}
      siteName={settings?.company_short || "TRAVELSPACE"}
      structuredData={structuredData}
    />
  );
}
