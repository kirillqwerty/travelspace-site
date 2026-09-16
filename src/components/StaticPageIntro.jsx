import { useSiteData } from "@/lib/useSiteData";
import { RichText } from "@/lib/richText";

export function getStaticPageIntro(settings, pageKey, defaults = {}) {
  const configured = settings?.seo_pages?.[pageKey] || {};
  const value = (key, fallback) =>
    typeof configured[key] === "string" ? configured[key].trim() : fallback;

  return {
    overline: value("visible_overline", defaults.overline || ""),
    heading: value("visible_heading", defaults.heading || ""),
    description: value("visible_description", defaults.description || ""),
  };
}

export default function StaticPageIntro({
  pageKey,
  overline,
  heading,
  description = "",
  headingClassName = "",
}) {
  const { settings } = useSiteData();
  const content = getStaticPageIntro(settings, pageKey, {
    overline,
    heading,
    description,
  });

  return (
    <>
      {content.overline && (
        <p className="overline text-[#C2410C]">{content.overline}</p>
      )}
      <h1
        className={`font-heading mt-3 w-full break-words text-4xl sm:text-5xl lg:text-6xl ${headingClassName}`.trim()}
      >
        {content.heading}
      </h1>
      {content.description && (
        <RichText
          text={content.description}
          className="mt-4 w-full break-words leading-relaxed text-neutral-600"
          paragraphClassName="leading-relaxed"
        />
      )}
    </>
  );
}
