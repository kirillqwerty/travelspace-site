import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import TourCard from "@/components/TourCard";
import PageSeo from "@/components/PageSeo";
import { isTourShownInCatalog } from "@/lib/tourVisibility";

const BADGES = [
  "Хит",
  "Новинка",
  "Без виз",
  "Море",
  "Авторский тур",
  "Экскурсионный тур",
  "Автобусный тур",
];

export default function Catalog() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const region = params.get("region") || "";
  const badge = params.get("badge") || "";

  useEffect(() => {
    setLoading(true);

    api
      .get("/tours")
      .then((r) =>
        setTours(
          Array.isArray(r.data) ? r.data.filter(isTourShownInCatalog) : [],
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const regions = useMemo(() => {
    const map = new Map();
    tours.forEach((t) => {
      if (!t.region_slug || map.has(t.region_slug)) return;
      map.set(t.region_slug, { slug: t.region_slug, name: t.region_name });
    });
    return Array.from(map.values());
  }, [tours]);

  const filtered = useMemo(() => {
    return tours.filter((t) => {
      if (!isTourShownInCatalog(t)) return false;
      if (region && t.region_slug !== region) return false;
      if (badge && !(t.badges || []).includes(badge)) return false;
      return true;
    });
  }, [tours, region, badge]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div
      className="section-container pt-32 lg:pt-36 pb-16 lg:pb-24"
      data-testid="catalog-page"
    >
      <PageSeo
        pageKey="tours"
        path="/tours"
        title="Каталог автобусных туров из Минска | TRAVELSPACE"
        description="Выбирайте автобусные туры из Минска по направлениям, датам и форматам отдыха. TRAVELSPACE поможет подобрать подходящий тур."
      />
      <p className="overline text-[#C2410C]">Каталог туров</p>
      <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mt-3 max-w-3xl">
        Все автобусные туры из Минска
      </h1>
      <p className="text-neutral-600 mt-4 max-w-2xl">
        Выбирайте тур или интересующий формат — мы расскажем подробнее и
        подберём ближайшую дату.
      </p>

      {/* Region tabs
      <div
        className="mt-10 flex flex-wrap items-center gap-2"
        data-testid="catalog-region-filter"
      >
        <button
          onClick={() => setFilter("region", "")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
            !region
              ? "bg-neutral-900 text-white border-neutral-900"
              : "border-neutral-200 hover:border-neutral-400"
          }`}
          data-testid="region-all"
        >
          Все туры
        </button>
        {regions.map((d) => (
          <button
            key={d.slug}
            onClick={() => setFilter("region", d.slug)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
              region === d.slug
                ? "bg-neutral-900 text-white border-neutral-900"
                : "border-neutral-200 hover:border-neutral-400"
            }`}
            data-testid={`region-${d.slug}`}
          >
            {d.name}
          </button>
        ))}
      </div> */}

      {/* <div
        className="mt-4 flex flex-wrap items-center gap-2"
        data-testid="catalog-badge-filter"
      >
        <span className="text-xs text-neutral-500 uppercase tracking-wider mr-1">
          Метки:
        </span>
        <button
          onClick={() => setFilter("badge", "")}
          className={`text-xs px-3 py-1.5 rounded-full transition ${
            !badge
              ? "bg-[#C2410C] text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Любые
        </button>
        {BADGES.map((b) => (
          <button
            key={b}
            onClick={() => setFilter("badge", b)}
            className={`text-xs px-3 py-1.5 rounded-full transition ${
              badge === b
                ? "bg-[#C2410C] text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {b}
          </buttoокейn>
        ))}
      </div> */}

      <div className="mt-12">
        {loading ? (
          <div className="rounded-2xl border border-neutral-200 p-12 text-center text-neutral-500">
            Загрузка туров…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center text-neutral-500">
            По вашему запросу ничего не нашли. Попробуйте сменить фильтры.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t) => (
              <TourCard key={t.id} tour={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
