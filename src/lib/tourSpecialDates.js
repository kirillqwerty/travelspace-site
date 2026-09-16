export const DEFAULT_SPECIAL_DATE_LABEL = "Особая дата";
export const DEFAULT_SPECIAL_DATE_CTA = "Смотреть специальную программу";

const cleanText = (value, maxLength) =>
  String(value || "").trim().slice(0, maxLength);

export function isSpecialTourDate(date) {
  return date?.special_active === true || date?.specialActive === true;
}

export function getSpecialDateLabel(date) {
  if (!isSpecialTourDate(date)) return "";
  return (
    cleanText(date?.special_label || date?.specialLabel, 80) ||
    DEFAULT_SPECIAL_DATE_LABEL
  );
}

export function getSpecialDateTourSlug(date) {
  if (!isSpecialTourDate(date)) return "";
  return cleanText(date?.special_tour_slug || date?.specialTourSlug, 160);
}

export function getSpecialDateCtaLabel(date) {
  if (!getSpecialDateTourSlug(date)) return "";
  return (
    cleanText(date?.special_cta_label || date?.specialCtaLabel, 80) ||
    DEFAULT_SPECIAL_DATE_CTA
  );
}

export function normalizeSpecialDateFields(date = {}) {
  return {
    special_active: isSpecialTourDate(date),
    special_label: cleanText(
      date.special_label || date.specialLabel,
      80,
    ),
    special_tour_slug: cleanText(
      date.special_tour_slug || date.specialTourSlug,
      160,
    ),
    special_cta_label: cleanText(
      date.special_cta_label || date.specialCtaLabel,
      80,
    ),
  };
}

