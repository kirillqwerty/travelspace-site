import {
  getTourTransportType,
  TOUR_TRANSPORT_TYPES,
} from "@/lib/tourTransport";

export const TOUR_LANDINGS = {
  "avtobusnye-iz-minska": {
    title: "Автобусные туры из Минска 2026 | TRAVELSPACE",
    description:
      "Автобусные туры из Минска в Грузию, Дагестан, Санкт-Петербург, Карелию, Абхазию и другие направления.",
    heading: "Автобусные туры из Минска",
    intro:
      "Готовые групповые маршруты с продуманной программой, сопровождением и удобными датами выезда. Сравните направления и выберите подходящую поездку.",
    transportType: TOUR_TRANSPORT_TYPES.BUS,
  },
  "avia-iz-minska": {
    title: "Авиационные туры из Минска 2026 | TRAVELSPACE",
    description:
      "Туры с перелётом из Минска: актуальные направления, программы, даты и стоимость поездок.",
    heading: "Авиационные туры из Минска",
    intro:
      "Путешествия с перелётом для тех, кто хочет быстрее добраться до места отдыха. В карточках указаны программа, даты и состав стоимости.",
    transportType: TOUR_TRANSPORT_TYPES.AIR,
  },
  gruziya: {
    title: "Туры в Грузию из Минска 2026 | TRAVELSPACE",
    description:
      "Туры в Грузию из Минска: отдых на море, экскурсии, даты, программа и стоимость поездки.",
    heading: "Туры в Грузию из Минска",
    intro:
      "Поездки в Грузию сочетают море, горные пейзажи, национальную кухню и экскурсии. На странице собраны актуальные программы TRAVELSPACE.",
    keywords: ["груз", "gruzi"],
  },
  "sankt-peterburg": {
    title: "Автобусный тур в Санкт-Петербург из Минска | TRAVELSPACE",
    description:
      "Туры в Санкт-Петербург и Питер из Минска на выходные: программа, даты, отели и стоимость.",
    heading: "Туры в Санкт-Петербург из Минска",
    intro:
      "Автобусные поездки в Санкт-Петербург из Минска с насыщенной экскурсионной программой. Выберите дату и изучите подробный маршрут тура.",
    keywords: ["петербург", "питер", "peterburg"],
  },
  dagestan: {
    title: "Туры в Дагестан из Минска 2026 | TRAVELSPACE",
    description:
      "Автобусные туры в Дагестан из Минска: горы, каньоны, экскурсии, даты и стоимость.",
    heading: "Туры в Дагестан из Минска",
    intro:
      "Горные маршруты, Сулакский каньон, древние аулы и Каспийское море в одной поездке. Ниже — актуальные программы и даты.",
    keywords: ["дагест", "dagestan"],
  },
  kareliya: {
    title: "Туры в Карелию из Минска 2026 | TRAVELSPACE",
    description:
      "Автобусные туры в Карелию из Минска: Рускеала, Кижи, Ладожские шхеры, даты и программа.",
    heading: "Туры в Карелию из Минска",
    intro:
      "Карельская природа, горный парк Рускеала, остров Кижи и Ладожские шхеры. Сравните программу и доступные даты поездки.",
    keywords: ["карел", "kareli"],
  },
  abhaziya: {
    title: "Туры в Абхазию из Минска 2026 | TRAVELSPACE",
    description:
      "Автобусные туры в Абхазию из Минска: море, экскурсии, программа, даты и стоимость.",
    heading: "Туры в Абхазию из Минска",
    intro:
      "Отдых у моря с экскурсионной программой и организованным выездом из Минска. Изучите маршрут, отели и ближайшие даты.",
    keywords: ["абхаз", "abhaz"],
  },
  "severnaya-osetiya": {
    title: "Туры в Северную Осетию из Минска | TRAVELSPACE",
    description:
      "Автобусные туры в Северную Осетию из Минска: горные маршруты, программа, даты и цены.",
    heading: "Туры в Северную Осетию из Минска",
    intro:
      "Горные ущелья, древние башни и живописные дороги Северной Осетии. На странице собраны доступные программы TRAVELSPACE.",
    keywords: ["осети", "oseti"],
  },
  moskva: {
    title: "Автобусные туры в Москву из Минска | TRAVELSPACE",
    description:
      "Туры в Москву из Минска на выходные: экскурсионная программа, даты, отель и стоимость.",
    heading: "Туры в Москву из Минска",
    intro:
      "Короткие автобусные поездки в Москву из Минска для насыщенных выходных. Проверьте программу, даты и включённые услуги.",
    keywords: ["москв", "moskv"],
  },
  arktika: {
    title: "Туры в Арктику из Минска | TRAVELSPACE",
    description:
      "Автобусные туры в Арктику из Минска: программа поездки, даты, маршрут и стоимость.",
    heading: "Туры в Арктику из Минска",
    intro:
      "Поездки за Полярный круг, северные пейзажи и необычная экскурсионная программа. На странице появятся актуальные даты и маршруты TRAVELSPACE.",
    keywords: ["аркти", "arkti"],
  },
};

export const TOUR_LANDING_LINKS = [
  ["avtobusnye-iz-minska", "Автобусные туры"],
  ["avia-iz-minska", "Авиационные туры"],
  ["gruziya", "Грузия"],
  ["sankt-peterburg", "Санкт-Петербург"],
  ["dagestan", "Дагестан"],
  ["kareliya", "Карелия"],
  ["abhaziya", "Абхазия"],
  ["severnaya-osetiya", "Северная Осетия"],
  ["moskva", "Москва"],
  ["arktika", "Арктика"],
].map(([slug, label]) => ({ slug, label, path: `/tours/${slug}` }));

export function getTourLanding(settings, slug = "") {
  const fallback = TOUR_LANDINGS[slug];
  if (!fallback) return null;
  const configured = settings?.seo_hubs?.[slug] || {};
  const editable = {};

  ["title", "description", "heading", "intro"].forEach((field) => {
    const value = configured[field];
    if (typeof value === "string" && value.trim()) editable[field] = value.trim();
  });

  return { ...fallback, ...editable };
}

function tourSearchText(tour) {
  return [
    tour?.slug,
    tour?.title,
    tour?.region_slug,
    tour?.region_name,
    tour?.tagline,
    tour?.short_description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function isTourLandingSlug(slug = "") {
  return Boolean(TOUR_LANDINGS[slug]);
}

export function filterToursForLanding(tours = [], slug = "") {
  const landing = TOUR_LANDINGS[slug];
  if (!landing) return [];

  if (landing.transportType) {
    return tours.filter(
      (tour) => getTourTransportType(tour) === landing.transportType,
    );
  }

  return tours.filter((tour) =>
    landing.keywords?.some((keyword) => tourSearchText(tour).includes(keyword)),
  );
}

export function getDirectionLandingForTour(tour) {
  return TOUR_LANDING_LINKS.slice(2).find(({ slug }) =>
    TOUR_LANDINGS[slug].keywords?.some((keyword) =>
      tourSearchText(tour).includes(keyword),
    ),
  );
}
