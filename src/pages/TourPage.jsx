import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { api, API_BASE } from "@/lib/api";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Calendar,
  MapPin,
  Bus,
  BadgeCheck,
  X as XIcon,
  Info,
  Phone,
  Hotel,
  WalletCards,
  Percent,
  Download,
} from "lucide-react";
import LeadForm from "@/components/LeadForm";
import LeadDialog from "@/components/LeadDialog";
import { useSiteData } from "@/lib/useSiteData";
import { mediaUrl } from "@/lib/media";
import PageSeo from "@/components/PageSeo";
import { canonicalUrl } from "@/components/Seo";
import { trackTourView } from "@/lib/analytics";
import { RichText } from "@/lib/richText";
import {
  getTourTransportType,
  TOUR_TRANSPORT_TYPES,
} from "@/lib/tourTransport";
import { getDirectionLandingForTour } from "@/lib/seoLandings";

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

const SECTIONS = [
  ["program", "Программа"],
  ["price", "Что входит"],
  ["faq", "Вопрос-ответ"],
  ["gallery", "Галерея"],
  ["highlights", "Особенности"],
  ["about-tour", "О туре"],
];

const glassText =
  "w-fit bg-black/35 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2";

const SAFE_MAP_HOST_SUFFIXES = [
  "google.com",
  "google.by",
  "google.ru",
  "yandex.com",
  "yandex.by",
  "yandex.ru",
  "openstreetmap.org",
];

function safeMapEmbedUrl(value) {
  const input = String(value || "").trim();
  if (!input) return "";

  const iframeSrc = input.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
  const source = (iframeSrc || input).replaceAll("&amp;", "&");

  try {
    const url = new URL(source);
    const hostname = url.hostname.toLowerCase();
    const trustedHost = SAFE_MAP_HOST_SUFFIXES.some(
      (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
    );
    return url.protocol === "https:" && trustedHost ? url.href : "";
  } catch {
    return "";
  }
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

  return `Из ${cities.join(", ")}`;
}

const ROOM_MEAL_PLANS = [
  { key: "breakfast", label: "Завтрак" },
  { key: "breakfast_lunch", label: "Завтрак + обед" },
  { key: "breakfast_dinner", label: "Завтрак + ужин" },
  { key: "breakfast_full", label: "Завтрак + обед + ужин" },
];

function hasPriceValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function firstPriceValue(...values) {
  return values.find(hasPriceValue) ?? "";
}

function hasMealPriceValue(meal = {}) {
  return hasPriceValue(meal.price) || hasPriceValue(meal.additional_price);
}

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

function getMainPrice(source, fallbackTour) {
  return source?.price ?? source?.price_from ?? fallbackTour?.price_from ?? "";
}

function getMainCurrency(source, fallbackTour) {
  return source?.currency || fallbackTour?.currency || "BYN";
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

  return source?.currency || fallbackTour?.currency || "BYN";
}

function isPromotionDate(date) {
  return date?.promotion_active === true;
}

function getPromotionPriceParts(item, fallbackTour) {
  if (
    !isPromotionDate(item) ||
    (!hasPriceValue(item?.promotion_price) &&
      !hasPriceValue(item?.promotion_additional_price))
  ) {
    return null;
  }

  const oldMain = getMainPrice(item, fallbackTour);
  const oldCurrency = getMainCurrency(item, fallbackTour);
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
  currencyClassName = "",
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

function PromotionPriceInline({
  item,
  fallbackTour,
  className = "",
  oldClassName = "",
  newClassName = "",
  currencyClassName = "",
  oldCurrencyClassName = "",
  showBadge = false,
}) {
  const promoParts = getPromotionPriceParts(item, fallbackTour);
  if (!promoParts) return null;

  return (
    <span className={`inline-flex min-w-0 flex-col gap-0.5 ${className}`}>
      {showBadge && (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
          <Percent className="size-3" /> Акция
        </span>
      )}
      <span
        className={`text-neutral-400 line-through decoration-rose-400 decoration-2 ${oldClassName}`}
      >
        <PriceParts
          main={promoParts.oldMain}
          currency={promoParts.oldCurrency}
          additional={promoParts.oldAdditional}
          additionalCurrency={promoParts.oldAdditionalCurrency}
          currencyClassName={oldCurrencyClassName}
        />
      </span>
      <span className={`font-semibold text-rose-600 ${newClassName}`}>
        <PriceParts
          main={promoParts.newMain}
          currency={promoParts.newCurrency}
          additional={promoParts.newAdditional}
          additionalCurrency={promoParts.newAdditionalCurrency}
          currencyClassName={currencyClassName}
        />
      </span>
    </span>
  );
}

// CHANGE: хелперы для цены конкретного номера отеля по выбранной дате
function getRoomDatePrice(room, date, mealPlanKey = "breakfast") {
  if (!room || !date) return null;

  const datePrices = Array.isArray(room.date_prices)
    ? room.date_prices
    : Array.isArray(room.datePrices)
      ? room.datePrices
      : [];
  const key = date.id || date.start;
  const label = fmtDateRange(date);

  const priceRecord = datePrices.find(
    (item) =>
      item.date_id === key ||
      item.dateId === key ||
      item.date_start === date.start ||
      item.dateStart === date.start ||
      item.date_label === label ||
      item.dateLabel === label,
  );

  const mealPrices = priceRecord?.meal_prices || priceRecord?.mealPrices || {};
  const hasStructuredMealPrices = Object.keys(mealPrices).length > 0;
  const rawMeal =
    mealPrices[mealPlanKey] ||
    (!hasStructuredMealPrices ? mealPrices.breakfast : null);

  if (rawMeal && hasMealPriceValue(rawMeal)) {
    const promotionPrice = firstPriceValue(
      rawMeal.promotion_price,
      rawMeal.promotionPrice,
      rawMeal.promo_price,
      rawMeal.promoPrice,
      rawMeal.sale_price,
      rawMeal.salePrice,
      rawMeal.discount_price,
      rawMeal.discountPrice,
    );
    const promotionAdditionalPrice = firstPriceValue(
      priceRecord.promotion_additional_price,
      priceRecord.promotionAdditionalPrice,
      priceRecord.promo_additional_price,
      priceRecord.promoAdditionalPrice,
      priceRecord.sale_additional_price,
      priceRecord.saleAdditionalPrice,
      priceRecord.discount_additional_price,
      priceRecord.discountAdditionalPrice,
    );

    return {
      price: rawMeal.price ?? "",
      currency: rawMeal.currency || priceRecord.currency || room.currency,
      additional_price:
        priceRecord.additional_price ?? priceRecord.additionalPrice ?? "",
      additional_currency:
        priceRecord.additional_currency ||
        priceRecord.additionalCurrency ||
        priceRecord.currency ||
        rawMeal.currency ||
        room.currency,
      promotion_active:
        isPromotionDate(date) &&
        (hasPriceValue(promotionPrice) ||
          hasPriceValue(promotionAdditionalPrice)),
      promotion_price: promotionPrice,
      promotion_currency:
        rawMeal.promotion_currency ||
        rawMeal.promotionCurrency ||
        rawMeal.promo_currency ||
        rawMeal.promoCurrency ||
        rawMeal.sale_currency ||
        rawMeal.saleCurrency ||
        rawMeal.currency ||
        priceRecord.currency ||
        room.currency,
      promotion_additional_price: promotionAdditionalPrice,
      promotion_additional_currency:
        priceRecord.promotion_additional_currency ||
        priceRecord.promotionAdditionalCurrency ||
        priceRecord.promo_additional_currency ||
        priceRecord.promoAdditionalCurrency ||
        priceRecord.sale_additional_currency ||
        priceRecord.saleAdditionalCurrency ||
        priceRecord.additional_currency ||
        priceRecord.currency ||
        rawMeal.currency ||
        room.currency,
      meal_plan_key: mealPlanKey,
      meal_plan_label:
        ROOM_MEAL_PLANS.find((plan) => plan.key === mealPlanKey)?.label ||
        "Завтрак",
    };
  }

  if (hasStructuredMealPrices) {
    return null;
  }

  const hasMainPrice = hasPriceValue(priceRecord?.price);
  const hasAdditionalPrice = hasPriceValue(priceRecord?.additional_price);

  if (hasMainPrice || hasAdditionalPrice) {
    const promotionPrice = firstPriceValue(
      priceRecord?.promotion_price,
      priceRecord?.promotionPrice,
      priceRecord?.promo_price,
      priceRecord?.promoPrice,
      priceRecord?.sale_price,
      priceRecord?.salePrice,
      priceRecord?.discount_price,
      priceRecord?.discountPrice,
    );
    const promotionAdditionalPrice = firstPriceValue(
      priceRecord?.promotion_additional_price,
      priceRecord?.promotionAdditionalPrice,
      priceRecord?.promo_additional_price,
      priceRecord?.promoAdditionalPrice,
      priceRecord?.sale_additional_price,
      priceRecord?.saleAdditionalPrice,
      priceRecord?.discount_additional_price,
      priceRecord?.discountAdditionalPrice,
    );

    return {
      ...priceRecord,
      currency: priceRecord.currency || room.currency,
      additional_currency:
        priceRecord.additional_currency ||
        priceRecord.currency ||
        room.currency,
      promotion_active:
        isPromotionDate(date) &&
        (hasPriceValue(promotionPrice) ||
          hasPriceValue(promotionAdditionalPrice)),
      promotion_price: promotionPrice,
      promotion_currency:
        priceRecord.promotion_currency ||
        priceRecord.promotionCurrency ||
        priceRecord.currency ||
        room.currency,
      promotion_additional_price: promotionAdditionalPrice,
      promotion_additional_currency:
        priceRecord.promotion_additional_currency ||
        priceRecord.promotionAdditionalCurrency ||
        priceRecord.additional_currency ||
        priceRecord.currency ||
        room.currency,
      meal_plan_key: "breakfast",
      meal_plan_label: "Завтрак",
    };
  }

  const hasLegacyMainPrice = hasPriceValue(room.price);
  const hasLegacyAdditionalPrice = hasPriceValue(room.additional_price);

  if (hasLegacyMainPrice || hasLegacyAdditionalPrice) {
    return {
      price: room.price,
      currency: room.currency,
      additional_price: room.additional_price,
      additional_currency: room.additional_currency || room.currency,
      meal_plan_key: "breakfast",
      meal_plan_label: "Завтрак",
    };
  }

  return null;
}

function getEffectiveRoomPriceRecord(priceRecord) {
  if (!priceRecord) return null;

  if (!getPromotionPriceParts(priceRecord)) return priceRecord;

  return {
    ...priceRecord,
    price: hasPriceValue(priceRecord.promotion_price)
      ? priceRecord.promotion_price
      : priceRecord.price,
    currency: priceRecord.promotion_currency || priceRecord.currency || "BYN",
    additional_price: hasPriceValue(priceRecord.promotion_additional_price)
      ? priceRecord.promotion_additional_price
      : priceRecord.additional_price,
    additional_currency:
      priceRecord.promotion_additional_currency ||
      priceRecord.additional_currency ||
      priceRecord.currency ||
      "BYN",
  };
}

function formatRoomPrice(priceRecord) {
  if (!priceRecord) return "";

  const effectivePrice = getEffectiveRoomPriceRecord(priceRecord);

  const parts = [];
  if (hasPriceValue(effectivePrice.price)) {
    parts.push(
      `${effectivePrice.price} ${formatCurrency(effectivePrice.currency)}`,
    );
  }
  if (hasPriceValue(effectivePrice.additional_price)) {
    parts.push(
      `${effectivePrice.additional_price} ${formatCurrency(
        effectivePrice.additional_currency,
      )}`,
    );
  }

  return parts.join(" + ");
}

function formatRoomBasePrice(priceRecord) {
  const effectivePrice = getEffectiveRoomPriceRecord(priceRecord);
  if (!effectivePrice || !hasPriceValue(effectivePrice.price)) return "";

  return `${effectivePrice.price} ${formatCurrency(effectivePrice.currency)}`;
}

function getRoomPricesForDate(room, date) {
  return ROOM_MEAL_PLANS.map((plan) => ({
    ...plan,
    price: getRoomDatePrice(room, date, plan.key),
  })).filter((item) => item.price && formatRoomPrice(item.price));
}

function getRoomMinPrice(room, dates = []) {
  const allPrices = dates.flatMap((date) =>
    getRoomPricesForDate(room, date).map((item) => item.price),
  );

  const priced = allPrices
    .map((price) => ({
      ...price,
      numeric: Number(
        hasPriceValue(price.promotion_price) && price.promotion_active === true
          ? price.promotion_price
          : price.price,
      ),
    }))
    .filter((price) => Number.isFinite(price.numeric));

  if (!priced.length) return null;
  return priced.sort((a, b) => a.numeric - b.numeric)[0];
}

function getPromotionRoomMinPrice(chains = [], date) {
  if (!date) return null;

  const targetChain = chains.find((chain, chainIndex) => {
    const chainId = chain.id || `chain-${chainIndex}`;

    if (date._chainId && String(chainId) === String(date._chainId)) {
      return true;
    }

    return (chain.dates || []).some(
      (chainDate) => String(dateKey(chainDate)) === String(dateKey(date)),
    );
  });

  if (!targetChain) return null;

  const promotionPrices = (targetChain.hotels || [])
    .flatMap((hotel) => hotel.rooms || [])
    .filter((room) => room.active !== false)
    .flatMap((room) =>
      getRoomPricesForDate(room, date)
        .map((item) => item.price)
        .filter((price) => getPromotionPriceParts(price)),
    )
    .map((price) => ({
      ...price,
      numeric: Number(
        hasPriceValue(price.promotion_price)
          ? price.promotion_price
          : price.price,
      ),
    }))
    .filter((price) => Number.isFinite(price.numeric));

  if (!promotionPrices.length) return null;

  return promotionPrices.sort((a, b) => a.numeric - b.numeric)[0];
}

function MobilePromotionPricePreview({ date, chains, tour }) {
  if (!date) return null;

  const roomPrice = getPromotionRoomMinPrice(chains, date);
  const datePrice = getPromotionPriceParts(date, tour);

  return (
    <div
      className="mt-2 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white px-3.5 py-3 shadow-sm sm:hidden"
      aria-live="polite"
      data-testid="mobile-promotion-price-preview"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-700">
            <WalletCards className="size-3.5" /> Цена по акции
          </span>
          {/* <p className="mt-0.5 truncate text-xs font-medium text-neutral-700">
            {fmtDateRangeCompact(date)}
          </p> */}
        </div>

        {roomPrice ? (
          <span className="flex shrink-0 items-end gap-1 text-right text-rose-700">
            <span className="pb-0.5 text-[10px] font-semibold uppercase">
              от
            </span>
            <RoomPriceRecordInline
              priceRecord={roomPrice}
              className="items-end"
              oldClassName="text-[10px]"
              newClassName="font-heading text-lg font-bold"
            />
          </span>
        ) : datePrice ? (
          <DatePriceInline
            item={date}
            fallbackTour={tour}
            className="shrink-0 items-end text-right text-rose-700"
            currencyClassName="text-xs"
          />
        ) : (
          <span className="shrink-0 text-xs font-semibold text-neutral-600">
            Уточнить у менеджера
          </span>
        )}
      </div>
    </div>
  );
}

function RoomPriceRecordInline({
  priceRecord,
  className = "",
  oldClassName = "text-[10px] sm:text-xs",
  newClassName = "font-semibold",
  currencyClassName = "",
  showBadge = false,
}) {
  if (!priceRecord) return null;

  if (getPromotionPriceParts(priceRecord)) {
    return (
      <PromotionPriceInline
        item={priceRecord}
        className={className}
        oldClassName={oldClassName}
        newClassName={newClassName}
        currencyClassName={currencyClassName}
        oldCurrencyClassName="text-[9px] sm:text-[10px]"
        showBadge={showBadge}
      />
    );
  }

  return <span className={className}>{formatRoomPrice(priceRecord)}</span>;
}

function RoomPriceInline({
  room,
  date,
  className = "",
  mealPlanKey = "breakfast",
  showBadge = false,
}) {
  const priceRecord = getRoomDatePrice(room, date, mealPlanKey);

  return (
    <RoomPriceRecordInline
      priceRecord={priceRecord}
      className={className}
      showBadge={showBadge}
    />
  );
}

function RoomMinPriceInline({ room, dates = [], className = "" }) {
  const priceRecord = getRoomMinPrice(room, dates);
  if (!priceRecord) return null;

  return (
    <span className={className}>
      <span className="mr-1">от</span>
      <RoomPriceRecordInline
        priceRecord={priceRecord}
        className="inline-flex"
        oldClassName="text-[9px]"
        newClassName="font-semibold"
      />
    </span>
  );
}

function PriceInline({
  item,
  fallbackTour,
  promotionDate,
  className = "",
  currencyClassName = "",
}) {
  if (promotionDate) {
    return (
      <PromotionPriceInline
        item={promotionDate}
        fallbackTour={fallbackTour || item}
        className="mt-1"
        oldClassName="font-heading text-2xl font-bold"
        newClassName={className}
        currencyClassName={currencyClassName}
        oldCurrencyClassName="text-sm font-medium"
        showBadge
      />
    );
  }

  return (
    <span className={className}>
      <PriceParts
        main={getMainPrice(item, fallbackTour)}
        currency={getMainCurrency(item, fallbackTour)}
        additional={getAdditionalPrice(item, fallbackTour)}
        additionalCurrency={getAdditionalCurrency(item, fallbackTour)}
        currencyClassName={currencyClassName}
      />
    </span>
  );
}

function formatDate(date) {
  if (!date) return "";

  const [year, month, day] = date.split("-");

  return `${day}.${month}.${year}`;
}

function fmtDateRange(d) {
  if (!d?.start) return "";
  if (!d?.end) return formatDate(d.start);

  return `${formatDate(d.start)} → ${formatDate(d.end)}`;
}

function fmtDateRangeCompact(d) {
  if (!d?.start) return "";
  if (!d?.end) return formatDate(d.start);

  return `${formatDate(d.start)}–${formatDate(d.end)}`;
}

function PromotionDateHint({
  promotionDate,
  label = "Акция только на даты",
  className = "",
  dateClassName = "",
}) {
  if (!promotionDate) return null;

  return (
    <p className={`text-xs leading-5 text-neutral-600 ${className}`}>
      <span>{label}: </span>
      <span className={`font-semibold text-neutral-900 ${dateClassName}`}>
        {fmtDateRangeCompact(promotionDate)}
      </span>
    </p>
  );
}

function dateKey(d) {
  return d?.id || d?.start || fmtDateRange(d);
}

function dateDomKey(d) {
  return String(dateKey(d) || "date")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isElementVisible(target) {
  if (!target || typeof window === "undefined") return false;

  const rect = target.getBoundingClientRect();
  const style = window.getComputedStyle(target);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden"
  );
}

function findPromotionDateTarget(date) {
  if (!date || typeof document === "undefined") return null;

  const key = dateDomKey(date);
  const pageTargets = Array.from(
    document.querySelectorAll(
      `[data-promo-scroll-target="true"][data-promo-date-key="${key}"]`,
    ),
  );
  const fallbackTargets = Array.from(
    document.querySelectorAll(`[data-promo-date-key="${key}"]`),
  );

  return (
    pageTargets.find(isElementVisible) ||
    fallbackTargets.find(isElementVisible) ||
    pageTargets[0] ||
    fallbackTargets[0] ||
    null
  );
}

function scrollToPromotionDate(date, { highlight = true } = {}) {
  const target = findPromotionDateTarget(date);

  if (!target) return false;

  const scrollAgain = (delay) => {
    window.setTimeout(() => {
      const currentTarget = findPromotionDateTarget(date) || target;
      scrollToAnchorTarget(currentTarget, "smooth");
    }, delay);
  };

  scrollToAnchorTarget(target, "smooth");
  scrollAgain(120);
  scrollAgain(320);
  scrollAgain(650);

  if (highlight) {
    target.classList.add("ring-2", "ring-rose-400", "ring-offset-2");
    window.setTimeout(() => {
      target.classList.remove("ring-2", "ring-rose-400", "ring-offset-2");
    }, 2200);
  }

  return true;
}

const MONTH_NAMES_RU = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

function getDateMonthLabel(date) {
  if (date?.month_title || date?.monthTitle) {
    return date.month_title || date.monthTitle;
  }

  const source = date?.start || date?.end || "";
  const monthIndex = Number(source.split("-")[1]) - 1;

  return MONTH_NAMES_RU[monthIndex] || "Даты";
}

function groupDatesByMonth(dates = []) {
  return sortDatesByStart(dates).reduce((groups, date) => {
    const title = getDateMonthLabel(date);
    const last = groups[groups.length - 1];

    if (last?.title === title) {
      last.items.push(date);
      return groups;
    }

    groups.push({ title, items: [date] });
    return groups;
  }, []);
}

function getDateTime(date, field = "start") {
  const value = date?.[field] || date?.start || date?.end || "";
  const time = Date.parse(value);

  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}

function sortDatesByStart(dates = []) {
  return [...(dates || [])]
    .map((date, index) => ({ date, index }))
    .sort((a, b) => {
      const startDiff =
        getDateTime(a.date, "start") - getDateTime(b.date, "start");

      if (startDiff !== 0) return startDiff;

      const endDiff = getDateTime(a.date, "end") - getDateTime(b.date, "end");

      if (endDiff !== 0) return endDiff;

      return a.index - b.index;
    })
    .map(({ date }) => date);
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

function cleanAnchorSlug(value = "") {
  const rawValue = String(value || "").trim();
  const hashValue = rawValue.includes("#")
    ? rawValue.split("#").pop()
    : rawValue;

  return String(hashValue || "")
    .toLowerCase()
    .replace(/^hotel-/, "")
    .replace(/[а-яё]/g, (char) => {
      const map = {
        а: "a",
        б: "b",
        в: "v",
        г: "g",
        д: "d",
        е: "e",
        ё: "e",
        ж: "zh",
        з: "z",
        и: "i",
        й: "y",
        к: "k",
        л: "l",
        м: "m",
        н: "n",
        о: "o",
        п: "p",
        р: "r",
        с: "s",
        т: "t",
        у: "u",
        ф: "f",
        х: "h",
        ц: "ts",
        ч: "ch",
        ш: "sh",
        щ: "sch",
        ъ: "",
        ы: "y",
        ь: "",
        э: "e",
        ю: "yu",
        я: "ya",
      };

      return map[char] || char;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeHotelAnchorId(value = "") {
  const slug = cleanAnchorSlug(value);
  return slug ? `hotel-${slug}` : "";
}

function getHotelAnchorAliases(hotel, chain, chainIndex, hotelIndex) {
  const indexFallback = `${chainIndex + 1}-${hotelIndex + 1}`;
  const chainTitle = chain?.title || chain?.name || "";

  return Array.from(
    new Set(
      [
        // Ручной якорь из админки всегда главный.
        makeHotelAnchorId(hotel?.anchor_slug || hotel?.anchor || hotel?.slug),
        // Стабильная ссылка по id отеля. Она не ломается, если меняется название отеля/цепочки.
        makeHotelAnchorId(hotel?.id),
        makeHotelAnchorId(hotel?.name),
        // Старые ссылки, которые уже могли быть скопированы кнопкой до исправления.
        makeHotelAnchorId(chainTitle ? `${chainTitle}-${hotelIndex + 1}` : ""),
        makeHotelAnchorId(chainTitle),
        makeHotelAnchorId(chain?.id ? `${chain.id}-${hotelIndex + 1}` : ""),
        makeHotelAnchorId(indexFallback),
      ].filter(Boolean),
    ),
  );
}

function getHotelAnchorId(hotel, chain, chainIndex, hotelIndex) {
  const aliases = getHotelAnchorAliases(hotel, chain, chainIndex, hotelIndex);
  return aliases[0] || `hotel-${chainIndex + 1}-${hotelIndex + 1}`;
}

function DateDialogChainTitle({ title }) {
  const value = String(title || "").trim();
  if (!value) return null;

  const hotelTitleMatch = value.match(/^(.*?для\s+отеля\s+)(.+)$/i);

  if (hotelTitleMatch) {
    return (
      <p className="mb-3 flex flex-wrap items-baseline gap-1.5 text-sm font-medium text-neutral-700 sm:text-base">
        <span>{hotelTitleMatch[1]}</span>
        <span className="font-heading text-base font-bold text-neutral-950 sm:text-lg">
          {hotelTitleMatch[2]}
        </span>
      </p>
    );
  }

  return (
    <p className="mb-3 font-heading text-base font-bold text-neutral-950 sm:text-lg">
      {value}
    </p>
  );
}

function getAnchorCandidates(hash = "") {
  const rawHash = decodeURIComponent(
    String(hash || "").replace(/^#/, ""),
  ).trim();
  const cleanSlug = cleanAnchorSlug(rawHash);

  return Array.from(
    new Set(
      [
        rawHash,
        rawHash.toLowerCase(),
        cleanSlug,
        cleanSlug ? `hotel-${cleanSlug}` : "",
      ].filter(Boolean),
    ),
  );
}

function getAnchorTarget(hash = "") {
  const candidates = getAnchorCandidates(hash);

  return candidates
    .map((candidate) => document.getElementById(candidate))
    .find(Boolean);
}

function scrollToAnchorTarget(target, behavior = "smooth") {
  if (!target) return;

  // На мобильном экране одновременно закреплены основной header и навигация
  // по разделам тура. Оставляем небольшой дополнительный зазор, чтобы после
  // прокрутки акционная дата целиком была видна под обоими sticky-блоками.
  const offset = window.innerWidth < 768 ? 132 : 116;
  const top = target.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top: Math.max(0, top),
    behavior,
  });
}

function resolveChainTitle(chain, chainIndex, fallback = "") {
  if (!chain) return fallback;
  if (chain.title !== undefined) return String(chain.title || "");
  if (chain.name !== undefined) return String(chain.name || "");
  return fallback;
}

function getUpcomingDatesFromChains(chains = []) {
  return chains
    .flatMap((chain, chainIndex) =>
      (chain.dates || []).map((date, dateIndex) => ({
        ...date,
        _chainId: chain.id || `chain-${chainIndex}`,
        _chainTitle: resolveChainTitle(chain, chainIndex),
        _dateListKey: `${chain.id || chainIndex}-${date.id || date.start || dateIndex}`,
      })),
    )
    .filter((date) => date.status !== "hidden" && isDateActual(date))
    .sort((a, b) => getDateTime(a) - getDateTime(b));
}

function shouldShowFromPrice(item, defaultValue = true) {
  const value = String(
    item?.price_type ||
      item?.priceType ||
      item?.price_label ||
      item?.priceLabel ||
      "",
  ).toLowerCase();

  if (!value) return defaultValue;

  return ["from", "от", "price_from", "starting_from"].includes(value);
}

function DatePriceInline({
  item,
  fallbackTour,
  className = "",
  currencyClassName = "",
  defaultFrom = true,
}) {
  if (
    !hasPriceValue(item?.price ?? item?.price_from ?? fallbackTour?.price_from)
  ) {
    return null;
  }

  const promoParts = getPromotionPriceParts(item, fallbackTour);

  if (promoParts) {
    return (
      <span className={className}>
        {shouldShowFromPrice(item, defaultFrom) && (
          <span className="mr-1 text-current opacity-70">от</span>
        )}
        <PromotionPriceInline
          item={item}
          fallbackTour={fallbackTour}
          className="align-middle"
          oldClassName="text-xs sm:text-sm"
          newClassName="font-heading text-base sm:text-xl"
          currencyClassName={currencyClassName}
          oldCurrencyClassName="text-[10px] sm:text-xs"
          showBadge={false}
        />
      </span>
    );
  }

  return (
    <span className={className}>
      {shouldShowFromPrice(item, defaultFrom) && (
        <span className="mr-1 text-current opacity-70">от</span>
      )}
      <PriceInline
        item={item}
        fallbackTour={fallbackTour}
        currencyClassName={currencyClassName}
      />
    </span>
  );
}

function getRoomUnavailableDates(room) {
  return room?.unavailable_dates || room?.unavailableDates || [];
}

function isRoomUnavailableOnDate(room, date) {
  const unavailable = getRoomUnavailableDates(room);
  return unavailable.includes(date?.id) || unavailable.includes(date?.start);
}

function buildLegacyChain(tour) {
  const dates = sortDatesByStart(
    (tour.dates || []).filter((d) => d.status !== "hidden" && isDateActual(d)),
  );
  const hotels = tour.hotels || [];

  if (!dates.length && !hotels.length) return [];

  return [
    {
      id: "legacy-chain",
      title: "Основное расписание",
      dates,
      hotels: hotels.map((hotel) => ({
        ...hotel,
        rooms: hotel.rooms || [],
      })),
    },
  ];
}

function getTourChains(tour) {
  const chains = Array.isArray(tour.chains) ? tour.chains : [];

  if (chains.length) {
    return chains
      .filter((chain) => chain?.active !== false)
      .map((chain, index) => ({
        ...chain,
        title: resolveChainTitle(chain, index),
        dates: sortDatesByStart(
          (chain.dates || []).filter(
            (d) => d.status !== "hidden" && isDateActual(d),
          ),
        ),
        hotels: (chain.hotels || []).filter((h) => h.active !== false),
      }));
  }

  return buildLegacyChain(tour);
}

function getHotelImages(hotel) {
  if (Array.isArray(hotel?.images) && hotel.images.length) {
    return hotel.images.filter(Boolean);
  }

  return hotel?.image ? [hotel.image] : [];
}

function getProgramImages(day) {
  if (Array.isArray(day?.images) && day.images.length) {
    return day.images.filter(Boolean);
  }

  return day?.image ? [day.image] : [];
}

function getProgramDayTitle(day) {
  const value = String(day?.day || "").trim();

  if (!value) return "День";

  const isRange = /[-–—,]/.test(value);
  return `${isRange ? "Дни" : "День"} ${value}`;
}

function getTourHeroImage(tour, variant = "desktop") {
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

export default function TourPage() {
  const { slug } = useParams();
  const location = useLocation();
  const [tour, setTour] = useState(null);
  const [error, setError] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [pricesOpen, setPricesOpen] = useState(false);
  const [mobilePromotionPreview, setMobilePromotionPreview] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedHotel, setSelectedHotel] = useState("");
  const [selectedRoomTitle, setSelectedRoomTitle] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingStep, setBookingStep] = useState(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState("breakfast");
  const [selectedRoomPrice, setSelectedRoomPrice] = useState(null);
  const [hotelSlideById, setHotelSlideById] = useState({});
  const [roomSlide, setRoomSlide] = useState(0);
  const [tourGallerySlide, setTourGallerySlide] = useState(0);
  const [programSlideByKey, setProgramSlideByKey] = useState({});
  const [roomCardSlideById, setRoomCardSlideById] = useState({});
  const [roomScrollerHints, setRoomScrollerHints] = useState({});
  const roomScrollerRefs = useRef({});
  const roomLastCardRefs = useRef({});
  const roomHintObservers = useRef({});
  const { tours } = useSiteData();
  const chains = useMemo(() => (tour ? getTourChains(tour) : []), [tour]);
  const mapEmbedUrl = useMemo(
    () => safeMapEmbedUrl(tour?.map_embed),
    [tour?.map_embed],
  );
  const upcomingDates = useMemo(
    () => getUpcomingDatesFromChains(chains),
    [chains],
  );
  const promotionDates = useMemo(
    () => upcomingDates.filter(isPromotionDate),
    [upcomingDates],
  );
  const firstPromotionDate = promotionDates[0];
  const firstPromotionRoomPrice = useMemo(
    () => getPromotionRoomMinPrice(chains, firstPromotionDate),
    [chains, firstPromotionDate],
  );

  const setRoomScrollerHasMore = useCallback((carouselKey, hasMore) => {
    setRoomScrollerHints((prev) => {
      if (prev[carouselKey]?.hasMore === hasMore) return prev;

      return {
        ...prev,
        [carouselKey]: { hasMore },
      };
    });
  }, []);

  const disconnectRoomHintObserver = useCallback((carouselKey) => {
    roomHintObservers.current[carouselKey]?.disconnect();
    delete roomHintObservers.current[carouselKey];
  }, []);

  const updateRoomScrollerHintByLastCard = useCallback(
    (carouselKey) => {
      const scroller = roomScrollerRefs.current[carouselKey];
      const lastCard = roomLastCardRefs.current[carouselKey];
      if (!scroller || !lastCard) return;

      const hasOverflow = scroller.scrollWidth > scroller.clientWidth + 4;
      if (!hasOverflow) {
        setRoomScrollerHasMore(carouselKey, false);
        return;
      }

      const scrollerRect = scroller.getBoundingClientRect();
      const lastCardRect = lastCard.getBoundingClientRect();
      const visibleWidth = Math.max(
        0,
        Math.min(lastCardRect.right, scrollerRect.right) -
          Math.max(lastCardRect.left, scrollerRect.left),
      );
      const visibleRatio = lastCardRect.width
        ? visibleWidth / lastCardRect.width
        : 0;

      setRoomScrollerHasMore(carouselKey, visibleRatio < 0.6);
    },
    [setRoomScrollerHasMore],
  );

  const observeRoomLastCard = useCallback(
    (carouselKey) => {
      const scroller = roomScrollerRefs.current[carouselKey];
      const lastCard = roomLastCardRefs.current[carouselKey];
      if (!scroller || !lastCard) return;

      disconnectRoomHintObserver(carouselKey);

      const hasOverflow = scroller.scrollWidth > scroller.clientWidth + 4;
      if (!hasOverflow) {
        setRoomScrollerHasMore(carouselKey, false);
        return;
      }

      if (typeof IntersectionObserver === "undefined") {
        updateRoomScrollerHintByLastCard(carouselKey);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          const isLastRoomVisible =
            entry.isIntersecting && entry.intersectionRatio >= 0.6;

          setRoomScrollerHasMore(carouselKey, !isLastRoomVisible);
        },
        {
          root: scroller,
          threshold: [0, 0.25, 0.6, 0.85, 1],
        },
      );

      observer.observe(lastCard);
      roomHintObservers.current[carouselKey] = observer;
      updateRoomScrollerHintByLastCard(carouselKey);
    },
    [
      disconnectRoomHintObserver,
      setRoomScrollerHasMore,
      updateRoomScrollerHintByLastCard,
    ],
  );

  useEffect(() => {
    const updateAllRoomHints = () => {
      window.requestAnimationFrame(() => {
        Object.keys(roomScrollerRefs.current).forEach(observeRoomLastCard);
      });
    };

    updateAllRoomHints();
    window.addEventListener("resize", updateAllRoomHints);

    return () => {
      window.removeEventListener("resize", updateAllRoomHints);
      Object.values(roomHintObservers.current).forEach((observer) =>
        observer.disconnect(),
      );
      roomHintObservers.current = {};
    };
  }, [chains, observeRoomLastCard]);

  useEffect(() => {
    setTour(null);
    setError(false);
    api
      .get(`/tours/${slug}`)
      .then((r) => setTour(r.data))
      .catch(() => setError(true));
  }, [slug]);

  useEffect(() => {
    if (!selectedRoom) {
      setBookingStep(null);
      setSelectedMealPlan("breakfast");
      setSelectedRoomPrice(null);
      return;
    }

    const firstAvailableDate = (selectedRoom.chain.dates || []).find(
      (date) => !isRoomUnavailableOnDate(selectedRoom.room, date),
    );
    const firstMealPrice = firstAvailableDate
      ? getRoomPricesForDate(selectedRoom.room, firstAvailableDate)[0]
      : null;

    setBookingStep(
      firstAvailableDate
        ? {
            date: firstAvailableDate,
            dateLabel: fmtDateRange(firstAvailableDate),
          }
        : null,
    );
    setSelectedMealPlan(firstMealPrice?.key || "breakfast");
    setSelectedRoomPrice(firstMealPrice?.price || null);
  }, [selectedRoom]);

  useEffect(() => {
    if (tour?.slug) {
      trackTourView(tour);
    }
  }, [tour]);

  const handleShowPromotionDate = useCallback(() => {
    setPricesOpen(false);

    const tryScroll = (attempt = 0) => {
      if (
        scrollToPromotionDate(firstPromotionDate, { highlight: attempt === 0 })
      ) {
        return;
      }

      if (attempt < 10) {
        window.setTimeout(() => tryScroll(attempt + 1), attempt < 3 ? 80 : 160);
        return;
      }

      setPricesOpen(true);
    };

    window.requestAnimationFrame(() => tryScroll());
  }, [firstPromotionDate]);

  useEffect(() => {
    if (!tour || !location.hash) return;

    let cancelled = false;
    const timerIds = [];

    const schedule = (callback, delay) => {
      const timerId = window.setTimeout(callback, delay);
      timerIds.push(timerId);
      return timerId;
    };

    const scrollToHash = (hash, attempt = 0, settleAttempt = 0) => {
      if (cancelled || !hash) return;

      const target = getAnchorTarget(hash);

      if (target) {
        window.requestAnimationFrame(() => {
          if (!cancelled) {
            scrollToAnchorTarget(
              target,
              attempt <= 1 && settleAttempt === 0 ? "auto" : "smooth",
            );
          }
        });

        // После первого скролла продолжаем несколько раз поправлять позицию:
        // на проде картинки/аккордеоны/шрифты могут догружаться и сдвигать карточку ниже.
        if (settleAttempt < 8) {
          schedule(
            () => scrollToHash(hash, attempt, settleAttempt + 1),
            settleAttempt === 0 ? 180 : 260,
          );
        }

        return;
      }

      if (attempt < 50) {
        schedule(() => scrollToHash(hash, attempt + 1, 0), 100);
      }
    };

    const startScroll = () => {
      scrollToHash(window.location.hash || location.hash);
    };

    schedule(startScroll, 0);
    schedule(startScroll, 250);

    window.addEventListener("hashchange", startScroll);
    window.addEventListener("load", startScroll);

    return () => {
      cancelled = true;
      timerIds.forEach((timerId) => window.clearTimeout(timerId));
      window.removeEventListener("hashchange", startScroll);
      window.removeEventListener("load", startScroll);
    };
  }, [tour, chains.length, location.hash]);

  if (error) {
    return (
      <div className="section-container section-pad text-center">
        <PageSeo
          title="Тур не найден | TRAVELSPACE"
          description="Тур не найден."
          path={`/tours/${slug}`}
          noIndex
        />
        <h1 className="font-heading text-3xl">Тур не найден</h1>
        <Link
          to="/tours"
          className="text-[#C2410C] underline mt-4 inline-block"
        >
          Вернуться к каталогу
        </Link>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="pt-32 lg:pt-36 min-h-screen">
        <PageSeo
          title="Тур | TRAVELSPACE"
          description="Загрузка тура."
          path={`/tours/${slug}`}
          noIndex
        />
        <div className="section-container text-neutral-400">Загрузка...</div>
      </div>
    );
  }

  const dates = upcomingDates;
  const tourPath = `/tours/${tour.slug || slug}`;
  const programPdfUrl = `${API_BASE}/tours/${encodeURIComponent(
    tour.slug || slug,
  )}/program.pdf`;
  const transportSeoLabel =
    getTourTransportType(tour) === TOUR_TRANSPORT_TYPES.AIR
      ? "авиа-тур"
      : "автобусный тур";
  const tourSeoTitle =
    tour.seo_title ||
    `${tour.title} — ${transportSeoLabel} из Минска | TRAVELSPACE`;
  const tourSeoDescription =
    tour.seo_description ||
    tour.short_description ||
    tour.tagline ||
    tour.description ||
    `${tour.title}. Даты, программа, отели и стоимость тура.`;
  const tourSeoImage =
    tour.seo_image || tour.og_image || tour.hero_image || tour.gallery?.[0];
  const tourH1 = tour.title || "Тур";
  const tourStructuredData = {
    "@type": "TouristTrip",
    name: tourH1,
    description: tourSeoDescription,
    url: canonicalUrl(tour.seo_canonical_url, tourPath),
    image: tourSeoImage ? mediaUrl(tourSeoImage) : undefined,
    touristType: "Групповой тур",
    provider: { "@id": "https://travelspace.by/#organization" },
  };
  const categoryLanding =
    getTourTransportType(tour) === TOUR_TRANSPORT_TYPES.AIR
      ? { path: "/tours/avia-iz-minska", label: "Авиационные туры" }
      : { path: "/tours/avtobusnye-iz-minska", label: "Автобусные туры" };
  const directionLanding = getDirectionLandingForTour(tour);

  return (
    <div data-testid="tour-page">
      <PageSeo
        pageKey="tour"
        title={tourSeoTitle}
        description={tourSeoDescription}
        image={tourSeoImage}
        path={tourPath}
        canonical={tour.seo_canonical_url}
        noIndex={tour.seo_noindex === true}
        noFollow={tour.seo_nofollow === true}
        type="article"
        structuredData={tourStructuredData}
      />
      <section className="relative">
        <div className="relative min-h-[620px] lg:min-h-[680px] overflow-hidden">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet={mediaUrl(getTourHeroImage(tour, "mobile"))}
            />
            <img
              src={mediaUrl(getTourHeroImage(tour))}
              alt={tour.hero_image_alt || tourH1}
              width="1600"
              height="900"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </picture>

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/5 sm:from-black/85 sm:via-black/35 sm:to-black/15" />

          <div className="relative min-h-[620px] lg:min-h-[680px] section-container flex flex-col justify-end pt-28 lg:pt-36 pb-10 text-white">
            <nav aria-label="Хлебные крошки" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-white/80">
              <Link to="/" className="hover:text-white">Главная</Link>
              <span aria-hidden="true">/</span>
              <Link to={categoryLanding.path} className="hover:text-white">{categoryLanding.label}</Link>
              {directionLanding && (
                <>
                  <span aria-hidden="true">/</span>
                  <Link to={directionLanding.path} className="hover:text-white">{directionLanding.label}</Link>
                </>
              )}
            </nav>
            <div className="flex flex-wrap gap-2 mb-4">
              {(tour.badges || []).map((b) => (
                <Badge
                  key={b}
                  className={`pointer-events-none pointer-events-none rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide border shadow-sm hover:opacity-100 ${
                    BADGE_STYLES[b] ||
                    "bg-black/40 backdrop-blur-md text-white border-white/10"
                  }`}
                >
                  {b}
                </Badge>
              ))}
            </div>

            <div className="mt-3 max-w-5xl">
              <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl drop-shadow-[0_3px_14px_rgba(0,0,0,0.45)]">
                {tourH1}
              </h1>
            </div>

            {tour.tagline && (
              <p className="mt-3 max-w-3xl text-base sm:text-lg text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                {tour.tagline}
              </p>
            )}

            <div className="mt-4">
              <div
                className={`${glassText} inline-flex flex-wrap gap-x-6 gap-y-2 text-sm text-white`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-4" /> {tour.duration}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Bus className="size-4" /> {formatDepartureFrom(tour)}
                </span>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-end gap-4">
              <div
                className="inline-flex max-w-full flex-col items-start rounded-3xl border border-white/15 bg-black/35 px-5 py-4 backdrop-blur-md"
                data-testid="tour-hero-price"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">
                  Стоимость {tour.price_type || "от"}
                </p>

                <div className="mt-1 block">
                  <PriceInline
                    item={tour}
                    className="font-heading text-4xl font-bold text-orange-300 sm:text-5xl"
                    currencyClassName="text-lg text-white/75"
                  />
                </div>

                {firstPromotionDate && (
                  <button
                    type="button"
                    onClick={handleShowPromotionDate}
                    className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-rose-200/70 bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-700 shadow-sm transition hover:bg-white sm:text-[11px]"
                    aria-label="Посмотреть акционные даты тура"
                  >
                    <Percent className="size-3.5 shrink-0" />
                    <span className="truncate">Есть акции на даты</span>
                  </button>
                )}
              </div>

              {dates.length > 0 && (
                <Button
                  type="button"
                  onClick={() => setPricesOpen(true)}
                  className="rounded-full bg-sky-500 px-6 py-6 text-white hover:bg-sky-600"
                  data-testid="tour-hero-dates-btn"
                >
                  <WalletCards className="mr-2 size-4" /> Даты и цены
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/30 bg-white/15 px-6 py-6 text-white backdrop-blur-md hover:bg-white hover:text-neutral-900"
                data-testid="tour-hero-program-download"
              >
                <a
                  href={programPdfUrl}
                  download
                  aria-label={`Скачать PDF-программу тура «${tour.title}»`}
                >
                  <Download className="mr-2 size-4" /> Скачать PDF-программу
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur border-b border-neutral-200">
        <div className="section-container flex gap-1 overflow-x-auto py-2 text-sm font-medium">
          {SECTIONS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                document.getElementById(id)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className="whitespace-nowrap rounded-full px-4 py-2 text-neutral-700 hover:bg-orange-50 hover:text-[#C2410C]"
              data-testid={`anchor-${id}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {firstPromotionDate && (
        <section className="border-b border-rose-100 bg-rose-50/60">
          <div className="section-container py-3 sm:py-4">
            <div
              className="flex flex-col gap-3 rounded-2xl border border-rose-100 bg-white/85 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
              data-testid="tour-promotion-inline-notice"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-700 sm:text-[11px]">
                    <Percent className="size-3.5" /> Акции на даты
                  </span>
                  <span className="text-sm font-medium text-neutral-900">
                    Скидки действуют только на отдельные заезды
                  </span>
                </div>

                <p className="mt-1 text-xs leading-5 text-neutral-600 sm:text-sm">
                  Ближайшая акционная дата:{" "}
                  <span className="font-semibold text-neutral-950">
                    {fmtDateRangeCompact(firstPromotionDate)}
                  </span>
                </p>

                {(firstPromotionRoomPrice ||
                  getPromotionPriceParts(firstPromotionDate, tour)) && (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 lg:hidden">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700">
                      Цена по акции
                    </span>

                    {firstPromotionRoomPrice ? (
                      <span className="flex shrink-0 items-center text-right text-rose-700">
                        <span className="mr-1 text-xs font-medium">от</span>
                        <RoomPriceRecordInline
                          priceRecord={firstPromotionRoomPrice}
                          className="items-end"
                          oldClassName="text-[10px]"
                          newClassName="font-heading text-lg font-bold"
                        />
                      </span>
                    ) : (
                      <DatePriceInline
                        item={firstPromotionDate}
                        fallbackTour={tour}
                        className="shrink-0 text-right text-rose-700"
                        currencyClassName="text-xs"
                      />
                    )}
                  </div>
                )}
              </div>

              <Button
                type="button"
                onClick={handleShowPromotionDate}
                className="w-full shrink-0 rounded-full bg-rose-600 px-5 text-white hover:bg-rose-700 sm:w-auto"
                data-testid="tour-promotion-inline-notice-action"
              >
                Посмотреть
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* <section className="section-container py-12 lg:py-20 grid lg:grid-cols-12 gap-10"> */}
      <section
        className="
  mx-auto
  max-w-[1600px]
  px-6
  xl:px-8
  py-12
  lg:py-20
  grid
  lg:grid-cols-[minmax(0,1fr)_420px]
  gap-10
"
      >
        {/* <div className="lg:col-span-8 space-y-14"> */}
        <div className="min-w-0 space-y-14">
          <div id="about-tour" className="scroll-mt-32">
            <p className="overline text-[#C2410C]">О туре</p>

            <h2 className="font-heading text-3xl sm:text-4xl mt-2 mb-4">
              О туре
            </h2>

            {(tour.tagline || tour.short_description) && (
              <p className="mb-4 text-xl font-medium text-neutral-900">
                {tour.tagline || tour.short_description}
              </p>
            )}

            <RichText
              text={tour.description || tour.short_description}
              className="text-lg text-neutral-700 leading-relaxed"
            />
          </div>

          {(tour.gallery?.length > 0 || tour.images?.length > 0) && (
            <div
              id="gallery"
              className="scroll-mt-32"
              data-testid="tour-gallery"
            >
              <p className="overline text-[#C2410C]">Фотографии</p>

              <h2 className="font-heading text-3xl sm:text-4xl mt-2 mb-6">
                Фото тура
              </h2>

              {(() => {
                const images = (
                  tour.gallery?.length ? tour.gallery : tour.images
                ).filter(Boolean);
                const currentImage = images[tourGallerySlide] || images[0];

                return (
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
                      <img
                        src={mediaUrl(currentImage)}
                        alt={
                          tour.gallery_alts?.[tourGallerySlide] ||
                          `${tourH1} — фотографии тура`
                        }
                        width="1200"
                        height="750"
                        className="block aspect-[16/10] h-auto w-full object-cover sm:aspect-[16/9]"
                        loading="lazy"
                      />

                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setTourGallerySlide((prev) =>
                                prev === 0 ? images.length - 1 : prev - 1,
                              )
                            }
                            className="absolute left-4 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl shadow hover:bg-white"
                          >
                            ‹
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setTourGallerySlide((prev) =>
                                prev === images.length - 1 ? 0 : prev + 1,
                              )
                            }
                            className="absolute right-4 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl shadow hover:bg-white"
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>

                    {images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {images.map((image, index) => (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => setTourGallerySlide(index)}
                            className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl border ${
                              tourGallerySlide === index
                                ? "border-[#C2410C]"
                                : "border-neutral-200"
                            }`}
                          >
                            <img
                              src={mediaUrl(image)}
                              alt={
                                tour.gallery_alts?.[index] ||
                                `${tourH1} — фотографии тура`
                              }
                              width="240"
                              height="160"
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {tour.highlights?.length > 0 && (
            <div
              id="highlights"
              className="scroll-mt-32"
              data-testid="tour-highlights"
            >
              <p className="overline text-[#C2410C]">Чем понравится</p>

              <h2 className="font-heading text-3xl sm:text-4xl mt-2 mb-6">
                Главные впечатления тура
              </h2>

              <div className="grid sm:grid-cols-2 gap-3">
                {tour.highlights.map((h) => (
                  <p key={h} className="flex items-start gap-3 text-sm">
                    <BadgeCheck className="size-5 mt-0.5 text-[#C2410C] shrink-0" />
                    {h}
                  </p>
                ))}
              </div>
            </div>
          )}

          {tour.what_to_see?.length > 0 && (
            <div data-testid="tour-what-to-see">
              <h2 className="font-heading text-2xl mb-4">Что посмотреть</h2>

              <ul className="grid sm:grid-cols-2 gap-2 text-sm text-neutral-700">
                {tour.what_to_see.map((x) => (
                  <li key={x} className="flex items-start gap-2.5">
                    <MapPin className="size-4 mt-0.5 text-[#C2410C] shrink-0" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tour.program?.length > 0 && (
            <div
              id="program"
              className="scroll-mt-32"
              data-testid="tour-program"
            >
              <p className="overline text-[#C2410C]">Программа тура</p>

              <h2 className="font-heading text-3xl sm:text-4xl mt-2 mb-6">
                Программа тура
              </h2>

              <Accordion
                type="multiple"
                defaultValue={[
                  `day-${tour.program[0]?.day || 1}-0`,
                ]}
                className="divide-y divide-neutral-200 border-y border-neutral-200"
              >
                {tour.program.map((d, index) => {
                  const programKey = `${d.day || index + 1}-${index}`;
                  const images = getProgramImages(d);
                  const currentIndex = Math.min(
                    programSlideByKey[programKey] || 0,
                    Math.max(images.length - 1, 0),
                  );
                  const currentImage = images[currentIndex];
                  const hasProgramImage = Boolean(currentImage);
                  const setProgramSlide = (nextIndex) => {
                    setProgramSlideByKey((prev) => ({
                      ...prev,
                      [programKey]: nextIndex,
                    }));
                  };

                  return (
                    <AccordionItem
                      key={programKey}
                      value={`day-${programKey}`}
                      className="border-0 px-1"
                    >
                      <AccordionTrigger className="text-left py-5 hover:no-underline">
                        <div className="flex items-baseline gap-4 sm:gap-5">
                          <span className="font-heading text-xl sm:text-2xl text-[#C2410C] font-bold tabular-nums w-28 shrink-0 whitespace-nowrap">
                            {getProgramDayTitle(d)}
                          </span>

                          <span className="font-medium text-lg">{d.title}</span>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent forceMount>
                        <div className="pb-5">
                          <div className="flex min-w-0 flex-col gap-4">
                            {currentImage && (
                              <div
                                className="min-w-0 w-full lg:w-[520px] lg:max-w-[520px]"
                                data-testid={`program-day-carousel-${index}`}
                              >
                                <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                                  <img
                                    src={mediaUrl(currentImage)}
                                    alt={
                                      d.image_alts?.[currentIndex] ||
                                      `${tourH1}: ${d.title || getProgramDayTitle(d)}`
                                    }
                                    width="1200"
                                    height="750"
                                    className="block aspect-[16/10] h-auto w-full object-cover sm:aspect-[16/9]"
                                    loading="lazy"
                                  />

                                  {images.length > 1 && (
                                    <>
                                      <button
                                        type="button"
                                        aria-label="Предыдущее фото дня"
                                        onClick={() =>
                                          setProgramSlide(
                                            currentIndex === 0
                                              ? images.length - 1
                                              : currentIndex - 1,
                                          )
                                        }
                                        className="absolute left-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg shadow transition hover:bg-white"
                                      >
                                        ‹
                                      </button>

                                      <button
                                        type="button"
                                        aria-label="Следующее фото дня"
                                        onClick={() =>
                                          setProgramSlide(
                                            currentIndex === images.length - 1
                                              ? 0
                                              : currentIndex + 1,
                                          )
                                        }
                                        className="absolute right-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg shadow transition hover:bg-white"
                                      >
                                        ›
                                      </button>

                                      <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                                        {images.map((image, imageIndex) => (
                                          <button
                                            key={`${image}-dot-${imageIndex}`}
                                            type="button"
                                            aria-label={`Показать фото дня ${imageIndex + 1}`}
                                            onClick={() =>
                                              setProgramSlide(imageIndex)
                                            }
                                            className={`size-1.5 rounded-full transition ${
                                              currentIndex === imageIndex
                                                ? "bg-white"
                                                : "bg-white/45"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>

                                {images.length > 1 && (
                                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                                    {images.map((image, imageIndex) => (
                                      <button
                                        key={`${image}-${imageIndex}`}
                                        type="button"
                                        onClick={() =>
                                          setProgramSlide(imageIndex)
                                        }
                                        className={`h-12 w-16 shrink-0 overflow-hidden rounded-lg border transition ${
                                          currentIndex === imageIndex
                                            ? "border-[#C2410C] ring-2 ring-orange-100"
                                            : "border-neutral-200"
                                        }`}
                                      >
                                        <img
                                          src={mediaUrl(image)}
                                          alt={
                                            d.image_alts?.[imageIndex] ||
                                            `${tourH1}: ${d.title || getProgramDayTitle(d)}`
                                          }
                                          width="160"
                                          height="120"
                                          className="h-full w-full object-cover"
                                          loading="lazy"
                                        />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="w-full min-w-0 max-w-none">
                              <RichText
                                text={d.description}
                                className="text-sm leading-6 text-neutral-700 sm:text-[15px] sm:leading-7 lg:text-base lg:leading-7"
                              />

                              {d.notes && (
                                <RichText
                                  text={d.notes}
                                  className="mt-3 text-xs leading-relaxed text-neutral-500 sm:text-sm"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}

          <div id="price" className="scroll-mt-32 grid sm:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-6">
              <h2 className="font-heading text-2xl">Входит в стоимость</h2>

              <ul className="mt-4 space-y-2.5">
                {(tour.included || []).map((x) => (
                  <li key={x} className="flex items-start gap-2.5 text-sm">
                    <BadgeCheck className="size-4 mt-0.5 text-emerald-600 shrink-0" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-6">
              <h2 className="font-heading text-2xl">Не входит в стоимость</h2>

              <ul className="mt-4 space-y-2.5">
                {(tour.excluded || []).map((x) => (
                  <li key={x} className="flex items-start gap-2.5 text-sm">
                    <XIcon className="size-4 mt-0.5 text-rose-500 shrink-0" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {dates.length > 0 && (
            <section
              id="dates-prices"
              className="scroll-mt-32"
              data-testid="tour-dates-prices"
            >
              <p className="overline text-[#C2410C]">Расписание</p>
              <h2 className="font-heading text-3xl sm:text-4xl mt-2 mb-6">
                Даты и стоимость
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {dates.map((date) => (
                  <div
                    key={date._dateListKey || date.id || fmtDateRange(date)}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3"
                  >
                    <span className="text-sm font-medium text-neutral-800">
                      {fmtDateRange(date)}
                    </span>
                    <DatePriceInline
                      item={date}
                      fallbackTour={tour}
                      className="shrink-0 text-right font-semibold text-[#C2410C]"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {chains.some((chain) => chain.hotels?.length > 0) && (
            <div data-testid="tour-hotels">
              <p className="overline text-[#C2410C]">Где живём</p>

              <h2 className="font-heading text-3xl sm:text-4xl mt-2 mb-6">
                Отели и номера
              </h2>

              <div className="space-y-8">
                {chains.map((chain, chainIndex) => (
                  <div
                    key={chain.id || chainIndex}
                    className="rounded-3xl border border-neutral-200 bg-white p-4 sm:p-5"
                  >
                    <div className="space-y-4">
                      {(chain.title || chain.description) && (
                        <div>
                          {chain.title && (
                            <h3 className="font-heading text-2xl">
                              {chain.title}
                            </h3>
                          )}

                          {chain.description && (
                            <RichText
                              text={chain.description}
                              className="mt-1 text-sm leading-6 text-neutral-600"
                            />
                          )}
                        </div>
                      )}

                      {chain.dates?.length > 0 && (
                        <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-3 sm:p-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#C2410C]">
                            Даты заездов
                          </p>

                          <div className="space-y-3">
                            {groupDatesByMonth(chain.dates).map((group) => (
                              <div
                                key={`${chain.id || chainIndex}-${group.title}`}
                              >
                                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                                  {group.title}
                                </p>

                                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                                  {group.items.map((d) => {
                                    const promotion = isPromotionDate(d);
                                    const currentDateKey = String(dateKey(d));
                                    const previewOpen =
                                      promotion &&
                                      mobilePromotionPreview?.chainIndex ===
                                        chainIndex &&
                                      mobilePromotionPreview?.dateKey ===
                                        currentDateKey;

                                    return (
                                      <Fragment key={currentDateKey}>
                                        <div className="min-w-0">
                                          <button
                                            type="button"
                                            disabled={!promotion}
                                            aria-expanded={
                                              promotion
                                                ? previewOpen
                                                : undefined
                                            }
                                            aria-label={
                                              promotion
                                                ? `${fmtDateRangeCompact(d)}. Показать акционную цену`
                                                : undefined
                                            }
                                            data-promo-date-key={dateDomKey(d)}
                                            data-promo-scroll-target={
                                              promotion ? "true" : undefined
                                            }
                                            onClick={() => {
                                              if (!promotion) return;

                                              setMobilePromotionPreview(
                                                (prev) =>
                                                  prev?.chainIndex ===
                                                    chainIndex &&
                                                  prev?.dateKey ===
                                                    currentDateKey
                                                    ? null
                                                    : {
                                                        chainIndex,
                                                        dateKey: currentDateKey,
                                                        date: {
                                                          ...d,
                                                          _chainId:
                                                            chain.id ||
                                                            `chain-${chainIndex}`,
                                                        },
                                                      },
                                              );
                                            }}
                                            className={`w-full min-w-0 rounded-2xl px-2.5 py-1.5 text-center text-[11px] font-medium shadow-sm ring-1 transition sm:hidden ${
                                              promotion
                                                ? `cursor-pointer text-rose-700 active:scale-[0.98] ${
                                                    previewOpen
                                                      ? "bg-rose-100 ring-2 ring-rose-400"
                                                      : "bg-rose-50 ring-rose-200"
                                                  }`
                                                : "cursor-default bg-white text-[#C2410C] ring-orange-100"
                                            }`}
                                          >
                                            <span className="block whitespace-nowrap">
                                              {fmtDateRangeCompact(d)}
                                            </span>

                                            {promotion && (
                                              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
                                                <WalletCards className="size-3" />
                                                {previewOpen
                                                  ? "скрыть цену"
                                                  : "смотреть цену"}
                                              </span>
                                            )}
                                          </button>

                                          <span
                                            data-promo-date-key={dateDomKey(d)}
                                            data-promo-scroll-target={
                                              promotion ? "true" : undefined
                                            }
                                            className={`hidden min-w-0 rounded-full px-3 py-1.5 text-center text-xs font-medium shadow-sm ring-1 transition sm:inline-flex sm:items-center ${
                                              promotion
                                                ? "bg-rose-50 text-rose-700 ring-rose-200"
                                                : "bg-white text-[#C2410C] ring-orange-100"
                                            }`}
                                          >
                                            {fmtDateRange(d)}
                                            {promotion && (
                                              <span className="ml-1 inline-flex rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-700">
                                                акция
                                              </span>
                                            )}
                                          </span>
                                        </div>

                                        {previewOpen && (
                                          <div className="col-span-2 sm:hidden">
                                            <MobilePromotionPricePreview
                                              date={mobilePromotionPreview.date}
                                              chains={chains}
                                              tour={tour}
                                            />
                                          </div>
                                        )}
                                      </Fragment>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid gap-5">
                      {(chain.hotels || []).map((h, hotelIndex) => {
                        const hotelAnchorAliases = getHotelAnchorAliases(
                          h,
                          chain,
                          chainIndex,
                          hotelIndex,
                        );
                        const hotelAnchorId =
                          hotelAnchorAliases[0] ||
                          getHotelAnchorId(h, chain, chainIndex, hotelIndex);
                        const secondaryHotelAnchorIds =
                          hotelAnchorAliases.filter(
                            (anchorId) => anchorId !== hotelAnchorId,
                          );
                        return (
                          <div
                            key={h.id || hotelIndex}
                            id={hotelAnchorId}
                            className="scroll-mt-32 rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50"
                          >
                            {secondaryHotelAnchorIds.map((anchorId) => (
                              <span
                                key={anchorId}
                                id={anchorId}
                                className="block h-0 scroll-mt-32"
                                aria-hidden="true"
                              />
                            ))}

                            <div className="flex flex-col">
                              {getHotelImages(h).length > 0 && (
                                <div className="relative bg-neutral-100">
                                  {(() => {
                                    const images = getHotelImages(h);
                                    const currentIndex =
                                      hotelSlideById[h.id] || 0;
                                    const currentImage =
                                      images[currentIndex] || images[0];

                                    return (
                                      <>
                                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100">
                                          <img
                                            src={mediaUrl(currentImage)}
                                            alt={
                                              h.image_alts?.[currentIndex] ||
                                              `${h.name || "Отель"} — размещение в туре ${tourH1}`
                                            }
                                            width="1200"
                                            height="675"
                                            className="absolute inset-0 h-full w-full object-cover object-center"
                                            loading="lazy"
                                          />

                                          {images.length > 1 && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setHotelSlideById((prev) => ({
                                                    ...prev,
                                                    [h.id]:
                                                      currentIndex === 0
                                                        ? images.length - 1
                                                        : currentIndex - 1,
                                                  }))
                                                }
                                                className="absolute left-4 top-1/2 z-30 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl shadow hover:bg-white"
                                              >
                                                ‹
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setHotelSlideById((prev) => ({
                                                    ...prev,
                                                    [h.id]:
                                                      currentIndex ===
                                                      images.length - 1
                                                        ? 0
                                                        : currentIndex + 1,
                                                  }))
                                                }
                                                className="absolute right-4 top-1/2 z-30 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl shadow hover:bg-white"
                                              >
                                                ›
                                              </button>

                                              <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-2 py-1 backdrop-blur-sm">
                                                {images.map(
                                                  (image, dotIndex) => (
                                                    <button
                                                      key={`${image}-${dotIndex}`}
                                                      type="button"
                                                      onClick={() =>
                                                        setHotelSlideById(
                                                          (prev) => ({
                                                            ...prev,
                                                            [h.id]: dotIndex,
                                                          }),
                                                        )
                                                      }
                                                      className={`size-2 rounded-full ${
                                                        dotIndex ===
                                                        currentIndex
                                                          ? "bg-white"
                                                          : "bg-white/45"
                                                      }`}
                                                    />
                                                  ),
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              )}

                              <div className="p-5">
                                <h4 className="font-heading text-xl">
                                  {h.name}
                                </h4>

                                {h.description && (
                                  <Accordion
                                    type="single"
                                    collapsible
                                    className="mt-4 rounded-xl border border-neutral-200 bg-white px-4"
                                  >
                                    <AccordionItem
                                      value={`hotel-description-${hotelAnchorId}`}
                                      className="border-0"
                                    >
                                      <AccordionTrigger className="py-3 text-left text-sm font-medium hover:no-underline">
                                        Описание отеля
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <RichText
                                          text={h.description}
                                          className="pb-3 text-sm leading-6 text-neutral-600"
                                        />
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                )}

                                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                                  {h.meal && (
                                    <span>
                                      <Hotel className="inline size-3.5 -mt-0.5 mr-1" />
                                      {h.meal}
                                    </span>
                                  )}

                                  {h.location && <span>{h.location}</span>}
                                </div>

                                {h.rooms?.length > 0 && (
                                  <div className="mt-5">
                                    {(() => {
                                      const roomCarouselKey = `${chain.id || chainIndex}-${h.id || hotelIndex}`;
                                      const showRoomsMoreHint =
                                        h.rooms.length > 1 &&
                                        (roomScrollerHints[roomCarouselKey]
                                          ?.hasMore ??
                                          true);

                                      return (
                                        <>
                                          <p className="text-sm font-medium">
                                            Номера
                                          </p>

                                          <div className="relative mt-3">
                                            <div
                                              ref={(node) => {
                                                if (node) {
                                                  roomScrollerRefs.current[
                                                    roomCarouselKey
                                                  ] = node;
                                                  window.requestAnimationFrame(
                                                    () =>
                                                      observeRoomLastCard(
                                                        roomCarouselKey,
                                                      ),
                                                  );
                                                } else {
                                                  disconnectRoomHintObserver(
                                                    roomCarouselKey,
                                                  );
                                                  delete roomScrollerRefs
                                                    .current[roomCarouselKey];
                                                }
                                              }}
                                              className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 pr-3 [-webkit-overflow-scrolling:touch] sm:pr-0"
                                            >
                                              {h.rooms.map(
                                                (room, roomIndex) => {
                                                  const roomCardKey =
                                                    room.id ||
                                                    `${room.title || room.number || "room"}-${roomIndex}`;
                                                  const roomImages = (
                                                    room.gallery?.length
                                                      ? room.gallery
                                                      : [room.image]
                                                  ).filter(Boolean);
                                                  const currentIndex =
                                                    roomCardSlideById[
                                                      roomCardKey
                                                    ] || 0;
                                                  const currentImage =
                                                    roomImages[currentIndex] ||
                                                    roomImages[0];

                                                  return (
                                                    <div
                                                      key={roomCardKey}
                                                      ref={
                                                        roomIndex ===
                                                        h.rooms.length - 1
                                                          ? (node) => {
                                                              if (node) {
                                                                roomLastCardRefs.current[
                                                                  roomCarouselKey
                                                                ] = node;
                                                                window.requestAnimationFrame(
                                                                  () =>
                                                                    observeRoomLastCard(
                                                                      roomCarouselKey,
                                                                    ),
                                                                );
                                                              } else {
                                                                delete roomLastCardRefs
                                                                  .current[
                                                                  roomCarouselKey
                                                                ];
                                                              }
                                                            }
                                                          : undefined
                                                      }
                                                      className={`${
                                                        h.rooms.length > 1
                                                          ? "w-[82vw] min-w-[280px] max-w-[340px] sm:w-[360px] sm:min-w-0 sm:max-w-none"
                                                          : "w-full max-w-[340px] sm:w-[360px] sm:max-w-none"
                                                      } snap-start shrink-0 rounded-xl border border-neutral-200 bg-white p-3`}
                                                    >
                                                      {currentImage && (
                                                        <div className="relative mb-3 overflow-hidden rounded-lg bg-neutral-100">
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              setRoomSlide(0);
                                                              setSelectedRoom({
                                                                room,
                                                                hotel: h,
                                                                chain,
                                                              });
                                                            }}
                                                            className="block w-full text-left"
                                                          >
                                                            <img
                                                              src={mediaUrl(
                                                                currentImage,
                                                              )}
                                                              alt={
                                                                room.gallery_alts?.[currentIndex] ||
                                                                `${room.title || room.number || "Номер"} в отеле ${h.name || "тура"}`
                                                              }
                                                              width="800"
                                                              height="600"
                                                              className="aspect-[4/3] w-full object-cover"
                                                              loading="lazy"
                                                            />
                                                          </button>

                                                          {roomImages.length >
                                                            1 && (
                                                            <>
                                                              <button
                                                                type="button"
                                                                onClick={(
                                                                  e,
                                                                ) => {
                                                                  e.stopPropagation();
                                                                  setRoomCardSlideById(
                                                                    (prev) => ({
                                                                      ...prev,
                                                                      [roomCardKey]:
                                                                        currentIndex ===
                                                                        0
                                                                          ? roomImages.length -
                                                                            1
                                                                          : currentIndex -
                                                                            1,
                                                                    }),
                                                                  );
                                                                }}
                                                                className="absolute left-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg shadow"
                                                              >
                                                                ‹
                                                              </button>

                                                              <button
                                                                type="button"
                                                                onClick={(
                                                                  e,
                                                                ) => {
                                                                  e.stopPropagation();
                                                                  setRoomCardSlideById(
                                                                    (prev) => ({
                                                                      ...prev,
                                                                      [roomCardKey]:
                                                                        currentIndex ===
                                                                        roomImages.length -
                                                                          1
                                                                          ? 0
                                                                          : currentIndex +
                                                                            1,
                                                                    }),
                                                                  );
                                                                }}
                                                                className="absolute right-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg shadow"
                                                              >
                                                                ›
                                                              </button>
                                                            </>
                                                          )}
                                                        </div>
                                                      )}

                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          setRoomSlide(0);
                                                          setSelectedRoom({
                                                            room,
                                                            hotel: h,
                                                            chain,
                                                          });
                                                        }}
                                                        className="w-full text-left"
                                                      >
                                                        <div className="flex min-w-0 items-start justify-between gap-2">
                                                          <p className="min-w-0 break-words font-medium">
                                                            {room.title ||
                                                              (room.number
                                                                ? `Номер ${room.number}`
                                                                : "Номер")}
                                                          </p>

                                                          {showRoomsMoreHint &&
                                                            roomIndex <
                                                              h.rooms.length -
                                                                1 && (
                                                              <span
                                                                className="pointer-events-none shrink-0 rounded-full border border-orange-200 bg-white/95 px-2 py-1 text-[10px] font-semibold text-[#C2410C] animate-pulse sm:hidden"
                                                                aria-hidden="true"
                                                              >
                                                                ещё →
                                                              </span>
                                                            )}
                                                        </div>

                                                        {room.description && (
                                                          <RichText
                                                            text={
                                                              room.description
                                                            }
                                                            className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500"
                                                          />
                                                        )}

                                                        {/* CHANGE: ценник номера в карточке отеля рядом с действием бронирования */}
                                                        <div className="mt-3 flex items-center justify-between gap-3">
                                                          <p className="text-xs text-[#C2410C]">
                                                            Посмотреть даты и
                                                            фото
                                                          </p>

                                                          <RoomMinPriceInline
                                                            room={room}
                                                            dates={
                                                              chain.dates || []
                                                            }
                                                            className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#C2410C]"
                                                          />
                                                        </div>
                                                      </button>
                                                    </div>
                                                  );
                                                },
                                              )}
                                            </div>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tour.important_info?.length > 0 && (
            <div className="rounded-2xl bg-neutral-950 text-white p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-5">
                <span className="size-9 rounded-full grid place-items-center bg-[#C2410C]">
                  <Info className="size-4" />
                </span>

                <h2 className="font-heading text-2xl">
                  Важно знать перед поездкой
                </h2>
              </div>

              <ul className="grid sm:grid-cols-2 gap-3 text-sm text-neutral-300">
                {tour.important_info.map((x) => (
                  <li key={x}>• {x}</li>
                ))}
              </ul>
            </div>
          )}

          {tour.faq?.length > 0 && (
            <div id="faq" className="scroll-mt-32" data-testid="tour-faq">
              <p className="overline text-[#C2410C]">FAQ</p>

              <h2 className="font-heading text-3xl sm:text-4xl mt-2 mb-6">
                Ответы на популярные вопросы
              </h2>

              <Accordion
                type="single"
                collapsible
                className="divide-y divide-neutral-200 border-y border-neutral-200"
              >
                {tour.faq.map((item, index) => (
                  <AccordionItem
                    key={`${item.question}-${index}`}
                    value={`faq-${index}`}
                    className="border-0"
                  >
                    <AccordionTrigger className="text-left py-5 hover:no-underline">
                      {item.question}
                    </AccordionTrigger>

                    <AccordionContent forceMount className="text-neutral-700 leading-relaxed">
                      <RichText
                        text={item.answer}
                        className="space-y-3"
                        paragraphClassName="text-sm leading-7"
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {mapEmbedUrl && (
            <div className="aspect-video rounded-2xl overflow-hidden border border-neutral-200">
              <iframe
                src={mapEmbedUrl}
                title={`Карта тура ${tour.title || "Travelspace"}`}
                className="w-full h-full"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-popups"
                allowFullScreen
              />
            </div>
          )}
        </div>
        {/* <aside className="lg:col-span-4 space-y-6"> */}
        <aside className="w-full lg:w-[420px] space-y-6">
          <div
            className="
    rounded-2xl
    border
    border-neutral-200
    p-6
    bg-white
    shadow-sm
    lg:sticky
    lg:top-32
  "
            data-testid="tour-sticky-sidebar"
          >
            <p className="text-sm text-neutral-500">
              {tour.price_type || "от"}
            </p>

            <PriceInline
              item={tour}
              className="font-heading text-5xl font-bold mt-1"
              currencyClassName="text-lg font-medium text-neutral-500"
            />

            {dates.length > 0 && (
              <>
                <p className="overline mt-6 text-neutral-500">Ближайшие даты</p>

                <div className="mt-3 space-y-3">
                  {groupDatesByMonth(dates.slice(0, 4)).map((group) => (
                    <div key={`sidebar-${group.title}`}>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                        {group.title}
                      </p>

                      <ul className="space-y-2">
                        {group.items.map((d) => (
                          <li
                            key={d._dateListKey || d.id || fmtDateRange(d)}
                            data-promo-date-key={dateDomKey(d)}
                            data-promo-scroll-target={
                              isPromotionDate(d) ? "true" : undefined
                            }
                            className={`grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition ${
                              isPromotionDate(d)
                                ? "bg-rose-50 ring-1 ring-rose-100"
                                : "bg-neutral-50"
                            }`}
                          >
                            <span className="min-w-0 whitespace-nowrap">
                              {fmtDateRangeCompact(d)}
                            </span>

                            <DatePriceInline
                              item={d}
                              fallbackTour={tour}
                              className="whitespace-nowrap text-right font-medium text-[#C2410C]"
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Button
              onClick={() => {
                setSelectedDate("");
                setSelectedHotel("");
                setSelectedRoomTitle("");
                setBookingStep(null);
                setSelectedMealPlan("breakfast");
                setSelectedRoomPrice(null);
                setLeadOpen(true);
              }}
              className="w-full mt-6 rounded-full bg-[#C2410C] hover:bg-[#9A3412] text-white py-6 text-base"
              data-testid="tour-cta-lead"
            >
              Забронировать тур
            </Button>

            {dates.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setPricesOpen(true)}
                className="w-full mt-3 rounded-full border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 py-6 text-base"
                data-testid="tour-cta-dates"
              >
                <WalletCards className="size-4 mr-2" /> Даты и цены
              </Button>
            )}

            <a
              href="tel:+375296369911"
              className="block mt-3 text-center text-sm font-medium text-neutral-700 hover:text-[#C2410C]"
              data-testid="tour-cta-call"
            >
              <Phone className="inline size-4 mr-1" /> Позвонить менеджеру
            </a>
          </div>
          <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-6 lg:hidden">
            <p className="font-heading text-xl mb-3">Быстрая заявка</p>

            <LeadForm
              variant="tour"
              tour={tour.title}
              tour_slug={tour.slug}
              region={tour.region_slug}
              dates={dates}
              compact
            />
          </div>
        </aside>
      </section>

      <Dialog open={pricesOpen} onOpenChange={setPricesOpen}>
        <DialogContent
          className="flex h-[calc(100dvh-24px)] max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl p-0 sm:h-auto sm:max-h-[calc(100dvh-48px)] sm:max-w-2xl"
          onOpenAutoFocus={(event) => event.preventDefault()}
          data-testid="tour-dates-dialog"
        >
          <DialogHeader className="shrink-0 border-b bg-white px-5 pb-4 pt-5 pr-12 text-left sm:px-6 sm:pt-6">
            <DialogTitle className="font-heading text-2xl">
              Даты и цены
            </DialogTitle>

            <DialogDescription>{tour.title}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <div className="space-y-4">
              {chains.map((chain, chainIndex) => (
                <div key={chain.id || chainIndex}>
                  {chain.title && <DateDialogChainTitle title={chain.title} />}

                  <div className="space-y-4">
                    {groupDatesByMonth(chain.dates || []).map((group) => (
                      <div
                        key={`dialog-${chain.id || chainIndex}-${group.title}`}
                      >
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
                          {group.title}
                        </p>

                        <div className="space-y-2">
                          {group.items.map((d) => (
                            <button
                              key={dateKey(d)}
                              type="button"
                              data-promo-date-key={dateDomKey(d)}
                              onClick={() => {
                                setSelectedDate(fmtDateRange(d));
                                setPricesOpen(false);
                                setLeadOpen(true);
                              }}
                              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                isPromotionDate(d)
                                  ? "border-rose-200 bg-rose-50/60 hover:border-rose-400 hover:bg-rose-50"
                                  : "border-neutral-200 bg-white hover:border-[#C2410C] hover:bg-orange-50/40"
                              }`}
                            >
                              <div className="flex min-w-0 flex-col gap-1 sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4">
                                <span className="min-w-0 break-words text-sm font-medium sm:whitespace-nowrap sm:text-base">
                                  {fmtDateRangeCompact(d)}
                                  {isPromotionDate(d) && (
                                    <span className="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                                      акция
                                    </span>
                                  )}
                                </span>

                                <DatePriceInline
                                  item={d}
                                  fallbackTour={tour}
                                  className="text-left font-heading text-base text-[#C2410C] sm:whitespace-nowrap sm:text-right sm:text-xl"
                                />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedRoom}
        onOpenChange={(v) => !v && setSelectedRoom(null)}
      >
        <DialogContent
          className="
    fixed
    left-1/2
    top-1/2
    z-50
    w-[calc(100vw-24px)]
    max-w-[calc(100vw-24px)]
    -translate-x-1/2
    -translate-y-1/2
    sm:max-w-[1000px]
    h-[calc(100dvh-24px)]
    max-h-[calc(100dvh-24px)]
    overflow-hidden
    rounded-2xl
    p-0
  "
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          {selectedRoom && (
            <div className="flex h-[calc(100dvh-24px)] w-full min-w-0 flex-col">
              {" "}
              <div className="shrink-0 px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
                <DialogHeader className="min-w-0 pr-8 text-left">
                  <DialogTitle className="font-heading text-lg sm:text-2xl break-words">
                    {selectedRoom.room.title ||
                      (selectedRoom.room.number
                        ? `Номер ${selectedRoom.room.number}`
                        : "Номер")}
                  </DialogTitle>

                  <DialogDescription className="line-clamp-2 text-sm text-neutral-500">
                    <span className="font-semibold text-neutral-900 sm:text-base">
                      {selectedRoom.hotel?.name}
                    </span>
                    {resolveChainTitle(selectedRoom.chain, 0) && (
                      <span className="ml-2 text-neutral-500">
                        · {resolveChainTitle(selectedRoom.chain, 0)}
                      </span>
                    )}
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 sm:px-6 sm:pb-6">
                <div className="flex min-w-0 flex-col gap-3">
                  {selectedRoom.room.description && (
                    <RichText
                      text={selectedRoom.room.description}
                      className="text-sm leading-6 text-neutral-700"
                    />
                  )}

                  {selectedRoom.room.video_url && (
                    <a
                      href={selectedRoom.room.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-fit max-w-full rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      Посмотреть на YouTube
                    </a>
                  )}

                  {selectedRoom.room.gallery?.length > 0 && (
                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="relative min-w-0 overflow-hidden rounded-xl bg-neutral-100">
                        <img
                          src={mediaUrl(
                            selectedRoom.room.gallery[roomSlide] ||
                              selectedRoom.room.gallery[0],
                          )}
                          alt={
                            selectedRoom.room.gallery_alts?.[roomSlide] ||
                            `${selectedRoom.room.title || selectedRoom.room.number || "Номер"} в отеле ${selectedRoom.hotel?.name || "тура"}`
                          }
                          width="1200"
                          height="750"
                          className="block h-[300px] w-full max-w-full object-cover sm:h-auto sm:aspect-[16/10]"
                          loading="lazy"
                        />

                        {selectedRoom.room.gallery.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setRoomSlide((prev) =>
                                  prev === 0
                                    ? selectedRoom.room.gallery.length - 1
                                    : prev - 1,
                                )
                              }
                              className="absolute left-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg shadow"
                            >
                              ‹
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setRoomSlide((prev) =>
                                  prev === selectedRoom.room.gallery.length - 1
                                    ? 0
                                    : prev + 1,
                                )
                              }
                              className="absolute right-2 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg shadow"
                            >
                              ›
                            </button>
                          </>
                        )}
                      </div>

                      {selectedRoom.room.gallery.length > 1 && (
                        <div className="w-full min-w-0 overflow-hidden">
                          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                            {selectedRoom.room.gallery.map((image, index) => (
                              <button
                                key={`${image}-${index}`}
                                type="button"
                                onClick={() => setRoomSlide(index)}
                                className={`h-12 w-16 shrink-0 overflow-hidden rounded-lg border sm:h-16 sm:w-24 ${
                                  roomSlide === index
                                    ? "border-[#C2410C]"
                                    : "border-neutral-200"
                                }`}
                              >
                                <img
                                  src={mediaUrl(image)}
                                  alt={
                                    selectedRoom.room.gallery_alts?.[index] ||
                                    `${selectedRoom.room.title || selectedRoom.room.number || "Номер"} в отеле ${selectedRoom.hotel?.name || "тура"}`
                                  }
                                  width="240"
                                  height="160"
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* <div className="min-w-0">
                    <p className="text-sm font-medium">Доступность по датам</p>

                    <div className="mt-2 flex min-w-0 flex-col gap-2">
                      {(selectedRoom.chain.dates || []).map((d) => {
                        const unavailable = isRoomUnavailableOnDate(
                          selectedRoom.room,
                          d,
                        );

                        return (
                          <div
                            key={dateKey(d)}
                            className={`w-full min-w-0 rounded-xl border px-3 py-2 text-sm ${
                              unavailable
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <span className="font-medium">
                                {fmtDateRange(d)}
                              </span>

                              {unavailable ? (
                                <span>Номер выкуплен</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDate(fmtDateRange(d));
                                    setSelectedHotel(selectedRoom.hotel.name);
                                    setSelectedRoomTitle(
                                      selectedRoom.room.title ||
                                        (selectedRoom.room.number
                                          ? `Номер ${selectedRoom.room.number}`
                                          : "Номер"),
                                    );
                                    setSelectedRoom(null);
                                    setLeadOpen(true);
                                  }}
                                  className="rounded-full bg-[#C2410C] px-4 py-2 text-xs font-medium text-white hover:bg-[#9A3412]"
                                >
                                  Забронировать
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div> */}
                  <div className="min-w-0 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          Полный прайслист номера
                        </p>
                        <p className="text-xs text-neutral-500">
                          Цена указана за одного человека. Доплата применяется
                          один раз для выбранной даты.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 hidden overflow-x-auto rounded-xl border border-neutral-200 sm:block">
                      <table className="min-w-[860px] w-full text-sm">
                        <thead className="bg-neutral-50 text-neutral-700">
                          <tr>
                            <th className="border-b border-r px-3 py-2 text-left font-semibold">
                              Дата
                            </th>
                            {ROOM_MEAL_PLANS.map((plan) => (
                              <th
                                key={plan.key}
                                className="border-b border-r px-3 py-2 text-left font-semibold last:border-r-0"
                              >
                                {plan.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedRoom.chain.dates || []).map((d) => (
                            <tr
                              key={dateKey(d)}
                              className="odd:bg-white even:bg-neutral-50/60"
                            >
                              <td className="border-r px-3 py-2 font-medium text-neutral-800">
                                {fmtDateRange(d)}
                              </td>
                              {ROOM_MEAL_PLANS.map((plan) => {
                                const price = getRoomDatePrice(
                                  selectedRoom.room,
                                  d,
                                  plan.key,
                                );
                                return (
                                  <td
                                    key={plan.key}
                                    className="border-r px-3 py-2 text-neutral-700 last:border-r-0"
                                  >
                                    {price ? (
                                      <RoomPriceRecordInline
                                        priceRecord={price}
                                        className="items-start"
                                        oldClassName="text-[10px]"
                                        newClassName="font-semibold text-rose-600"
                                      />
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 space-y-4 sm:hidden">
                      <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-800">
                        Все варианты питания показаны карточками ниже — листать
                        таблицу в сторону не нужно.
                      </div>

                      {groupDatesByMonth(selectedRoom.chain.dates || []).map(
                        (group) => (
                          <div
                            key={`room-price-${group.title}`}
                            className="space-y-2"
                          >
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                              {group.title}
                            </p>

                            {group.items.map((d) => (
                              <div
                                key={dateKey(d)}
                                className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm"
                              >
                                <p className="mb-2 text-sm font-semibold text-neutral-900">
                                  {fmtDateRange(d)}
                                </p>

                                <div className="space-y-1.5">
                                  {ROOM_MEAL_PLANS.map((plan) => {
                                    const price = getRoomDatePrice(
                                      selectedRoom.room,
                                      d,
                                      plan.key,
                                    );

                                    return (
                                      <div
                                        key={plan.key}
                                        className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs"
                                      >
                                        <span className="text-neutral-700">
                                          {plan.label}
                                        </span>
                                        <span className="shrink-0 font-semibold text-[#C2410C]">
                                          {price ? (
                                            <RoomPriceRecordInline
                                              priceRecord={price}
                                              className="items-end text-right"
                                              oldClassName="text-[9px]"
                                              newClassName="font-semibold text-rose-600"
                                            />
                                          ) : (
                                            "—"
                                          )}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 rounded-3xl border border-orange-100 bg-gradient-to-br from-white via-orange-50/40 to-white p-4 shadow-sm sm:p-5">
                    <p className="mb-4 text-base font-semibold text-neutral-900">
                      Выберите дату и питание
                    </p>

                    <div className="grid gap-4 lg:grid-cols-[1fr_260px] items-start">
                      <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900 shadow-sm">
                        <p className="font-semibold">
                          Цена указана за одного человека.
                        </p>

                        <p className="mt-1 text-xs text-orange-800/80">
                          Выберите дату заезда и план питания — итоговая
                          стоимость подсветится справа и на кнопке бронирования.
                        </p>
                      </div>

                      {selectedRoomPrice && (
                        <div className="flex min-h-[82px] flex-col justify-center rounded-2xl border border-orange-200 bg-white px-4 py-3 text-right shadow-sm transition-all duration-300">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                            Итого
                          </p>

                          <p className="font-heading whitespace-nowrap text-xl font-bold text-[#C2410C] sm:text-2xl">
                            <RoomPriceRecordInline
                              priceRecord={selectedRoomPrice}
                              className="items-end"
                              oldClassName="text-xs font-medium"
                              newClassName="font-heading text-xl font-bold text-rose-600 sm:text-2xl"
                            />
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 space-y-5">
                      <div>
                        <p className="mb-2 text-sm font-medium text-neutral-800">
                          Дата заезда
                        </p>

                        <div className="space-y-4">
                          {groupDatesByMonth(
                            selectedRoom.chain.dates || [],
                          ).map((group) => (
                            <div key={`date-select-${group.title}`}>
                              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                                {group.title}
                              </p>

                              <div className="grid gap-2 sm:grid-cols-2">
                                {group.items.map((d) => {
                                  const unavailable = isRoomUnavailableOnDate(
                                    selectedRoom.room,
                                    d,
                                  );
                                  const active =
                                    bookingStep?.dateLabel === fmtDateRange(d);
                                  const promotionRoomPrice = isPromotionDate(d)
                                    ? getRoomMinPrice(selectedRoom.room, [d])
                                    : null;

                                  return (
                                    <button
                                      key={dateKey(d)}
                                      type="button"
                                      disabled={unavailable}
                                      data-promo-date-key={dateDomKey(d)}
                                      onClick={() => {
                                        const prices = getRoomPricesForDate(
                                          selectedRoom.room,
                                          d,
                                        );
                                        const nextPlan = prices.some(
                                          (item) =>
                                            item.key === selectedMealPlan,
                                        )
                                          ? selectedMealPlan
                                          : prices[0]?.key || "breakfast";
                                        const nextPrice = getRoomDatePrice(
                                          selectedRoom.room,
                                          d,
                                          nextPlan,
                                        );

                                        setBookingStep({
                                          date: d,
                                          dateLabel: fmtDateRange(d),
                                        });
                                        setSelectedMealPlan(nextPlan);
                                        setSelectedRoomPrice(nextPrice);
                                      }}
                                      className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300 ${
                                        unavailable
                                          ? "cursor-not-allowed border-red-100 bg-red-50/70 text-red-500 opacity-70"
                                          : active
                                            ? "scale-[1.01] border-[#C2410C] bg-white shadow-lg shadow-orange-200/60"
                                            : isPromotionDate(d)
                                              ? "border-rose-200 bg-rose-50/60 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md"
                                              : "border-neutral-200 bg-white hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                                      }`}
                                    >
                                      <span
                                        className={`absolute inset-y-0 left-0 w-1 transition-all duration-300 ${
                                          active
                                            ? "bg-[#C2410C]"
                                            : "bg-transparent"
                                        }`}
                                      />
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <p className="font-medium text-neutral-900">
                                            {fmtDateRange(d)}
                                            {isPromotionDate(d) && (
                                              <span className="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                                                акция
                                              </span>
                                            )}
                                          </p>
                                          <p
                                            className={`mt-1 text-xs ${
                                              unavailable
                                                ? "text-red-500"
                                                : "text-emerald-600"
                                            }`}
                                          >
                                            {unavailable
                                              ? "Номер выкуплен"
                                              : "Номер доступен"}
                                          </p>

                                          {promotionRoomPrice &&
                                            getPromotionPriceParts(
                                              promotionRoomPrice,
                                            ) && (
                                              <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-rose-700 ring-1 ring-rose-100">
                                                <span className="text-[10px] font-bold uppercase tracking-wide">
                                                  от
                                                </span>
                                                <RoomPriceRecordInline
                                                  priceRecord={
                                                    promotionRoomPrice
                                                  }
                                                  className="items-start"
                                                  oldClassName="text-[9px]"
                                                  newClassName="text-sm font-bold"
                                                />
                                              </div>
                                            )}
                                        </div>

                                        <span
                                          className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] leading-none transition-all duration-300 ${
                                            active
                                              ? "border-[#C2410C] bg-[#C2410C] text-white"
                                              : "border-neutral-300 bg-white text-transparent group-hover:border-orange-300"
                                          }`}
                                        >
                                          <span className="-mt-px block leading-none">
                                            ✓
                                          </span>
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-medium text-neutral-800">
                          План питания
                        </p>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {ROOM_MEAL_PLANS.map((plan) => {
                            const price = bookingStep?.date
                              ? getRoomDatePrice(
                                  selectedRoom.room,
                                  bookingStep.date,
                                  plan.key,
                                )
                              : null;
                            const active = selectedMealPlan === plan.key;
                            const disabled = !price;

                            return (
                              <button
                                key={plan.key}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                  setSelectedMealPlan(plan.key);
                                  setSelectedRoomPrice(price);
                                }}
                                className={`group rounded-2xl border p-3 text-left transition-all duration-300 ${
                                  disabled
                                    ? "cursor-not-allowed border-neutral-100 bg-neutral-50 text-neutral-400 opacity-70"
                                    : active
                                      ? "scale-[1.01] border-[#C2410C] bg-orange-50 shadow-lg shadow-orange-200/60"
                                      : "border-neutral-200 bg-white hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-neutral-900">
                                      {plan.label}
                                    </p>
                                  </div>
                                  <span
                                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] leading-none transition-all duration-300 ${
                                      active && !disabled
                                        ? "border-[#C2410C] bg-[#C2410C] text-white"
                                        : "border-neutral-300 bg-white text-transparent group-hover:border-orange-300"
                                    }`}
                                  >
                                    <span className="-mt-px block leading-none">
                                      ✓
                                    </span>
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="sticky bottom-0 z-20 -mx-4 -mb-4 border-t border-orange-100 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:-mb-5 sm:px-5">
                        <Button
                          type="button"
                          disabled={!bookingStep || !selectedRoomPrice}
                          onClick={() => {
                            const roomTitle =
                              selectedRoom.room.title ||
                              (selectedRoom.room.number
                                ? `Номер ${selectedRoom.room.number}`
                                : "Номер");
                            const mealLabel =
                              ROOM_MEAL_PLANS.find(
                                (plan) => plan.key === selectedMealPlan,
                              )?.label || "Завтрак";
                            const finalRoomPrice = {
                              ...selectedRoomPrice,
                              meal_plan_key: selectedMealPlan,
                              meal_plan_label: mealLabel,
                            };

                            setSelectedDate(bookingStep.dateLabel);
                            setSelectedHotel(selectedRoom.hotel.name);
                            setSelectedRoomTitle(roomTitle);
                            setSelectedRoomPrice(finalRoomPrice);
                            setLeadOpen(true);
                          }}
                          className="w-full rounded-full bg-[#C2410C] py-6 text-base text-white shadow-lg shadow-orange-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#9A3412] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {selectedRoomPrice
                            ? `Забронировать · ${formatRoomPrice(selectedRoomPrice)}`
                            : "Выберите дату и питание"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <LeadDialog
        open={leadOpen}
        onOpenChange={setLeadOpen}
        tour={tour.title}
        tour_slug={tour.slug}
        region={tour.region_slug}
        dates={dates}
        selectedDate={selectedDate}
        selectedHotel={selectedHotel}
        selectedRoom={selectedRoomTitle}
        selectedMealPlan={selectedRoomPrice?.meal_plan_label}
        selectedFinalPrice={
          selectedRoomPrice ? formatRoomPrice(selectedRoomPrice) : ""
        }
        tours={tours}
        title={`Заявка на тур «${tour.title}»`}
        description="Менеджер свяжется в течение часа и расскажет о ближайших датах."
      />
    </div>
  );
}
