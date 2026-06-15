import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { Star } from "lucide-react";
import PageSeo from "@/components/PageSeo";

export default function Reviews() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/reviews").then((r) => setItems(r.data || []));
  }, []);

  return (
    <div
      className="section-container pt-32 lg:pt-36 pb-16 lg:pb-24"
      data-testid="reviews-page"
    >
      <PageSeo pageKey="reviews" path="/reviews" title="Отзывы туристов | TRAVELSPACE" description="Реальные отзывы туристов о поездках, маршрутах и работе TRAVELSPACE." />
      <p className="overline text-[#C2410C]">Отзывы</p>
      <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mt-3 max-w-3xl">
        Что о нас говорят туристы
      </h1>
      <p className="mt-4 max-w-2xl text-neutral-600">
        Здесь собраны реальные отзывы наших клиентов. Нажмите на скриншот, чтобы
        открыть его крупнее.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => (
          <article
            key={r.id}
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
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              {r.text}
            </p>
            <div className="mt-4 border-t border-neutral-100 pt-3">
              <p className="font-medium text-sm">{r.name}</p>
              <p className="text-xs text-neutral-500">
                {r.tour_name || r.direction}
              </p>
            </div>
          </article>
        ))}
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
