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
import { log } from "three";

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
  ["about-tour", "О туре"],
  ["highlights", "Особенности"],
  ["gallery", "Галерея"],
  ["program", "Программа"],
  ["price", "Стоимость"],
  ["faq", "FAQ"],
];

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
export default function TourPage() {
  const { slug } = useParams();
  const [tour, setTour] = useState(null);
  const [error, setError] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [pricesOpen, setPricesOpen] = useState(false);
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
      <div className="section-container section-pad text-neutral-400">
        Загрузка…
      </div>
    );
  }

  const dates = (tour.dates || []).filter((d) => d.status !== "hidden");
  const dateStrings = dates.map(fmtDateRange);

  return (
    <div data-testid="tour-page">
      {/* HERO */}
      <section className="relative">
        <div className="relative h-[55vh] lg:h-[70vh] overflow-hidden">
          <img
            src={tour.hero_image}
            alt={tour.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/15" />
          <div className="relative h-full section-container flex flex-col justify-end pb-10 text-white">
            <div className="flex flex-wrap gap-2 mb-4">
              {(tour.badges || []).map((b) => (
                <Badge
                  key={b}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide border shadow-sm ${
                    BADGE_STYLES[b] ||
                    "bg-white/20 backdrop-blur text-white border-0"
                  }`}
                >
                  {b}
                </Badge>
              ))}
            </div>
            <p className="overline text-white/80">
              {tour.region_name || tour.direction_name}
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mt-2 max-w-4xl">
              {tour.title}
            </h1>
            {tour.tagline && (
              <p className="mt-3 text-base sm:text-lg text-white/85 max-w-2xl">
                {tour.tagline}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4" /> {tour.duration}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bus className="size-4" /> Из {tour.departure_city || "Минска"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" /> {tour.region_name}
              </span>
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

      {/* TOUR ANCHOR NAV */}
      <div className="sticky top-16 lg:top-20 z-30 bg-white/95 backdrop-blur border-b border-neutral-200">
        <div className="section-container flex gap-1 overflow-x-auto py-2 text-sm font-medium">
          {SECTIONS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="whitespace-nowrap rounded-full px-4 py-2 text-neutral-700 hover:bg-orange-50 hover:text-[#C2410C]"
              data-testid={`anchor-${id}`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* MAIN GRID */}
      <section className="section-container py-12 lg:py-20 grid lg:grid-cols-12 gap-10">
        {/* CONTENT */}
        <div className="lg:col-span-8 space-y-14">
          <div id="about-tour" className="scroll-mt-32">
            <p className="overline text-[#C2410C]">О туре</p>
            <h2 className="font-heading text-3xl sm:text-4xl mt-2 mb-4">
              {tour.tagline || tour.short_description}
            </h2>
            <p className="text-lg text-neutral-700 leading-relaxed">
              {tour.description || tour.short_description}
            </p>
          </div>

          {/* HIGHLIGHTS */}
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
                    <BadgeCheck className="size-5 mt-0.5 text-[#C2410C] shrink-0" />{" "}
                    {h}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* WHAT TO SEE */}
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

          {/* GALLERY */}
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
              <div className="grid sm:grid-cols-2 gap-4">
                {(tour.gallery || tour.images)
                  .slice(0, 6)
                  .map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-100"
                    >
                      <img
                        src={image}
                        alt={`${tour.title} фото ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* PROGRAM */}
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
                        <span className="font-heading text-2xl text-[#C2410C] font-bold tabular-nums w-12">
                          {`0${d.day}`.slice(-2)}
                        </span>
                        <span className="font-medium text-lg">{d.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-[68px] pb-2">
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

          {/* INCLUDED / EXCLUDED */}
          <div id="price" className="scroll-mt-32 grid sm:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-orange-50/40 border border-orange-100 p-6">
              <h3 className="font-heading text-2xl">Входит в стоимость</h3>
              <ul className="mt-4 space-y-2.5">
                {(tour.included || []).map((x) => (
                  <li key={x} className="flex items-start gap-2.5 text-sm">
                    <BadgeCheck className="size-4 mt-0.5 text-[#C2410C] shrink-0" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-6">
              <h3 className="font-heading text-2xl">Не входит</h3>
              <ul className="mt-4 space-y-2.5">
                {(tour.excluded || []).map((x) => (
                  <li key={x} className="flex items-start gap-2.5 text-sm">
                    <XIcon className="size-4 mt-0.5 text-neutral-400 shrink-0" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* HOTELS */}
          {tour.hotels?.length > 0 && (
            <div data-testid="tour-hotels">
              <p className="overline text-[#C2410C]">Где живём</p>
              <h2 className="font-heading text-3xl sm:text-4xl mt-2 mb-6">
                Отели и проживание
              </h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {tour.hotels.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-2xl overflow-hidden border border-neutral-200 bg-white"
                  >
                    {h.image && (
                      <div className="aspect-[4/3] bg-neutral-100">
                        <img
                          src={h.image}
                          alt={h.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IMPORTANT INFO */}
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

          {/* FAQ */}
          {tour.faq?.length > 0 && (
            <div id="faq" className="scroll-mt-32" data-testid="tour-faq">
              <p className="overline text-[#C2410C]">Часто спрашивают</p>
              <h2 className="font-heading text-3xl sm:text-4xl mt-2 mb-6">
                Вопросы по туру
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

          {/* MAP */}
          {tour.map_embed && (
            <div className="aspect-video rounded-2xl overflow-hidden border border-neutral-200">
              <div
                dangerouslySetInnerHTML={{ __html: tour.map_embed }}
                className="w-full h-full"
              />
            </div>
          )}
        </div>

        {/* STICKY SIDEBAR */}
        <aside className="lg:col-span-4 space-y-6">
          <div
            className="rounded-2xl border border-neutral-200 p-6 lg:sticky lg:top-32 bg-white shadow-sm"
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
              onClick={() => setLeadOpen(true)}
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

          {/* Inline form fallback for mobile */}
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

      {/* DATES POPUP */}
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
          <div className="space-y-2">
            {dates.map((d) => (
              <button
                key={d.id || fmtDateRange(d)}
                type="button"
                onClick={() => {
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
                  <p className="mt-1 text-xs text-neutral-500">{d.comment}</p>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <LeadDialog
        open={leadOpen}
        onOpenChange={setLeadOpen}
        tour={tour.title}
        tour_slug={tour.slug}
        region={tour.region_slug}
        dates={dateStrings}
        tours={tours}
        title={`Заявка на тур «${tour.title}»`}
        description="Менеджер свяжется в течение часа и расскажет о ближайших датах."
      />
    </div>
  );
}
