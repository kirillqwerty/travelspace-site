const CYRILLIC_TO_LATIN = {
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

export const TOUR_SECTION_ANCHORS = [
  { key: "about", label: "О туре", defaultAnchor: "about-tour" },
  { key: "gallery", label: "Галерея", defaultAnchor: "gallery" },
  { key: "highlights", label: "Главные впечатления", defaultAnchor: "highlights" },
  { key: "what_to_see", label: "Что посмотреть" },
  { key: "program", label: "Программа тура", defaultAnchor: "program" },
  { key: "price", label: "Что входит / не входит", defaultAnchor: "price" },
  { key: "videos", label: "Видео о туре" },
  { key: "dates", label: "Даты и стоимость", defaultAnchor: "dates-prices" },
  { key: "hotels", label: "Отели и номера" },
  { key: "important", label: "Важная информация" },
  { key: "related", label: "Связанные туры" },
  { key: "faq", label: "Вопросы и ответы", defaultAnchor: "faq" },
];

export const RESERVED_TOUR_ANCHORS = new Set(
  TOUR_SECTION_ANCHORS.map((item) => item.defaultAnchor).filter(Boolean),
);

export function normalizeTourAnchor(value = "") {
  const source = String(value || "").trim();
  const hashValue = source.includes("#") ? source.split("#").pop() : source;

  return String(hashValue || "")
    .toLowerCase()
    .replace(/[а-яё]/g, (char) => CYRILLIC_TO_LATIN[char] || char)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeTourSectionAnchors(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};

  return Object.fromEntries(
    TOUR_SECTION_ANCHORS.map(({ key }) => [key, normalizeTourAnchor(source[key])])
      .filter(([, anchor]) => anchor),
  );
}

export function getTourSectionAnchor(tour, key) {
  return normalizeTourAnchor(tour?.section_anchors?.[key]);
}

export function getTourAnchorPath(tourSlug, anchor) {
  const safeTourSlug = String(tourSlug || "slug-tura").trim() || "slug-tura";
  const safeAnchor = normalizeTourAnchor(anchor);
  return safeAnchor ? `/tours/${safeTourSlug}#${safeAnchor}` : "";
}

export function getTourAnchorUrl(tourSlug, anchor) {
  const path = getTourAnchorPath(tourSlug, anchor);
  if (!path) return "";
  return typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
}

export function getTourAnchorIssues(tour = {}) {
  const values = [];
  const sectionAnchors = normalizeTourSectionAnchors(tour.section_anchors);

  Object.entries(sectionAnchors).forEach(([key, anchor]) => {
    values.push({ source: `section:${key}`, anchor });
  });
  (Array.isArray(tour.program) ? tour.program : []).forEach((day, index) => {
    const anchor = normalizeTourAnchor(day?.anchor);
    if (anchor) values.push({ source: `program:${index}`, anchor });
  });
  (Array.isArray(tour.chains) ? tour.chains : []).forEach((chain, chainIndex) => {
    (Array.isArray(chain?.hotels) ? chain.hotels : []).forEach((hotel, hotelIndex) => {
      const anchor = normalizeTourAnchor(hotel?.anchor_slug || hotel?.anchor);
      if (anchor) values.push({ source: `hotel:${chainIndex}:${hotelIndex}`, anchor });
    });
  });

  const seen = new Map();
  const duplicates = new Set();
  values.forEach(({ source, anchor }) => {
    if (seen.has(anchor) && seen.get(anchor) !== source) duplicates.add(anchor);
    else seen.set(anchor, source);
  });

  return {
    duplicates: [...duplicates],
    reserved: [...new Set(values.map(({ anchor }) => anchor).filter((anchor) => RESERVED_TOUR_ANCHORS.has(anchor)))],
  };
}
