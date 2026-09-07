import { act } from "react";
import { createRoot } from "react-dom/client";
import { RichInline, RichText } from "./richText";

let root;
let container;

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
