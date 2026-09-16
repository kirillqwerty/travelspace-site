import {
  DEFAULT_SPECIAL_DATE_CTA,
  DEFAULT_SPECIAL_DATE_LABEL,
  getSpecialDateCtaLabel,
  getSpecialDateLabel,
  getSpecialDateTourSlug,
  isSpecialTourDate,
  normalizeSpecialDateFields,
} from "./tourSpecialDates";

test("keeps a custom special-date label and linked tour", () => {
  const date = {
    special_active: true,
    special_label: " Фестиваль тюльпанов ",
    special_tour_slug: " spring-festival ",
    special_cta_label: "Открыть программу",
  };

  expect(isSpecialTourDate(date)).toBe(true);
  expect(getSpecialDateLabel(date)).toBe("Фестиваль тюльпанов");
  expect(getSpecialDateTourSlug(date)).toBe("spring-festival");
  expect(getSpecialDateCtaLabel(date)).toBe("Открыть программу");
});

test("uses readable defaults and hides a link for an ordinary date", () => {
  expect(getSpecialDateLabel({ special_active: true })).toBe(
    DEFAULT_SPECIAL_DATE_LABEL,
  );
  expect(
    getSpecialDateCtaLabel({
      special_active: true,
      special_tour_slug: "new-year",
    }),
  ).toBe(DEFAULT_SPECIAL_DATE_CTA);
  expect(getSpecialDateTourSlug({ special_tour_slug: "hidden" })).toBe("");
});

test("normalizes legacy camelCase fields without changing their meaning", () => {
  expect(
    normalizeSpecialDateFields({
      specialActive: true,
      specialLabel: "Рождество",
      specialTourSlug: "christmas",
      specialCtaLabel: "Подробнее",
    }),
  ).toEqual({
    special_active: true,
    special_label: "Рождество",
    special_tour_slug: "christmas",
    special_cta_label: "Подробнее",
  });
});

