import { selectTravelLinksTours, upcomingTourDates } from "./travelLinks";
const tours = [
  { slug: "expired", dates: [{ start: "2025-01-01" }], order: 0 },
  { slug: "later", dates: [{ start: "2026-12-01" }], order: 1 },
  { slug: "soon", chains: [{ active: true, dates: [{ start: "2026-09-12" }] }], order: 2 },
  { slug: "hidden", hidden: true, dates: [{ start: "2026-09-11" }] },
  { slug: "disabled", active: false, dates: [{ start: "2026-09-11" }] },
  { slug: "undated" },
];
test("automatic social hub shows future visible tours by nearest departure", () => {
  expect(selectTravelLinksTours(tours, {}, "2026-09-10").map((item) => item.slug)).toEqual(["soon", "later"]);
});
test("manual social hub preserves explicit order and excludes unavailable records", () => {
  expect(selectTravelLinksTours(tours, { tour_slugs: ["later", "hidden", "soon", "later", "disabled", "missing"] }).map((item) => item.slug)).toEqual(["later", "soon"]);
  expect(selectTravelLinksTours(tours, { tour_slugs: [] })).toEqual([]);
});
test("hidden dates and disabled hotel chains do not make a tour current", () => {
  expect(upcomingTourDates({ dates: [{ start: "2027-01-01", status: "hidden" }], chains: [{ active: false, dates: [{ start: "2027-01-01" }] }] }, "2026-09-10")).toEqual([]);
});
