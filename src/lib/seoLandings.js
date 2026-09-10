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
    content_title:
      "Автобусные туры из Беларуси: направления, цены и формат поездок",
    content_body:
      "Автобусные туры из Минска подходят для экскурсионных поездок, отдыха у моря и путешествий по природным маршрутам. В одном месте можно сравнить даты, продолжительность, программу и стоимость, а затем открыть страницу выбранного тура и изучить подробности.\n\nВ каталоге собраны актуальные [автобусные туры из Минска](/tours): доступность мест и окончательную стоимость на выбранную дату подтверждает менеджер TRAVELSPACE. Такой формат помогает заранее оценить бюджет и выбрать поездку, которая подходит по темпу, маршруту и продолжительности.",
    content_sections: [
      {
        title: "Экскурсионные автобусные туры",
        text: "Для насыщенной экскурсионной программы подойдут поездки в [Санкт-Петербург](/tours/sankt-peterburg), [Дагестан](/tours/dagestan), [Карелию](/tours/kareliya) и [Арктику](/tours/arktika). На странице каждого направления собраны подходящие программы, ближайшие даты и основные условия поездки.",
      },
      {
        title: "Автобусные туры на море",
        text: "Поездки в [Грузию](/tours/gruziya) и [Абхазию](/tours/abhaziya) позволяют совместить организованный переезд, проживание, отдых у моря и экскурсии. Перед бронированием сравните продолжительность отдыха, расположение отеля и услуги, включённые в стоимость.",
      },
      {
        title: "Откуда отправляются автобусы",
        text: "Основным городом отправления является Минск. Возможные посадки в других городах Беларуси зависят от конкретного маршрута и даты. Актуальные города и точки посадки указаны на странице тура; при оформлении заявки менеджер подтвердит удобный вариант.",
      },
      {
        title: "Что входит в стоимость поездки",
        text: "Состав стоимости зависит от программы. Обычно отдельно указаны проезд, проживание, экскурсии, питание и дополнительные расходы. Проверяйте блоки «В стоимость включено» и «В стоимость не включено» на странице выбранного тура, чтобы корректно сравнить предложения.",
      },
    ],
    how_to_title: "Как выбрать автобусный тур из Минска",
    faq_title: "Частые вопросы об автобусных турах из Минска",
    faq_items: [
      {
        question: "Какие автобусные туры из Минска доступны сейчас?",
        answer:
          "Актуальные программы и даты показаны в каталоге выше. Если подходящей даты пока нет, оставьте заявку — менеджер проверит ближайшие выезды и предложит альтернативы.",
      },
      {
        question: "Куда можно поехать на автобусе из Беларуси?",
        answer:
          "В каталоге представлены экскурсионные поездки и туры на море. Среди направлений — Санкт-Петербург, Дагестан, Карелия, Арктика, Грузия, Абхазия и другие маршруты.",
      },
      {
        question: "Из каких городов Беларуси есть отправления?",
        answer:
          "Основной город отправления — Минск. Дополнительные города посадки зависят от маршрута и даты и указываются на странице конкретного тура.",
      },
      {
        question: "Что входит в стоимость автобусного тура?",
        answer:
          "Для каждого тура состав стоимости указан отдельно. На странице программы можно проверить, включены ли проезд, проживание, экскурсии и питание, а также увидеть возможные дополнительные расходы.",
      },
      {
        question: "Сколько обычно длится автобусный тур?",
        answer:
          "Продолжительность зависит от направления и программы. Количество дней и ночей указано в карточке и на подробной странице каждого тура.",
      },
      {
        question: "Можно ли выбрать место в автобусе?",
        answer:
          "Возможность выбора места зависит от конкретной поездки и схемы автобуса. Сообщите пожелание менеджеру при бронировании — он уточнит доступные варианты.",
      },
      {
        question: "Как забронировать автобусный тур?",
        answer:
          "Выберите программу и дату, затем оставьте заявку на сайте. Менеджер свяжется с вами, подтвердит наличие мест, итоговую стоимость и порядок оформления.",
      },
      {
        question: "Какие документы нужны для поездки?",
        answer:
          "Перечень документов зависит от страны, маршрута и возраста туриста. Перед оплатой менеджер сообщит актуальные требования для выбранной поездки.",
      },
    ],
    transportType: TOUR_TRANSPORT_TYPES.BUS,
  },
  "avia-iz-minska": {
    title: "Авиа туры из Минска 2026 | TRAVELSPACE",
    description:
      "Туры с перелётом из Минска: актуальные направления, программы, даты и стоимость поездок.",
    heading: "Авиа туры из Минска",
    intro:
      "Путешествия с перелётом для тех, кто хочет быстрее добраться до места отдыха. В карточках указаны программа, даты и состав стоимости.",
    how_to_title: "Как выбрать авиа тур из Минска",
    transportType: TOUR_TRANSPORT_TYPES.AIR,
  },
  gruziya: {
    title: "Туры в Грузию из Минска 2026 | TRAVELSPACE",
    description:
      "Туры в Грузию из Минска: отдых на море, экскурсии, даты, программа и стоимость поездки.",
    heading: "Туры в Грузию из Минска",
    intro:
      "Поездки в Грузию сочетают море, горные пейзажи, национальную кухню и экскурсии. На странице собраны актуальные программы TRAVELSPACE.",
    how_to_title: "Как выбрать тур в Грузию из Минска",
    keywords: ["груз", "gruzi"],
  },
  "sankt-peterburg": {
    title: "Автобусный тур в Санкт-Петербург из Минска | TRAVELSPACE",
    description:
      "Туры в Санкт-Петербург и Питер из Минска на выходные: программа, даты, отели и стоимость.",
    heading: "Туры в Санкт-Петербург из Минска",
    intro:
      "Автобусные поездки в Санкт-Петербург из Минска с насыщенной экскурсионной программой. Выберите дату и изучите подробный маршрут тура.",
    how_to_title: "Как выбрать тур в Санкт-Петербург из Минска",
    keywords: ["петербург", "питер", "peterburg"],
  },
  dagestan: {
    title: "Туры в Дагестан из Минска 2026 | TRAVELSPACE",
    description:
      "Автобусные туры в Дагестан из Минска: горы, каньоны, экскурсии, даты и стоимость.",
    heading: "Туры в Дагестан из Минска",
    intro:
      "Горные маршруты, Сулакский каньон, древние аулы и Каспийское море в одной поездке. Ниже — актуальные программы и даты.",
    how_to_title: "Как выбрать тур в Дагестан из Минска",
    keywords: ["дагест", "dagestan"],
  },
  kareliya: {
    title: "Туры в Карелию из Минска 2026 | TRAVELSPACE",
    description:
      "Автобусные туры в Карелию из Минска: Рускеала, Кижи, Ладожские шхеры, даты и программа.",
    heading: "Туры в Карелию из Минска",
    intro:
      "Карельская природа, горный парк Рускеала, остров Кижи и Ладожские шхеры. Сравните программу и доступные даты поездки.",
    how_to_title: "Как выбрать тур в Карелию из Минска",
    keywords: ["карел", "kareli"],
  },
  abhaziya: {
    title: "Туры в Абхазию из Минска 2026 | TRAVELSPACE",
    description:
      "Автобусные туры в Абхазию из Минска: море, экскурсии, программа, даты и стоимость.",
    heading: "Туры в Абхазию из Минска",
    intro:
      "Отдых у моря с экскурсионной программой и организованным выездом из Минска. Изучите маршрут, отели и ближайшие даты.",
    how_to_title: "Как выбрать тур в Абхазию из Минска",
    keywords: ["абхаз", "abhaz"],
  },
  "severnaya-osetiya": {
    title: "Туры в Северную Осетию из Минска | TRAVELSPACE",
    description:
      "Автобусные туры в Северную Осетию из Минска: горные маршруты, программа, даты и цены.",
    heading: "Туры в Северную Осетию из Минска",
    intro:
      "Горные ущелья, древние башни и живописные дороги Северной Осетии. На странице собраны доступные программы TRAVELSPACE.",
    how_to_title: "Как выбрать тур в Северную Осетию из Минска",
    keywords: ["осети", "oseti"],
  },
  moskva: {
    title: "Автобусные туры в Москву из Минска | TRAVELSPACE",
    description:
      "Туры в Москву из Минска на выходные: экскурсионная программа, даты, отель и стоимость.",
    heading: "Туры в Москву из Минска",
    intro:
      "Короткие автобусные поездки в Москву из Минска для насыщенных выходных. Проверьте программу, даты и включённые услуги.",
    how_to_title: "Как выбрать тур в Москву из Минска",
    keywords: ["москв", "moskv"],
  },
  arktika: {
    title: "Туры в Арктику из Минска | TRAVELSPACE",
    description:
      "Автобусные туры в Арктику из Минска: программа поездки, даты, маршрут и стоимость.",
    heading: "Туры в Арктику из Минска",
    intro:
      "Поездки за Полярный круг, северные пейзажи и необычная экскурсионная программа. На странице появятся актуальные даты и маршруты TRAVELSPACE.",
    how_to_title: "Как выбрать тур в Арктику из Минска",
    keywords: ["аркти", "arkti"],
  },
};

const EMPTY_LANDING_CONTENT = {
  catalog_title: "Выберите подходящий тур",
  content_title: "",
  content_body: "",
  content_sections: [],
  how_to_title: "Как выбрать тур",
  faq_title: "",
  faq_items: [],
};

export function getTourLandingDefaults(slug = "") {
  const landing = TOUR_LANDINGS[slug];
  if (!landing) return null;

  return {
    ...EMPTY_LANDING_CONTENT,
    ...landing,
    content_sections: Array.isArray(landing.content_sections)
      ? landing.content_sections.map((section) => ({ ...section }))
      : [],
    faq_items: Array.isArray(landing.faq_items)
      ? landing.faq_items.map((item) => ({ ...item }))
      : [],
  };
}

export const TOUR_LANDING_LINKS = [
  ["avtobusnye-iz-minska", "Автобусные туры"],
  ["avia-iz-minska", "Авиа туры"],
  ["gruziya", "Грузия"],
  ["sankt-peterburg", "Санкт-Петербург"],
  ["dagestan", "Дагестан"],
  ["kareliya", "Карелия"],
  ["abhaziya", "Абхазия"],
  ["severnaya-osetiya", "Северная Осетия"],
  ["moskva", "Москва"],
  ["arktika", "Арктика"],
].map(([slug, label]) => ({ slug, label, path: `/tours/${slug}` }));

export function getTourLandingLinks(settings) {
  const known = new Set(TOUR_LANDING_LINKS.map((item) => item.slug));
  const custom = Object.entries(settings?.seo_hubs || {})
    .filter(
      ([slug, item]) =>
        !known.has(slug) && item?.custom === true && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),
    )
    .map(([slug, item]) => ({
      slug,
      label: item.label || item.heading || slug,
      path: `/tours/${slug}`,
    }));
  return [...TOUR_LANDING_LINKS, ...custom];
}

export function getTourLanding(settings, slug = "") {
  const configured = settings?.seo_hubs?.[slug] || {};
  const fallback = getTourLandingDefaults(slug);
  const isCustom = !fallback && configured?.custom === true;
  if (!fallback && !isCustom) return null;
  const defaults = fallback || {
    ...EMPTY_LANDING_CONTENT,
    title: configured.title || `${configured.heading || configured.label || slug} | TRAVELSPACE`,
    description: configured.description || "",
    heading: configured.heading || configured.label || slug,
    intro: configured.intro || "",
    custom: true,
  };
  const editable = {};

  ["title", "description", "heading", "intro"].forEach((field) => {
    const value = configured[field];
    if (typeof value === "string" && value.trim()) editable[field] = value.trim();
  });

  ["catalog_title", "content_title", "content_body", "how_to_title", "faq_title", "seo_image"].forEach(
    (field) => {
      const value = configured[field];
      if (typeof value === "string") editable[field] = value.trim();
    },
  );

  if (Array.isArray(configured.content_sections)) {
    editable.content_sections = configured.content_sections.map((section) => ({
      title: String(section?.title || "").trim(),
      text: String(section?.text || "").trim(),
    }));
  }

  if (Array.isArray(configured.faq_items)) {
    editable.faq_items = configured.faq_items.map((item) => ({
      question: String(item?.question || "").trim(),
      answer: String(item?.answer || "").trim(),
    }));
  }

  if (Array.isArray(configured.tour_ids)) {
    editable.tour_ids = [...new Set(configured.tour_ids.map(String))];
  }

  return {
    ...defaults,
    ...editable,
    custom: isCustom || configured.custom === true,
    label: configured.label || defaults.heading,
  };
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

export function isTourLandingSlug(slug = "", settings) {
  return Boolean(
    TOUR_LANDINGS[slug] || settings?.seo_hubs?.[slug]?.custom === true,
  );
}

export function filterToursForLanding(tours = [], slug = "", tourIds) {
  const landing = TOUR_LANDINGS[slug];

  if (Array.isArray(tourIds)) {
    const byReference = new Map();
    tours.forEach((tour) => {
      if (tour?.id) byReference.set(String(tour.id), tour);
      if (tour?.slug) byReference.set(String(tour.slug), tour);
    });
    return tourIds
      .map((tourId) => byReference.get(String(tourId)))
      .filter(Boolean);
  }

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
