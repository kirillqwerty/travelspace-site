import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
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
} from "lucide-react";
import LeadForm from "@/components/LeadForm";
import LeadDialog from "@/components/LeadDialog";
import { useSiteData } from "@/lib/useSiteData";
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

function getAdditionalPriceSource(item, fallbackTour) {
  if (hasAdditionalPrice(item)) return item;
  if (hasAdditionalPrice(fallbackTour)) return fallbackTour;
  return null;
}

function formatCurrency(currency) {
  return currency || "BYN";
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
    return {
      ...priceRecord,
      currency: priceRecord.currency || room.currency,
      additional_currency:
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

function formatRoomPrice(priceRecord) {
  if (!priceRecord) return "";

  const parts = [];
  if (hasPriceValue(priceRecord.price)) {
    parts.push(`${priceRecord.price} ${formatCurrency(priceRecord.currency)}`);
  }
  if (hasPriceValue(priceRecord.additional_price)) {
    parts.push(
      `${priceRecord.additional_price} ${formatCurrency(
        priceRecord.additional_currency,
      )}`,
    );
  }

  return parts.join(" + ");
}

function formatRoomBasePrice(priceRecord) {
  if (!priceRecord || !hasPriceValue(priceRecord.price)) return "";

  return `${priceRecord.price} ${formatCurrency(priceRecord.currency)}`;
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
      numeric: Number(price.price),
    }))
    .filter((price) => Number.isFinite(price.numeric));

  if (!priced.length) return null;
  return priced.sort((a, b) => a.numeric - b.numeric)[0];
}

function RoomPriceInline({
  room,
  date,
  className = "",
  mealPlanKey = "breakfast",
}) {
  const priceRecord = getRoomDatePrice(room, date, mealPlanKey);
  if (!priceRecord) return null;

  return <span className={className}>{formatRoomPrice(priceRecord)}</span>;
}

function RoomMinPriceInline({ room, dates = [], className = "" }) {
  const priceRecord = getRoomMinPrice(room, dates);
  if (!priceRecord) return null;

  return <span className={className}>от {formatRoomPrice(priceRecord)}</span>;
}

function PriceInline({
  item,
  fallbackTour,
  className = "",
  currencyClassName = "",
}) {
  const additionalSource = getAdditionalPriceSource(item, fallbackTour);

  return (
    <span className={className}>
      {item.price ?? item.price_from}{" "}
      <span className={currencyClassName}>
        {formatCurrency(item.currency || fallbackTour?.currency)}
      </span>
      {additionalSource && (
        <>
          <span className="mx-1 opacity-70">+</span>
          {additionalSource.additional_price}{" "}
          <span className={currencyClassName}>
            {formatCurrency(additionalSource.additional_currency)}
          </span>
        </>
      )}
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

function dateKey(d) {
  return d?.id || d?.start || fmtDateRange(d);
}

function getRoomUnavailableDates(room) {
  return room?.unavailable_dates || room?.unavailableDates || [];
}

function isRoomUnavailableOnDate(room, date) {
  const unavailable = getRoomUnavailableDates(room);
  return unavailable.includes(date?.id) || unavailable.includes(date?.start);
}

function buildLegacyChain(tour) {
  const dates = (tour.dates || []).filter((d) => d.status !== "hidden");
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
        title: chain.title || chain.name || `Цепочка ${index + 1}`,
        dates: (chain.dates || []).filter((d) => d.status !== "hidden"),
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

function renderRichInline(text, keyPrefix = "rich") {
  const parts = String(text || "").split(
    /(\*\*[^*]+\*\*|__[^_]+__|_[^_]+_|\*[^*]+\*)/g,
  );

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("__") && part.endsWith("__")) {
      return (
        <span key={key} className="underline underline-offset-2">
          {part.slice(2, -2)}
        </span>
      );
    }

    if (part.startsWith("_") && part.endsWith("_")) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }

    return part;
  });
}

function RichText({ text, className = "", paragraphClassName = "" }) {
  const lines = String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  return (
    <div className={className}>
      {lines.map((line, index) => {
        const cleanLine = line.replace(/^[-•]\s*/, "");
        const isListLike = /^[-•]\s*/.test(line);

        return (
          <p
            key={`${cleanLine}-${index}`}
            className={`${index > 0 ? "mt-2" : ""} ${paragraphClassName}`}
          >
            {isListLike && <span className="mr-2 text-[#C2410C]">•</span>}
            {renderRichInline(cleanLine, `rich-${index}`)}
          </p>
        );
      })}
    </div>
  );
}

export default function TourPage() {
  const { slug } = useParams();
  const [tour, setTour] = useState(null);
  const [error, setError] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [pricesOpen, setPricesOpen] = useState(false);
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
  const { tours } = useSiteData();

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

  if (error) {
    return (
      <div className="section-container section-pad text-center">
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
        <div className="section-container text-neutral-400">Загрузка...</div>
      </div>
    );
  }

  const chains = getTourChains(tour);
  const dates = chains.flatMap((chain) => chain.dates || []);
  const dateStrings = dates.map(fmtDateRange).filter(Boolean);

  return (
    <div data-testid="tour-page">
      <section className="relative">
        <div className="relative min-h-[620px] lg:min-h-[680px] overflow-hidden">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet={mediaUrl(getTourHeroImage(tour, "mobile"))}
            />
            <img
              src={mediaUrl(getTourHeroImage(tour))}
              alt={tour.title}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </picture>

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/5 sm:from-black/85 sm:via-black/35 sm:to-black/15" />

          <div className="relative min-h-[620px] lg:min-h-[680px] section-container flex flex-col justify-end pt-28 lg:pt-36 pb-10 text-white">
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
                {tour.title}
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
                className="rounded-3xl bg-black/35 px-5 py-4 backdrop-blur-md border border-white/15"
                data-testid="tour-hero-price"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">
                  Стоимость {tour.price_type || "от"}
                </p>

                <PriceInline
                  item={tour}
                  className="font-heading text-4xl sm:text-5xl font-bold text-orange-300"
                  currencyClassName="text-lg text-white/75"
                />
              </div>

              {dates.length > 0 && (
                <Button
                  type="button"
                  onClick={() => setPricesOpen(true)}
                  className="rounded-full bg-sky-500 hover:bg-sky-600 text-white px-6 py-6"
                  data-testid="tour-hero-dates-btn"
                >
                  <WalletCards className="size-4 mr-2" /> Даты и цены
                </Button>
              )}
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
  lg:grid-cols-[minmax(0,1fr)_380px]
  gap-10
"
      >
        {/* <div className="lg:col-span-8 space-y-14"> */}
        <div className="min-w-0 space-y-14">
          <div id="about-tour" className="scroll-mt-32">
            <p className="overline text-[#C2410C]">О туре</p>

            <h2 className="font-heading text-3xl sm:text-4xl mt-2 mb-4">
              {tour.tagline || tour.short_description}
            </h2>

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
                        alt={`${tour.title} фото ${tourGallerySlide + 1}`}
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
                              alt=""
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
              <h3 className="font-heading text-2xl mb-4">Что посмотреть</h3>

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
                Каждый день — на ладони
              </h2>

              <Accordion
                type="multiple"
                defaultValue={["day-1"]}
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

                      <AccordionContent>
                        <div className="pb-3 sm:pl-[116px]">
                          <div className="grid gap-4 lg:grid-cols-[280px_1fr] lg:items-start">
                            {currentImage && (
                              <div className="min-w-0">
                                <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                                  <img
                                    src={mediaUrl(currentImage)}
                                    alt={d.title || getProgramDayTitle(d)}
                                    className="aspect-[16/10] h-auto w-full object-cover sm:aspect-[16/9] lg:aspect-[4/3]"
                                    loading="lazy"
                                  />

                                  {images.length > 1 && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setProgramSlide(
                                            currentIndex === 0
                                              ? images.length - 1
                                              : currentIndex - 1,
                                          )
                                        }
                                        className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg shadow transition hover:bg-white"
                                      >
                                        ‹
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setProgramSlide(
                                            currentIndex === images.length - 1
                                              ? 0
                                              : currentIndex + 1,
                                          )
                                        }
                                        className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg shadow transition hover:bg-white"
                                      >
                                        ›
                                      </button>
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
                                          alt=""
                                          className="h-full w-full object-cover"
                                          loading="lazy"
                                        />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            <div>
                              <RichText
                                text={d.description}
                                className="text-sm leading-relaxed text-neutral-700 sm:text-[15px]"
                              />

                              {d.notes && (
                                <RichText
                                  text={d.notes}
                                  className="mt-2 text-xs leading-relaxed text-neutral-500"
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
              <h3 className="font-heading text-2xl">Входит в стоимость</h3>

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
              <h3 className="font-heading text-2xl">Не входит</h3>

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
                    <div className="grid gap-3 lg:grid-cols-[1fr_280px] lg:items-stretch">
                      <div>
                        <h3 className="font-heading text-2xl">
                          {chain.title || `Цепочка ${chainIndex + 1}`}
                        </h3>

                        {chain.description && (
                          <p className="mt-1 text-sm text-neutral-600">
                            {chain.description}
                          </p>
                        )}
                      </div>
                      {chain.dates?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {chain.dates.map((d) => (
                            <span
                              key={dateKey(d)}
                              className="rounded-full bg-orange-50 px-3 py-1 text-[#C2410C]"
                            >
                              {fmtDateRange(d)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid gap-5">
                      {(chain.hotels || []).map((h) => (
                        <div
                          key={h.id}
                          className="rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50"
                        >
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
                                      <div className="relative h-[340px] sm:h-[500px] overflow-hidden bg-neutral-900 flex items-center justify-center">
                                        <img
                                          src={mediaUrl(currentImage)}
                                          alt=""
                                          aria-hidden="true"
                                          className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-60"
                                          loading="lazy"
                                        />

                                        <div className="absolute inset-0 bg-black/25" />

                                        <img
                                          src={mediaUrl(currentImage)}
                                          alt={h.name}
                                          className="relative z-10 max-h-full max-w-full object-contain"
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
                                              {images.map((image, dotIndex) => (
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
                                                    dotIndex === currentIndex
                                                      ? "bg-white"
                                                      : "bg-white/45"
                                                  }`}
                                                />
                                              ))}
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
                              <h4 className="font-heading text-xl">{h.name}</h4>

                              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                                {h.description}
                              </p>

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
                                  <p className="text-sm font-medium">Номера</p>

                                  <div className="mt-3">
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                      {h.rooms.map((room) => {
                                        const roomImages = (
                                          room.gallery?.length
                                            ? room.gallery
                                            : [room.image]
                                        ).filter(Boolean);
                                        const currentIndex =
                                          roomCardSlideById[room.id] || 0;
                                        const currentImage =
                                          roomImages[currentIndex] ||
                                          roomImages[0];

                                        return (
                                          <div
                                            key={room.id}
                                            className="w-[320px] sm:w-[360px] shrink-0 rounded-xl border border-neutral-200 bg-white p-3"
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
                                                    src={mediaUrl(currentImage)}
                                                    alt={
                                                      room.title || room.number
                                                    }
                                                    className="aspect-[4/3] w-full object-cover"
                                                    loading="lazy"
                                                  />
                                                </button>

                                                {roomImages.length > 1 && (
                                                  <>
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRoomCardSlideById(
                                                          (prev) => ({
                                                            ...prev,
                                                            [room.id]:
                                                              currentIndex === 0
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
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRoomCardSlideById(
                                                          (prev) => ({
                                                            ...prev,
                                                            [room.id]:
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
                                              <p className="font-medium">
                                                {room.title ||
                                                  (room.number
                                                    ? `Номер ${room.number}`
                                                    : "Номер")}
                                              </p>

                                              {room.description && (
                                                <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                                                  {room.description}
                                                </p>
                                              )}

                                              {/* CHANGE: ценник номера в карточке отеля рядом с действием бронирования */}
                                              <div className="mt-3 flex items-center justify-between gap-3">
                                                <p className="text-xs text-[#C2410C]">
                                                  Посмотреть даты и фото
                                                </p>

                                                <RoomMinPriceInline
                                                  room={room}
                                                  dates={chain.dates || []}
                                                  className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#C2410C]"
                                                />
                                              </div>
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
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

                <h3 className="font-heading text-2xl">
                  Важно знать перед поездкой
                </h3>
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

                    <AccordionContent className="text-neutral-700 leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {tour.map_embed && (
            <div className="aspect-video rounded-2xl overflow-hidden border border-neutral-200">
              <div
                dangerouslySetInnerHTML={{ __html: tour.map_embed }}
                className="w-full h-full"
              />
            </div>
          )}
        </div>
        {/* <aside className="lg:col-span-4 space-y-6"> */}
        <aside className="w-full lg:w-[380px] space-y-6">
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

                <ul className="mt-3 space-y-2">
                  {dates.slice(0, 4).map((d) => (
                    <li
                      key={d.id || fmtDateRange(d)}
                      className="flex items-center justify-between text-sm rounded-lg bg-neutral-50 px-3 py-2"
                    >
                      <span>{fmtDateRange(d)}</span>

                      <span className="font-medium">
                        <PriceInline item={d} fallbackTour={tour} />
                      </span>
                    </li>
                  ))}
                </ul>
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
              dates={dateStrings}
              compact
            />
          </div>
        </aside>
      </section>

      <Dialog open={pricesOpen} onOpenChange={setPricesOpen}>
        <DialogContent
          className="max-w-lg max-h-[calc(100vh-24px)] overflow-y-auto rounded-2xl"
          onOpenAutoFocus={(event) => event.preventDefault()}
          data-testid="tour-dates-dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Даты и цены
            </DialogTitle>

            <DialogDescription>{tour.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {chains.map((chain, chainIndex) => (
              <div key={chain.id || chainIndex}>
                <p className="mb-2 text-sm font-medium text-neutral-700">
                  {chain.title || `Цепочка ${chainIndex + 1}`}
                </p>

                <div className="space-y-2">
                  {(chain.dates || []).map((d) => (
                    <button
                      key={dateKey(d)}
                      type="button"
                      onClick={() => {
                        setSelectedDate(fmtDateRange(d));
                        setPricesOpen(false);
                        setLeadOpen(true);
                      }}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left hover:border-[#C2410C] hover:bg-orange-50/40 transition"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{fmtDateRange(d)}</span>

                        <span className="font-heading text-xl text-[#C2410C]">
                          <PriceInline item={d} fallbackTour={tour} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
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

                  <DialogDescription className="line-clamp-1">
                    {selectedRoom.hotel.name} · {selectedRoom.chain.title}
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 sm:px-6 sm:pb-6">
                <div className="flex min-w-0 flex-col gap-3">
                  {selectedRoom.room.description && (
                    <p className="text-sm text-neutral-700">
                      {selectedRoom.room.description}
                    </p>
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
                          alt={`Фото номера ${roomSlide + 1}`}
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
                                  alt=""
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
                    <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200">
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
                                    {price ? formatRoomPrice(price) : "—"}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                            {formatRoomPrice(selectedRoomPrice)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 space-y-5">
                      <div>
                        <p className="mb-2 text-sm font-medium text-neutral-800">
                          Дата заезда
                        </p>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {(selectedRoom.chain.dates || []).map((d) => {
                            const unavailable = isRoomUnavailableOnDate(
                              selectedRoom.room,
                              d,
                            );
                            const active =
                              bookingStep?.dateLabel === fmtDateRange(d);

                            return (
                              <button
                                key={dateKey(d)}
                                type="button"
                                disabled={unavailable}
                                onClick={() => {
                                  const prices = getRoomPricesForDate(
                                    selectedRoom.room,
                                    d,
                                  );
                                  const nextPlan = prices.some(
                                    (item) => item.key === selectedMealPlan,
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
                                      : "border-neutral-200 bg-white hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                                }`}
                              >
                                <span
                                  className={`absolute inset-y-0 left-0 w-1 transition-all duration-300 ${
                                    active ? "bg-[#C2410C]" : "bg-transparent"
                                  }`}
                                />
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-medium text-neutral-900">
                                      {fmtDateRange(d)}
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
        dates={dateStrings}
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
