import { act } from "react";
import { createRoot } from "react-dom/client";
import cases from "./richTextCases.json";
import {
  RichInline,
  RichText,
  richTextToPlain,
  splitRichTextBlocks,
} from "./richText";

let root;
let container;

test.each(cases)("formatting matrix: $text", async ({ text, plain, hrefs, tags }) => {
  for (const Component of [RichInline, RichText]) {
    await act(async () => root.render(<Component text={text} />));
    expect(container.textContent).toBe(plain);
    expect(richTextToPlain(text)).toBe(plain);
    expect([...container.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual(hrefs);
    expect(container.querySelector("a a")).toBeNull();
    for (const tag of tags) expect(container.querySelector(tag)).not.toBeNull();
  }
});

test("links inside bold inherit their font weight", async () => {
  await act(async () => root.render(<RichInline text="**[Тур](/tours/test)**" />));
  expect(container.querySelector("a").style.fontWeight).toBe("inherit");
});

test("cards disable links at every nesting level", async () => {
  await act(async () => root.render(<RichInline text="**[Тур](/tours/test)** и https://example.com" links={false} />));
  expect(container.querySelector("a")).toBeNull();
  expect(container.querySelector("strong").textContent).toBe("Тур");
});

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

test.each([RichText, RichInline])("existing saved links open a new tab in %p", async (Component) => {
  await act(async () => root.render(
    <Component text="[Грузия](/tours/gruziya) и [Внешний сайт](https://example.com/tour)" />,
  ));
  const links = [...container.querySelectorAll("a")];
  expect(links.map((link) => link.getAttribute("href"))).toEqual([
    "/tours/gruziya", "https://example.com/tour",
  ]);
  expect(links.map((link) => link.textContent)).toEqual(["Грузия", "Внешний сайт"]);
  for (const link of links) {
    expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noopener noreferrer");
  }
});

test("plain web addresses still open safely in a new tab", async () => {
  await act(async () => root.render(<RichText text="https://example.com/tour" />));
  const link = container.querySelector("a");
  expect(link.target).toBe("_blank");
  expect(link.rel).toBe("noopener noreferrer");
});

test("unsupported and unsafe link targets remain plain text", async () => {
  await act(async () => root.render(
    <RichText text="[Первый](javascript:alert) [Второй](//example.com) [Третий](data:text/html,test)" />,
  ));
  expect(container.querySelector("a")).toBeNull();
  expect(container.textContent).toBe("Первый Второй Третий");
});

test("links remain links when the editor wrapped the Markdown syntax", async () => {
  await act(async () => root.render(
    <RichText text={"Перейдите [в Санкт-Петербург]\n(https://travelspace.by/tours/sankt-peterburg) сегодня."} />,
  ));
  const link = container.querySelector("a");
  expect(link?.getAttribute("href")).toBe("https://travelspace.by/tours/sankt-peterburg");
  expect(link?.textContent).toBe("в Санкт-Петербург");
  expect(container.textContent).toContain("сегодня.");
});

test.each([RichText, RichInline])(
  "links with a space between the label and URL work in %p",
  async (Component) => {
    await act(async () => root.render(
      <Component text="[Санкт-Петербург] (https://travelspace.by/tours/peterburg)" />,
    ));
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("https://travelspace.by/tours/peterburg");
    expect(link?.textContent).toBe("Санкт-Петербург");
  },
);

test.each([
  "[Карелия]\u00a0(/tours/kareliya)",
  "[Карелия]\u200b(/tours/kareliya)",
  "[Карелия]&#x20;(/tours/kareliya)",
])("pasted link gap %p is normalized", async (text) => {
  await act(async () => root.render(<RichInline text={text} />));
  expect(container.querySelector("a")?.getAttribute("href")).toBe("/tours/kareliya");
  expect(container.textContent).toBe("Карелия");
});

test("paragraph splitting never breaks a multiline link", () => {
  expect(splitRichTextBlocks("До [тура]\n\n(/tours/gruziya) после")).toEqual([
    "До [тура](/tours/gruziya) после",
  ]);
});

test("plain text conversion keeps labels and removes Markdown URLs", () => {
  expect(richTextToPlain("Текст [о туре] &#160;(/tours/gruziya) и **важное**"))
    .toBe("Текст о туре и важное");
});

test.each([RichText, RichInline])(
  "a link wrapped in bold formatting stays clickable in %p",
  async (Component) => {
    await act(async () => root.render(
      <Component text="**[Рождественский тур] (https://travelspace.by/tours/rozhdestvo)**" />,
    ));
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("https://travelspace.by/tours/rozhdestvo");
    expect(link?.textContent).toBe("Рождественский тур");
    expect(link?.closest("strong")).not.toBeNull();
    expect(container.textContent).not.toContain("[");
  },
);

test("formatting inside a link label is preserved", async () => {
  await act(async () => root.render(
    <RichText text="[**Карелия**](/tours/kareliya)" />,
  ));
  const link = container.querySelector("a");
  expect(link?.querySelector("strong")?.textContent).toBe("Карелия");
});
