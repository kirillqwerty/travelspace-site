import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, MapPin, Sparkles } from "lucide-react";
import PageSeo from "@/components/PageSeo";
import { mediaUrl } from "@/lib/media";
import { useSiteData } from "@/lib/useSiteData";

function getTourImage(tour) {
  return (
    tour?.hero_mobile_image ||
    tour?.mobile_hero_image ||
    tour?.hero_mobile ||
    tour?.hero_image ||
    ""
  );
}

function getDescription(tour) {
  return tour?.tagline || tour?.short_description || tour?.description || "";
}

function getPriceLabel(tour) {
  if (!tour?.price_from) return "Уточнить стоимость";

  const currency = tour.currency || "BYN";
  const priceType = tour.price_type || "от";
  const additional =
    tour.additional_price !== undefined &&
    tour.additional_price !== null &&
    tour.additional_price !== ""
      ? ` + ${tour.additional_price} ${tour.additional_currency || currency}`
      : "";

  return `${priceType} ${tour.price_from} ${currency}${additional}`;
}

function hasTourDates(tour) {
  const legacyDates = Array.isArray(tour?.dates) ? tour.dates : [];
  const chainDates = Array.isArray(tour?.chains)
    ? tour.chains
        .filter((chain) => chain?.active !== false)
        .flatMap((chain) => (Array.isArray(chain?.dates) ? chain.dates : []))
    : [];

  return [...legacyDates, ...chainDates].some(
    (date) => date?.status !== "hidden",
  );
}

function getDepartureLabel(tour) {
  const cities = Array.isArray(tour?.departure_cities)
    ? tour.departure_cities
    : tour?.departure_city
      ? [tour.departure_city]
      : [];

  if (!cities.length) return tour?.region_name || tour?.direction_name || "Тур";

  return `из ${cities.join(", ")}`;
}

export default function TravelLinks() {
  const { tours, ready } = useSiteData();

  const actualTours = useMemo(() => {
    return [...(Array.isArray(tours) ? tours : [])].sort((a, b) => {
      const aOrder = Number(a?.sort_order ?? a?.order ?? 9999);
      const bOrder = Number(b?.sort_order ?? b?.order ?? 9999);
      return aOrder - bOrder;
    });
  }, [tours]);

  return (
    <div
      className="min-h-screen bg-[#fff8f3] pt-24 pb-16 sm:pt-28"
      data-testid="travel-links-page"
    >
      <PageSeo
        pageKey="links"
        path="/links"
        title="Актуальные туры из Instagram | TRAVELSPACE"
        description="Быстрый список актуальных туров TRAVELSPACE для перехода из соцсетей."
      />

      <div className="mx-auto w-full max-w-[520px] px-4">
        <div className="overflow-hidden rounded-[2rem] bg-neutral-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <div className="relative px-6 py-8 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.45),transparent_48%)]" />
            <div className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-white/10 backdrop-blur">
              <Sparkles className="size-7 text-orange-200" />
            </div>
            <p className="relative mt-5 overline text-orange-200">
              TRAVELSPACE
            </p>
            <h1 className="relative mt-2 font-heading text-3xl leading-tight sm:text-4xl">
              Актуальные туры
            </h1>
            <p className="relative mt-3 text-sm leading-relaxed text-white/75">
              Выберите тур из списка — мы сразу откроем подробную страницу с
              программой, датами и стоимостью.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {!ready ? (
            <div className="rounded-3xl border border-orange-100 bg-white p-6 text-center text-sm text-neutral-500 shadow-sm">
              Загружаем актуальные туры…
            </div>
          ) : actualTours.length === 0 ? (
            <div className="rounded-3xl border border-orange-100 bg-white p-6 text-center text-sm text-neutral-500 shadow-sm">
              Сейчас список туров обновляется. Напишите нам в Instagram —
              подберём актуальные варианты вручную.
            </div>
          ) : (
            actualTours.map((tour) => {
              const image = getTourImage(tour);
              const description = getDescription(tour);
              const hasDates = hasTourDates(tour);

              return (
                <Link
                  key={tour.slug || tour.id || tour.title}
                  to={`/tours/${tour.slug}`}
                  className="group grid grid-cols-[96px_1fr] gap-3 overflow-hidden rounded-3xl border border-orange-100 bg-white p-2 shadow-[0_10px_35px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#C2410C]/40 hover:shadow-[0_18px_50px_rgba(194,65,12,0.14)] active:scale-[0.99]"
                  data-testid={`instagram-tour-${tour.slug}`}
                >
                  <div className="relative aspect-square overflow-hidden rounded-[1.35rem] bg-neutral-100">
                    {image ? (
                      <img
                        src={mediaUrl(image)}
                        alt={tour.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-orange-50 text-xs font-bold text-[#C2410C]">
                        TOUR
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 py-1 pr-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="line-clamp-2 font-heading text-lg leading-tight text-neutral-950">
                        {tour.title}
                      </h2>
                      <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-[#C2410C] text-white transition group-hover:bg-[#9A3412]">
                        <ArrowRight className="size-4" />
                      </span>
                    </div>

                    {description && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-600">
                        {description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tour.duration && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-[#C2410C]">
                          <Calendar className="size-3" /> {tour.duration}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                        <MapPin className="size-3" /> {getDepartureLabel(tour)}
                      </span>
                    </div>

                    {hasDates ? (
                      <p className="mt-3 text-sm font-black text-neutral-950">
                        {getPriceLabel(tour)}
                      </p>
                    ) : (
                      <p className="mt-3 text-xs font-semibold leading-snug text-[#C2410C]">
                        Дорогие туристы, дат пока что нет
                      </p>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <div className="mt-5 rounded-3xl border border-orange-100 bg-white p-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-neutral-900">
            Не нашли нужное направление?
          </p>
          <Link
            to="/tours"
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-[#C2410C]"
          >
            Открыть полный каталог
          </Link>
        </div>
      </div>
    </div>
  );
}
