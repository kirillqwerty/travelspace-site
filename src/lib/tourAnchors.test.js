import {
  getTourAnchorIssues,
  getTourAnchorPath,
  normalizeTourAnchor,
  normalizeTourSectionAnchors,
} from "./tourAnchors";

test("normalizes manually entered anchors and complete URLs", () => {
  expect(normalizeTourAnchor(" Даты и цены ")).toBe("daty-i-tseny");
  expect(normalizeTourAnchor("https://travelspace.by/tours/kareliya#Отели тура")).toBe("oteli-tura");
  expect(normalizeTourAnchor("#PROGRAM-day_2")).toBe("program-day-2");
});

test("keeps only supported non-empty section anchors", () => {
  expect(
    normalizeTourSectionAnchors({
      about: "Главное",
      dates: "",
      unexpected: "hidden",
    }),
  ).toEqual({ about: "glavnoe" });
});

test("builds a stable tour URL and finds conflicts", () => {
  expect(getTourAnchorPath("arktika", "Даты тура")).toBe(
    "/tours/arktika#daty-tura",
  );
  expect(
    getTourAnchorIssues({
      section_anchors: { dates: "sale-dates", about: "program" },
      program: [{ anchor: "sale-dates" }],
      chains: [{ hotels: [{ anchor_slug: "hotel-link" }] }],
    }),
  ).toEqual({ duplicates: ["sale-dates"], reserved: ["program"] });
});
