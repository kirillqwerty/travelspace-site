import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { Star } from "lucide-react";
import PageSeo from "@/components/PageSeo";
import StaticPageIntro from "@/components/StaticPageIntro";
import ReviewText from "@/components/ReviewText";
import { getInitialCollection } from "@/lib/pageBootstrap";
import { reviewsStructuredData, sortReviewsByDate } from "@/lib/reviews";

export default function Reviews() {
  const [items, setItems] = useState(() => getInitialCollection("reviews"));
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/reviews").then((r) => setItems(r.data || [])).catch(() => {});
  }, []);

  const sortedItems = useMemo(() => sortReviewsByDate(items), [items]);
  const structuredData = useMemo(
    () => reviewsStructuredData(sortedItems),
    [sortedItems],
  );

  return (
    <div
      className="section-container pt-32 lg:pt-36 pb-16 lg:pb-24"
      data-testid="reviews-page"
    >
      <PageSeo pageKey="reviews" path="/reviews" title="Отзывы туристов | TRAVELSPACE" description="Реальные отзывы туристов о поездках, маршрутах и работе TRAVELSPACE." structuredData={structuredData} />
      <StaticPageIntro
        pageKey="reviews"
        overline="Отзывы"
        heading="Что о нас говорят туристы"
        description="Здесь собраны реальные отзывы наших клиентов. Нажмите на скриншот, чтобы открыть его крупнее."
      />

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sortedItems.map((r, index) => {
          const itemId = String(r.id || index);
          return (
          <article
            key={itemId}
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            {r.photo && (
              <button
                type="button"
                onClick={() => setActive(r)}
                className="block w-full overflow-hidden rounded-xl bg-neutral-100 text-left"
              >
                <img
                  src={mediaUrl(r.photo)}
                  alt={r.name || "Отзыв"}
                  className="h-64 w-full object-cover transition hover:scale-[1.02]"
                  loading="lazy"
                />
              </button>
            )}
            <div className="mt-4 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="size-4"
                  fill={i < (r.rating || 5) ? "#C2410C" : "transparent"}
                  stroke={i < (r.rating || 5) ? "#C2410C" : "#d4d4d4"}
                />
              ))}
            </div>
            <ReviewText text={r.text} />
            <div className="mt-4 border-t border-neutral-100 pt-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{r.name}</p>
                  <p className="text-xs text-neutral-500">
                    {r.tour_name || r.direction}
                  </p>
                </div>
                {r.date && (
                  <time className="shrink-0 text-xs text-neutral-400">
                    {r.date}
                  </time>
                )}
              </div>
            </div>
          </article>
          );
        })}
      </div>

      {active && (
        <button
          type="button"
          onClick={() => setActive(null)}
          className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4"
        >
          <img
            src={mediaUrl(active.photo)}
            alt={active.name || "Отзыв"}
            className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain"
          />
        </button>
      )}
    </div>
  );
}
