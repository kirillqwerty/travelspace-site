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
  Хит: "bg-rose-500 text-white border-rose-500",
  Море: "bg-sky-500 text-white border-sky-500",
  Новинка: "bg-emerald-500 text-white border-emerald-500",
  "Без виз": "bg-amber-500 text-white border-amber-500",
  "Автобусный тур": "bg-neutral-900 text-white border-neutral-900",
  "Экскурсионный тур": "bg-violet-500 text-white border-violet-500",
  "Авторский тур": "bg-fuchsia-500 text-white border-fuchsia-500",
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
  const [hotelSlideById, setHotelSlideById] = useState({});
  const [roomSlide, setRoomSlide] = useState(0);
  const [tourGallerySlide, setTourGallerySlide] = useState(0);
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
          <img
            src={mediaUrl(tour.hero_image)}
            alt={tour.title}
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/15" />

          <div className="relative min-h-[620px] lg:min-h-[680px] section-container flex flex-col justify-end pt-28 lg:pt-36 pb-10 text-white">
            <div className="flex flex-wrap gap-2 mb-4">
              {(tour.badges || []).map((b) => (
                <Badge
                  key={b}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide border shadow-sm ${
                    BADGE_STYLES[b] ||
                    "bg-black/40 backdrop-blur-md text-white border-white/10"
                  }`}
                >
                  {b}
                </Badge>
              ))}
            </div>

            <div className="mb-3">
              <span className={glassText}>
                {tour.region_name || tour.direction_name}
              </span>
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
                  <Bus className="size-4" /> Из{" "}
                  {tour.departure_city || "Минска"}
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" /> {tour.region_name}
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

                <p className="font-heading text-4xl sm:text-5xl font-bold text-orange-300">
                  {tour.price_from}{" "}
                  <span className="text-lg text-white/75">
                    {tour.currency || "BYN"}
                  </span>
                </p>
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

            <p className="text-lg text-neutral-700 leading-relaxed">
              {tour.description || tour.short_description}
            </p>
          </div>

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

          {(tour.gallery?.length > 0 || tour.images?.length > 0) && (
            <div
              id="gallery"
              className="scroll-mt-32"
              data-testid="tour-gallery"
            >
              <p className="overline text-[#C2410C]">Галерея</p>

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
                        className="block h-[260px] w-full object-cover sm:h-[420px]"
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
                {tour.program.map((d) => (
                  <AccordionItem
                    key={d.day}
                    value={`day-${d.day}`}
                    className="border-0 px-1"
                  >
                    <AccordionTrigger className="text-left py-5 hover:no-underline">
                      <div className="flex items-baseline gap-5">
                        <span className="font-heading text-xl sm:text-2xl text-[#C2410C] font-bold tabular-nums w-20">
                          День {d.day}
                        </span>

                        <span className="font-medium text-lg">{d.title}</span>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent>
                      <div className="pl-[100px] pb-2">
                        <p className="text-neutral-700 leading-relaxed">
                          {d.description}
                        </p>

                        {d.notes && (
                          <p className="text-sm text-neutral-500 mt-3">
                            {d.notes}
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
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
                                            className="w-[280px] shrink-0 rounded-xl border border-neutral-200 bg-white p-3"
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

                                              <p className="mt-2 text-xs text-[#C2410C]">
                                                Посмотреть даты и фото
                                              </p>
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
              <p className="overline text-[#C2410C]">Часто спрашивают</p>

              <h2 className="font-heading text-3xl sm:text-4xl mt-2 mb-6">
                Частые вопросы по туру
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
    sticky
    top-32
  "
            data-testid="tour-sticky-sidebar"
          >
            <p className="text-sm text-neutral-500">
              {tour.price_type || "от"}
            </p>

            <p className="font-heading text-5xl font-bold mt-1">
              {tour.price_from}{" "}
              <span className="text-lg font-medium text-neutral-500">
                {tour.currency || "BYN"}
              </span>
            </p>

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
                        {d.price} {d.currency || tour.currency || "BYN"}
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
                          {d.price} {d.currency || tour.currency || "BYN"}
                        </span>
                      </div>

                      {d.comment && (
                        <p className="mt-1 text-xs text-neutral-500">
                          {d.comment}
                        </p>
                      )}
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
            w-[calc(100vw-24px)]
            max-w-[calc(100vw-24px)]
            sm:max-w-3xl
            max-h-[calc(100dvh-24px)]
            overflow-hidden
            rounded-2xl
            p-0
          "
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          {selectedRoom && (
            <div className="flex max-h-[calc(100dvh-24px)] w-full min-w-0 flex-col">
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
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Доступность по датам</p>

                    <div className="mt-2 flex min-w-0 flex-col gap-2">
                      {(selectedRoom.chain.dates || []).map((d) => {
                        const unavailable = isRoomUnavailableOnDate(
                          selectedRoom.room,
                          d,
                        );

                        const openLeadWithRoom = () => {
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
                        };

                        if (unavailable) {
                          return (
                            <div
                              key={dateKey(d)}
                              className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                            >
                              <p className="font-medium">{fmtDateRange(d)}</p>
                              <p className="mt-1 text-xs">Номер выкуплен</p>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={dateKey(d)}
                            type="button"
                            onClick={openLeadWithRoom}
                            className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm text-emerald-800 transition hover:bg-emerald-100"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium">{fmtDateRange(d)}</p>
                                <p className="mt-1 text-xs text-emerald-700">
                                  Номер доступен
                                </p>
                              </div>

                              <span className="shrink-0 text-xs font-semibold text-[#C2410C]">
                                Забронировать →
                              </span>
                            </div>
                          </button>
                        );
                      })}
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
        tours={tours}
        title={`Заявка на тур «${tour.title}»`}
        description="Менеджер свяжется в течение часа и расскажет о ближайших датах."
      />
    </div>
  );
}
