import { renderToStaticMarkup } from "react-dom/server";
import { getTourTitleDraft, parseTourTitle, tourTitleFields, TourMenuTitle } from "./tourTitle";

test("stores an ordinary title separately from several highlighted destinations", () => {
  const draft = "Автобусный тур в **Дагестан** из **Минска** на 10 дней";
  const fields = tourTitleFields(draft);
  expect(fields.title).toBe("Автобусный тур в Дагестан из Минска на 10 дней");
  expect(fields.title_highlighted).toBe(draft);
  expect(getTourTitleDraft(JSON.parse(JSON.stringify(fields)))).toBe(draft);
  expect(parseTourTitle(draft).parts.filter((part) => part.bold).map((part) => part.text)).toEqual(["Дагестан", "Минска"]);
  const html = renderToStaticMarkup(<TourMenuTitle tour={fields} />);
  expect(html).toContain('<strong class="font-extrabold text-[#C2410C]">Дагестан</strong>');
  expect(html).not.toContain("**");
});

test("removing bold clears formatting, without changing the actual title", () => {
  const fields = tourTitleFields("Тур в Грузию");
  expect(fields).toEqual({ title: "Тур в Грузию", title_highlighted: "" });
  expect(renderToStaticMarkup(<TourMenuTitle tour={fields} />)).toBe("Тур в Грузию");
});

test("legacy, renamed and duplicated tours use the current name instead of stale formatting", () => {
  for (const tour of [
    { title: "Тур в Арктику" },
    { title: "Тур в Арктику", title_highlighted: "Тур в **Грузию**" },
    { title: "Тур в Грузию (копия)", title_highlighted: "Тур в **Грузию**" },
    { title: "Тур в Грузию", title_highlighted: { text: "invalid" } },
  ]) {
    expect(getTourTitleDraft(tour)).toBe(tour.title);
    expect(renderToStaticMarkup(<TourMenuTitle tour={tour} />)).toBe(tour.title);
  }
});

test("formatting never creates HTML or nested links inside menu links", () => {
  const fields = tourTitleFields('Тур в **<img src=x onerror=alert(1)>** [Грузию](/tours/georgia)');
  const html = renderToStaticMarkup(<a href="/tours/test"><TourMenuTitle tour={fields} /></a>);
  expect(html).not.toContain("<img");
  expect(html.match(/<a /g)).toHaveLength(1);
  expect(html).toContain("&lt;img");
});

test("unfinished formatting remains editable without leaking markers to the title", () => {
  const fields = tourTitleFields("Тур в **Грузию");
  expect(fields.title).toBe("Тур в Грузию");
  expect(getTourTitleDraft(fields)).toBe("Тур в **Грузию");
  expect(renderToStaticMarkup(<TourMenuTitle tour={fields} />)).toBe("Тур в Грузию");
});
