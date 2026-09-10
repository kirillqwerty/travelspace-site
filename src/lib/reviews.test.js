import { sortReviewsByDate } from "./reviews";
test("newest reviews first, stable tie order and undated reviews last", () => {
  const items = [{ id: "undated", order: 0 }, { id: "old", date: "01.01.2025" }, { id: "same-b", date: "2026-09-10", order: 2 }, { id: "same-a", date: "10.09.2026", order: 1 }];
  expect(sortReviewsByDate(items).map((item) => item.id)).toEqual(["same-a", "same-b", "old", "undated"]);
});
