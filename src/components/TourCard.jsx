import { Link } from "react-router-dom";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mediaUrl } from "@/lib/media";

const BADGE_STYLES = {
  "Хит продаж": "bg-rose-500 text-white border-rose-500",
  Хит: "bg-rose-500 text-white border-rose-500",
  "На скидке": "bg-orange-500 text-white border-orange-500",
  Скидка: "bg-orange-500 text-white border-orange-500",
  Новинка: "bg-emerald-500 text-white border-emerald-500",
  "Без виз": "bg-amber-500 text-white border-amber-500",
  "Отдых на море": "bg-sky-500 text-white border-sky-500",
  Море: "bg-sky-500 text-white border-sky-500",
  "Морской тур": "bg-cyan-500 text-white border-cyan-500",
  "Автобусный тур": "bg-neutral-900 text-white border-neutral-900",
  "Авиа тур": "bg-indigo-500 text-white border-indigo-500",
  "Горящие даты": "bg-red-500 text-white border-red-500",
  "Акционные даты": "bg-pink-500 text-white border-pink-500",
  "Летний тур": "bg-yellow-500 text-white border-yellow-500",
  "Зимний тур": "bg-blue-500 text-white border-blue-500",
  "Осенний тур": "bg-amber-700 text-white border-amber-700",
  "Весенний тур": "bg-lime-500 text-white border-lime-500",
  "Корпоративный тур": "bg-violet-500 text-white border-violet-500",
  "Тур для детей": "bg-fuchsia-500 text-white border-fuchsia-500",
};

const DEFAULT_BADGE = "bg-neutral-100 text-neutral-700 border-neutral-200";

function hasAdditionalPrice(item) {
  return (
    item?.additional_price !== undefined &&
    item?.additional_price !== null &&
    item?.additional_price !== ""
  );
}

function formatCurrency(currency) {
  return currency || "BYN";
}

const DEPARTURE_CITY_GENITIVE = {
  Минск: "Минска",
  Гомель: "Гомеля",
  Жлобин: "Жлобина",
  Бобруйск: "Бобруйска",
  Москва: "Москвы",
  Витебск: "Витебска",
  Могилев: "Могилева",
  Могилёв: "Могилёва",
  Новополоцк: "Новополоцка",
  Брест: "Бреста",
  Гродно: "Гродно",
  Барановичи: "Барановичей",
  Орша: "Орши",
  Жодино: "Жодино",
  Полоцк: "Полоцка",
};

function getDepartureCities(tour) {
  const raw = Array.isArray(tour?.departure_cities)
    ? tour.departure_cities
    : Array.isArray(tour?.departureCities)
      ? tour.departureCities
      : tour?.departure_city
        ? [tour.departure_city]
        : ["Минск"];

  return raw.filter(Boolean);
}

function formatDepartureFrom(tour) {
  const cities = getDepartureCities(tour).map(
    (city) => DEPARTURE_CITY_GENITIVE[city] || city,
  );

  return `из ${cities.join(", ")}`;
}

function PriceView({
  item,
  priceClassName = "font-heading text-3xl font-bold text-neutral-900",
  currencyClassName = "text-sm font-medium text-[#C2410C]",
}) {
  return (
    <p className={priceClassName}>
      {item.price_from}{" "}
      <span className={currencyClassName}>{formatCurrency(item.currency)}</span>
      {hasAdditionalPrice(item) && (
        <>
          <span className="mx-1 text-neutral-400">+</span>
          {item.additional_price}{" "}
          <span className={currencyClassName}>
            {formatCurrency(item.additional_currency)}
          </span>
        </>
      )}
    </p>
  );
}

function cleanDescription(tour) {
  const source = tour.tagline || tour.short_description || "";
  const title = tour.title || "";
  const region = tour.region_name || tour.direction_name || "";

  return (
    source
      .replace(title, "")
      .replace(region, "")
      .replace(/^[:\s,–—-]+/, "")
      .trim() || source
  );
}

function getCardImage(tour, variant = "desktop") {
  if (variant === "mobile") {
    return (
      tour?.hero_mobile_image ||
      tour?.mobile_hero_image ||
      tour?.hero_mobile ||
      tour?.hero_image
    );
  }

  return tour?.hero_image;
}

export default function TourCard({ tour, size = "default" }) {
  const isLarge = size === "large";
  const description = cleanDescription(tour);
  return (
    <Link
      to={`/tours/${tour.slug}`}
      className="
        group card-img-zoom-trigger relative block overflow-hidden rounded-3xl
        border border-orange-100
        bg-white
        shadow-[0_8px_30px_rgba(15,23,42,0.06)]
        hover:shadow-[0_22px_60px_rgba(194,65,12,0.16)]
        hover:-translate-y-1
        transition-all duration-300
      "
      data-testid={`tour-card-${tour.slug}`}
    >
      <div
        className={`relative ${isLarge ? "aspect-[4/3] lg:aspect-[16/11]" : "aspect-[4/3]"} overflow-hidden bg-neutral-100`}
      >
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet={mediaUrl(getCardImage(tour, "mobile"))}
          />
          <img
            src={mediaUrl(getCardImage(tour))}
            alt={tour.title}
            loading="lazy"
            className="
              absolute inset-0 h-full w-full object-cover card-img-zoom
              group-hover:scale-[1.05]
              transition-transform duration-700
            "
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent sm:from-black/70 sm:via-black/15" />

        {/* Badges over image — clearly readable */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {(tour.badges || []).slice(0, 3).map((b) => (
            <Badge
              key={b}
              className={`
                pointer-events-none rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide hover:opacity-100
                border shadow-sm
                ${BADGE_STYLES[b] || DEFAULT_BADGE}
              `}
            >
              {b}
            </Badge>
          ))}
        </div>

        {/* Title and meta overlay (compact, similar heights between cards) */}
        <div className="absolute bottom-0 inset-x-0 p-5 text-white">
          <h3
            className="
              font-heading leading-tight line-clamp-2
              text-xl sm:text-2xl
            "
          >
            {tour.title}
          </h3>
        </div>
      </div>

      <div className="p-5">
        <p className="text-sm leading-relaxed text-neutral-700 line-clamp-2 min-h-[2.6em]">
          {description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-[#C2410C]">
            <Calendar className="size-3.5" />
            {tour.duration}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
            <MapPin className="size-3.5" />
            {formatDepartureFrom(tour)}
          </span>
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-orange-100/80 pt-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">
              {tour.price_type || "от"}
            </p>
            <PriceView item={tour} />
          </div>

          <span
            className="
              grid size-11 place-items-center rounded-2xl
              bg-[#C2410C] text-white shadow-lg shadow-orange-500/30
              transition-all duration-300
              group-hover:scale-105
            "
          >
            <ArrowRight className="size-5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
