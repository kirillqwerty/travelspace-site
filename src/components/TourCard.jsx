import { Link } from "react-router-dom";
import { Bus, Plane, Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mediaUrl } from "@/lib/media";
import {
  getTourTransportType,
  TOUR_TRANSPORT_TYPES,
} from "@/lib/tourTransport";

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

function hasPriceValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function getDateTime(date, field = "start") {
  const value = date?.[field] || date?.start || date?.end || "";
  const time = Date.parse(value);

  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}

function isDateActual(date) {
  const startTime = getDateTime(date, "start");
  const fallbackEndTime = getDateTime(date, "end");
  const compareTime =
    startTime !== Number.MAX_SAFE_INTEGER ? startTime : fallbackEndTime;

  if (compareTime === Number.MAX_SAFE_INTEGER) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return compareTime >= today.getTime();
}

function isPromotionDate(date) {
  return (
    date?.promotion_active === true &&
    (hasPriceValue(date?.promotion_price) ||
      hasPriceValue(date?.promotion_additional_price))
  );
}

function getTourDates(tour) {
  const legacyDates = Array.isArray(tour?.dates) ? tour.dates : [];
  const chainDates = Array.isArray(tour?.chains)
    ? tour.chains.flatMap((chain) =>
        Array.isArray(chain?.dates) ? chain.dates : [],
      )
    : [];

  return [...legacyDates, ...chainDates];
}

function getPromotionDates(tour) {
  return getTourDates(tour)
    .filter((date) => date?.status !== "hidden" && isDateActual(date))
    .filter(isPromotionDate)
    .sort((a, b) => getDateTime(a) - getDateTime(b));
}

function getAdditionalPrice(source, fallbackTour) {
  if (hasAdditionalPrice(source)) return source.additional_price;
  if (hasAdditionalPrice(fallbackTour)) return fallbackTour.additional_price;
  return "";
}

function getAdditionalCurrency(source, fallbackTour) {
  if (hasAdditionalPrice(source)) {
    return (
      source.additional_currency || source.currency || fallbackTour?.currency
    );
  }

  if (hasAdditionalPrice(fallbackTour)) {
    return fallbackTour.additional_currency || fallbackTour.currency;
  }

  return source?.currency || fallbackTour?.currency;
}

function getPromotionPriceParts(item, fallbackTour) {
  if (!isPromotionDate(item)) return null;

  const oldMain = item.price ?? item.price_from ?? fallbackTour?.price_from;
  const oldCurrency = item.currency || fallbackTour?.currency;
  const oldAdditional = getAdditionalPrice(item, fallbackTour);
  const oldAdditionalCurrency = getAdditionalCurrency(item, fallbackTour);

  return {
    oldMain,
    oldCurrency,
    oldAdditional,
    oldAdditionalCurrency,
    newMain: hasPriceValue(item.promotion_price)
      ? item.promotion_price
      : oldMain,
    newCurrency: item.promotion_currency || oldCurrency,
    newAdditional: hasPriceValue(item.promotion_additional_price)
      ? item.promotion_additional_price
      : oldAdditional,
    newAdditionalCurrency:
      item.promotion_additional_currency || oldAdditionalCurrency,
  };
}

function PriceParts({
  main,
  currency,
  additional,
  additionalCurrency,
  currencyClassName,
}) {
  return (
    <>
      {main}{" "}
      <span className={currencyClassName}>{formatCurrency(currency)}</span>
      {hasPriceValue(additional) && (
        <>
          <span className="mx-1 text-current opacity-50">+</span>
          {additional}{" "}
          <span className={currencyClassName}>
            {formatCurrency(additionalCurrency)}
          </span>
        </>
      )}
    </>
  );
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

function formatDate(date) {
  if (!date) return "";

  const [year, month, day] = date.split("-");

  return `${day}.${month}.${year}`;
}

function fmtDateRangeCompact(d) {
  if (!d?.start) return "";
  if (!d?.end) return formatDate(d.start);

  return `${formatDate(d.start)}–${formatDate(d.end)}`;
}

function PriceView({
  item,
  promotionDate,
  priceClassName = "font-heading text-3xl font-bold text-neutral-900",
  currencyClassName = "text-sm font-medium text-[#C2410C]",
}) {
  const hasAvailableDates = getTourDates(item).some(
    (date) => date?.status !== "hidden" && isDateActual(date),
  );

  if (!hasAvailableDates) {
    return (
      <div
        className="mt-1 max-w-[220px] rounded-2xl bg-orange-50 px-3 py-2 text-sm normal-case leading-snug tracking-normal text-[#9A3412]"
        data-testid="tour-card-no-dates"
      >
        <span className="font-semibold">Дорогие туристы,</span>
        <br />
        дат пока что нет
      </div>
    );
  }

  const promoParts = promotionDate
    ? getPromotionPriceParts(promotionDate, item)
    : null;

  if (promoParts) {
    return (
      <div className="min-w-0">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
          Акционная цена
        </p>
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2">
          <p className="text-sm font-medium text-neutral-400 line-through decoration-rose-400 decoration-2">
            <PriceParts
              main={promoParts.oldMain}
              currency={promoParts.oldCurrency}
              additional={promoParts.oldAdditional}
              additionalCurrency={promoParts.oldAdditionalCurrency}
              currencyClassName="text-xs"
            />
          </p>
          <p className={priceClassName}>
            <PriceParts
              main={promoParts.newMain}
              currency={promoParts.newCurrency}
              additional={promoParts.newAdditional}
              additionalCurrency={promoParts.newAdditionalCurrency}
              currencyClassName={currencyClassName}
            />
          </p>
        </div>
      </div>
    );
  }

  return (
    <p className={`${priceClassName} whitespace-nowrap`}>
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
  const promotionDates = getPromotionDates(tour);
  const hasPromotions = promotionDates.length > 0;
  const TransportIcon =
    getTourTransportType(tour) === TOUR_TRANSPORT_TYPES.AIR ? Plane : Bus;

  return (
    <Link
      to={`/tours/${tour.slug}`}
      className="
    group card-img-zoom-trigger relative flex h-full flex-col overflow-hidden rounded-3xl
    border border-orange-100
    bg-white
    shadow-[0_8px_30px_rgba(15,23,42,0.06)]
    hover:shadow-[0_22px_60px_rgba(194,65,12,0.16)]
    hover:-translate-y-1
    transition-all duration-300
  "
      data-testid={`tour-card-${tour.slug}`}
    >
      <div className="relative grid min-w-0 overflow-hidden bg-neutral-100">
        {/* The image keeps its usual ratio, but long titles can grow this row. */}
        <div
          aria-hidden="true"
          className={`col-start-1 row-start-1 ${isLarge ? "aspect-[4/3] lg:aspect-[16/11]" : "aspect-[4/3]"}`}
        />
        <picture className="absolute inset-0">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="relative col-start-1 row-start-1 flex min-w-0 flex-col justify-between">
          {/* Badges over image — clearly readable */}
          <div className="m-3 flex shrink-0 flex-wrap gap-1.5">
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
            {hasPromotions && (
              <Badge className="pointer-events-none rounded-full border-rose-500 bg-rose-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-rose-500">
                Есть акции
              </Badge>
            )}
          </div>

          <div className="mt-auto shrink-0 p-5 pt-6 text-white">
            <h3
              className="
                font-heading leading-snug [overflow-wrap:anywhere]
                text-lg sm:text-xl
              "
            >
              {tour.title}
            </h3>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {" "}
        <p className="text-sm leading-relaxed text-neutral-700 line-clamp-2 min-h-[2.6em]">
          {description}
        </p>
        <div className="mt-4 flex min-h-[72px] flex-wrap items-start gap-2">
          {" "}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-[#C2410C]">
            <Calendar className="size-3.5" />
            {tour.duration}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700">
            <TransportIcon className="size-3.5" aria-hidden="true" />
            {formatDepartureFrom(tour)}
          </span>
        </div>
        <div className="mt-auto flex items-end justify-between border-t border-orange-100/80 pt-4">
          {" "}
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
