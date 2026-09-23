import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { usePublicRecord } from "@/lib/usePublicRecord";
import PageLoadState from "@/components/PageLoadState";
import LeadForm from "@/components/LeadForm";
import { useSiteData } from "@/lib/useSiteData";
import PageSeo from "@/components/PageSeo";
import { canonicalUrl, firstSeoText } from "@/components/Seo";
import { mediaUrl } from "@/lib/media";
import ArticleBody from "@/components/ArticleBody";
import { RichText } from "@/lib/richText";
import { HighlightedTitle } from "@/lib/tourTitle";
import {
  getDirectionLandingForTour,
  TOUR_LANDINGS,
  TOUR_LANDING_LINKS,
} from "@/lib/seoLandings";

function articleImages(article) {
  const gallery = Array.isArray(article?.gallery)
    ? article.gallery
    : Array.isArray(article?.images)
      ? article.images
      : [];

  return gallery.filter(Boolean).filter((image) => image !== article?.cover);
}

export default function Article() {
  const { slug } = useParams();
  const { record: a, notFound: error, failed, retry } = usePublicRecord("articles", slug);
  const { tours } = useSiteData();

  const relatedTours = useMemo(() => {
    if (!a) return [];
    if (a.related_tour_slugs?.length) {
      return tours.filter((tour) => a.related_tour_slugs.includes(tour.slug));
    }
    const articleText = `${a.title || ""} ${a.excerpt || ""} ${a.content || ""}`.toLowerCase();
    return tours
      .filter((tour) => {
        const direction = getDirectionLandingForTour(tour);
        return TOUR_LANDINGS[direction?.slug]?.keywords?.some((keyword) =>
          articleText.includes(keyword),
        );
      })
      .slice(0, 3);
  }, [a, tours]);

  const relatedDirections = useMemo(() => {
    if (!a) return [];
    const articleText = `${a.title || ""} ${a.excerpt || ""} ${a.content || ""}`.toLowerCase();
    return TOUR_LANDING_LINKS.slice(2).filter(({ slug: landingSlug }) =>
      TOUR_LANDINGS[landingSlug].keywords?.some((keyword) => articleText.includes(keyword)),
    );
  }, [a]);

  if (error) {
    return (
      <div className="section-container section-pad text-center">
        <PageSeo
          title="Статья не найдена | TRAVELSPACE"
          description="Статья не найдена."
          path={`/blog/${slug}`}
          noIndex
        />
        <h1 className="font-heading text-3xl">Статья не найдена</h1>
        <Link to="/blog" className="text-[#C2410C] underline mt-4 inline-block">
          К блогу
        </Link>
      </div>
    );
  }
  if (!a) {
    return <PageLoadState failed={failed} retry={retry} />;
  }

  const articleTitle = firstSeoText(a.seo_title, `${a.title} | TRAVELSPACE`);
  const articleDescription = firstSeoText(a.seo_description, a.excerpt, a.content);
  const articleImage = a.seo_image || a.cover || articleImages(a)[0];
  const articleH1 = a.seo_h1 || a.title;
  const articleStructuredData = {
    "@type": "Article",
    headline: articleH1,
    description: articleDescription,
    mainEntityOfPage: canonicalUrl(
      a.seo_canonical_url,
      `/blog/${a.slug || slug}`,
    ),
    image: articleImage ? mediaUrl(articleImage) : undefined,
    author: { "@id": "https://travelspace.by/#organization" },
    publisher: { "@id": "https://travelspace.by/#organization" },
    datePublished: a.published_at || undefined,
    dateModified: a.seo_lastmod || a.updated_at || undefined,
  };

  return (
    <article
      className="section-container py-12 lg:py-20"
      data-testid="article-page"
    >
      <PageSeo
        pageKey="article"
        title={articleTitle}
        description={articleDescription}
        image={articleImage}
        path={`/blog/${a.slug || slug}`}
        canonical={a.seo_canonical_url}
        noIndex={a.seo_noindex === true}
        noFollow={a.seo_nofollow === true}
        type="article"
        structuredData={articleStructuredData}
      />
      <Link
        to="/blog"
        className="text-xs text-neutral-500 hover:text-[#C2410C]"
      >
        ← В блог
      </Link>
      {a.published_at && <p className="text-xs text-neutral-500 mt-6">{a.published_at}</p>}
      <h1 className="font-heading text-4xl sm:text-5xl mt-2">
        <HighlightedTitle record={a} text={articleH1} />
      </h1>
      {a.excerpt && (
        <RichText text={a.excerpt} className="mt-5 text-lg leading-8 text-neutral-600" />
      )}
      {a.cover && (
        <div className="mt-8 aspect-[16/9] rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100">
          <img
            src={mediaUrl(a.cover)}
            alt={a.cover_alt || articleH1}
            width="1200"
            height="675"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <ArticleBody article={a} />

      {relatedDirections.length > 0 && (
        <nav aria-label="Связанные направления" className="mt-10 flex flex-wrap gap-2">
          {relatedDirections.map((item) => (
            <Link key={item.slug} to={item.path} className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:border-orange-300 hover:text-[#C2410C]">
              Туры: {item.label}
            </Link>
          ))}
        </nav>
      )}

      {relatedTours.length > 0 && (
        <div className="mt-12 rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C2410C]">
            Подходящие туры
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedTours.map((tour) => (
              <Link
                key={tour.slug}
                to={`/tours/${tour.slug}`}
                className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[#C2410C] ring-1 ring-orange-100 hover:bg-orange-100"
              >
                {tour.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-16 rounded-2xl border border-neutral-200 p-6 sm:p-8 bg-neutral-50">
        <h3 className="font-heading text-2xl">Хотите такой же тур?</h3>
        <p className="text-sm text-neutral-600 mt-1">
          Оставьте телефон, менеджер подберёт и расскажет о ближайших датах.
        </p>
        <div className="mt-5">
          <LeadForm tours={tours} compact />
        </div>
      </div>
    </article>
  );
}
