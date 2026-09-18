import { validFaqItems } from "./StaticPageFaq";
import { richTextToPlain } from "@/lib/richText";
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
  const pageConfig = ["tour", "article", "hotel"].includes(pageKey) ? {} : getPageConfig(settings, pageKey);
  const serverSeo = getPageBootstrap(path)?.seo;

  const faq = validFaqItems(pageConfig.faq_items);
  const schemas = structuredData ? [...(Array.isArray(structuredData) ? structuredData : structuredData["@graph"] || [structuredData])] : [];
  if (faq.length) {
    const questions = faq.map((item) => ({ "@type": "Question", name: richTextToPlain(item.question), acceptedAnswer: { "@type": "Answer", text: richTextToPlain(item.answer) } }));
    const existingIndex = schemas.findIndex((schema) => schema["@type"] === "FAQPage");
    if (existingIndex >= 0) schemas[existingIndex] = { ...schemas[existingIndex], mainEntity: [...schemas[existingIndex].mainEntity, ...questions] };
    else schemas.push({ "@type": "FAQPage", mainEntity: questions });
  }
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
      structuredData={schemas}
    />
  );
}
