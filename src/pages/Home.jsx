import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  BadgeCheck,
  Bus,
  Users,
  Map as MapIcon,
  Wallet,
  Armchair,
  ShieldCheck,
  ArrowRight,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useSiteData } from "@/lib/useSiteData";
import TourCard from "@/components/TourCard";
import LeadDialog from "@/components/LeadDialog";
import { mediaUrl } from "@/lib/media";
import PageSeo from "@/components/PageSeo";
import { RichText } from "@/lib/richText";

const BENEFIT_ICONS = {
  badge: BadgeCheck,
  bus: Bus,
  users: Users,
  map: MapIcon,
  shield: ShieldCheck,
  wallet: Wallet,
  seat: Armchair,
};

const DEFAULT_BENEFITS_SECTION = {
  overline: "Почему едут именно с нами",
  title: "Заботимся о каждой детали поездки",
  items: [
    {
      icon: "badge",
      title: "Сами туроператоры",
      desc: "Не посредник: формируем туры под себя и отвечаем за качество.",
    },
    {
      icon: "bus",
      title: "Отправление из Минска",
      desc: "Комфортабельные автобусы, опытные водители, продуманные стоянки.",
    },
    {
      icon: "users",
      title: "Поддержка менеджера",
      desc: "С момента заявки и до возвращения — всегда на связи.",
    },
    {
      icon: "map",
      title: "Понятные программы",
      desc: "Без скрытых трансферов и сюрпризов: всё показано в маршруте.",
    },
    {
      icon: "shield",
      title: "Проверенные маршруты",
      desc: "Каждый тур мы прошли сами, прежде чем пустить группу.",
    },
    {
      icon: "wallet",
      title: "Оплата через ЕРИП",
      desc: "Удобно и безопасно: оплата после общения с менеджером.",
    },
    {
      icon: "seat",
      title: "Выбор места в автобусе",
      desc: "Возможен за доп. плату — наличие уточнит менеджер.",
    },
  ],
};

function getBenefitsSection(settings) {
  const section = settings?.home_benefits || {};
  const items =
    Array.isArray(section.items) && section.items.length
      ? section.items
      : DEFAULT_BENEFITS_SECTION.items;

  return {
    overline: section.overline || DEFAULT_BENEFITS_SECTION.overline,
    title: section.title || DEFAULT_BENEFITS_SECTION.title,
    items: items.filter((item) => item?.title || item?.desc),
  };
}

export default function Home() {
  const { tours, settings } = useSiteData();
  const [reviews, setReviews] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [leadOpen, setLeadOpen] = useState(false);
  const videoRef = useRef(null);
  const benefitsSection = getBenefitsSection(settings);

  useEffect(() => {
    api.get("/reviews").then((r) => setReviews(r.data));
    api.get("/promotions").then((r) => setPromotions(r.data || []));
  }, []);

  const getPromotionTourSlug = (promotion) => {
    if (Array.isArray(promotion?.related_tour_slugs)) {
      return promotion.related_tour_slugs.find((slug) =>
        String(slug || "").trim(),
      );
    }

    return String(promotion?.related_tour_slug || "").trim();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // One tour per region for the main "destinations" grid
  const destinationTours = (() => {
    const map = new Map();
    tours.forEach((t) => {
      if (!t.region_slug) return;
      const current = map.get(t.region_slug);
      if (!current || (t.order ?? 99) < (current.order ?? 99)) {
        map.set(t.region_slug, t);
      }
    });
    return Array.from(map.values());
  })();

  const hits = tours
    .filter((t) => (t.badges || []).includes("Хит"))
    .slice(0, 3);

  return (
    <div className="space-y-0">
      <PageSeo
        pageKey="home"
        path="/"
        title="TRAVELSPACE — автобусные туры из Минска"
        description="Автобусные туры из Минска в Грузию, Дагестан, Санкт-Петербург и Карелию. Продуманные программы, заботливые гиды и понятная цена."
      />
      {/* ======================= HERO ======================= */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        data-testid="hero-section"
      >
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source
            src={`${process.env.PUBLIC_URL}/background-journey.mp4`}
            type="video/mp4"
          />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/30 to-black/70" />
        <div className="absolute inset-0 bg-orange-950/5" />

        <div className="relative w-full section-container pt-28 lg:pt-32 text-white">
          <h1 className="font-heading mt-3 sm:mt-4 text-4xl sm:text-6xl lg:text-7xl font-bold max-w-4xl leading-[1.05]">
            Автобусные туры,
            <br />в которые хочется возвращаться
          </h1>
          <p className="mt-5 max-w-xl text-base sm:text-lg text-white/85 leading-relaxed">
            Дагестан, Грузия, Санкт-Петербург и Карелия. Простые программы,
            заботливые гиды и понятная цена без сюрпризов в дороге.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              className="rounded-full bg-[#C2410C] hover:bg-[#9A3412] text-white px-6 py-6 text-base font-medium"
            >
              <Link to="/tours" data-testid="hero-cta-tours">
                Выбрать тур <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
            <Button
              onClick={() => setLeadOpen(true)}
              variant="outline"
              className="rounded-full border-white/40 bg-white/10 backdrop-blur text-white hover:bg-white hover:text-neutral-900 px-6 py-6 text-base font-medium"
              data-testid="hero-cta-consult"
            >
              Получить консультацию
            </Button>
          </div>
        </div>
      </section>

      {/* ======================= DESTINATION TOURS ======================= */}
      <section className="section-pad" data-testid="destinations-section">
        <div className="section-container">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 lg:mb-14">
            <div>
              <p className="overline text-[#C2410C]">Куда поедем</p>
              <h2 className="font-heading text-4xl sm:text-5xl mt-2 max-w-xl">
                Туры, проверенные нами лично
              </h2>
            </div>
            <Link
              to="/tours"
              className="inline-flex items-center gap-2 text-sm font-medium hover:text-[#C2410C]"
              data-testid="all-tours-link"
            >
              Все туры <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinationTours.slice(0, 4).map((tour) => (
              <TourCard key={tour.id || tour.slug} tour={tour} />
            ))}
          </div>
        </div>
      </section>

      {/* ======================= BENEFITS ======================= */}
      <section
        className="py-12 lg:py-16 bg-neutral-50"
        data-testid="benefits-section"
      >
        <div className="section-container">
          <div className="max-w-2xl mb-8 lg:mb-10">
            <p className="overline text-[#C2410C]">
              {benefitsSection.overline}
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl mt-2">
              {benefitsSection.title}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6">
            {benefitsSection.items.map((b, index) => {
              const Icon = BENEFIT_ICONS[b.icon] || BadgeCheck;

              return (
                <div
                  key={`${b.title || "benefit"}-${index}`}
                  className="rounded-2xl border border-neutral-200 p-6 hover:border-[#C2410C]/60 transition-colors bg-white"
                >
                  <div className="size-11 rounded-xl bg-orange-50 grid place-items-center text-[#C2410C] mb-4">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-heading text-xl">{b.title}</h3>
                  <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* ======================= REVIEWS ======================= */}
      {reviews.length > 0 && (
        <section
          className="section-pad bg-neutral-50"
          data-testid="reviews-section"
        >
          <div className="section-container">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="overline text-[#C2410C]">Отзывы туристов</p>
                <h2 className="font-heading text-4xl sm:text-5xl mt-2 max-w-2xl">
                  Что о нас говорят
                </h2>
              </div>
              <Link
                to="/reviews"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-medium hover:border-[#C2410C] hover:text-[#C2410C]"
              >
                Читать все отзывы <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-8 flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
              {reviews.slice(0, 4).map((r) => (
                <Link
                  key={r.id}
                  to="/reviews"
                  className="min-w-[280px] snap-start rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:min-w-0"
                  data-testid={`review-card-${r.id}`}
                >
                  {r.photo ? (
                    <img
                      src={mediaUrl(r.photo)}
                      alt={r.name || "Отзыв"}
                      className="mb-4 h-44 w-full rounded-xl object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Quote className="size-7 text-[#C2410C] mb-3" />
                  )}
                  <p className="line-clamp-4 text-sm leading-relaxed text-neutral-700">
                    {r.text}
                  </p>
                  <div className="mt-4 border-t border-neutral-100 pt-3">
                    <p className="font-medium text-sm">{r.name}</p>
                    <p className="text-xs text-neutral-500">
                      {r.tour_name || r.direction}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* ======================= PROMOTIONS BLOCK ======================= */}
      {promotions.length > 0 && (
        <section className="py-12 lg:py-16" data-testid="promotions-section">
          <div className="section-container">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-7">
              <div>
                <p className="overline text-[#C2410C]">Сейчас выгодно</p>
                <h2 className="font-heading text-4xl sm:text-5xl mt-2 max-w-xl">
                  Актуальные акции
                </h2>
              </div>
              <Link
                to="/promotions"
                className="inline-flex items-center gap-2 text-sm font-medium hover:text-[#C2410C]"
              >
                Все акции <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {promotions.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="
        rounded-2xl
        overflow-hidden
        border
        border-orange-100
        bg-white
        shadow-sm

        flex
        flex-col

        h-full
        min-h-[540px]
      "
                >
                  {p.image && (
                    <div className="h-[280px] bg-neutral-100 shrink-0">
                      <img
                        src={mediaUrl(p.image)}
                        alt={p.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-heading text-2xl leading-tight min-h-[72px]">
                      {p.title}
                    </h3>

                    <RichText
                      text={p.description}
                      className="mt-3 flex-1 text-base leading-7 text-neutral-600"
                    />

                    {getPromotionTourSlug(p) && (
                      <Link
                        to={`/tours/${getPromotionTourSlug(p)}`}
                        className="
              mt-6
              inline-flex
              items-center
              gap-2
              text-base
              font-medium
              text-[#C2410C]
              hover:text-[#9A3412]
            "
                      >
                        Посмотреть тур <ArrowRight className="size-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <LeadDialog
        open={leadOpen}
        onOpenChange={setLeadOpen}
        tours={tours}
        title="Получить консультацию"
      />
    </div>
  );
}
