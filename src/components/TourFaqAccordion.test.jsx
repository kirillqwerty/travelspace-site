import { act } from "react";
import { createRoot } from "react-dom/client";
import TourFaqAccordion from "./TourFaqAccordion";

const items = [{ question: "Нужен ли паспорт?", answer: "Да, возьмите **паспорт**." }, { question: "Как забронировать?", answer: "Оставьте заявку." }];
let container;
let root;
const triggers = () => [...container.querySelectorAll("button[aria-expanded]")];
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<TourFaqAccordion items={items} />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

test("opens the first answer and keeps rich answers in the DOM", () => {
  expect(triggers().map(e => e.getAttribute("aria-expanded"))).toEqual(["true", "false"]);
  expect(container.querySelector("strong").textContent).toBe("паспорт");
  expect(container.textContent).toContain("Оставьте заявку.");
});

test("answers can be opened independently without closing the first", async () => {
  await act(async () => triggers()[1].click());
  expect(triggers().map(e => e.getAttribute("aria-expanded"))).toEqual(["true", "true"]);
  await act(async () => triggers()[0].click());
  expect(triggers().map(e => e.getAttribute("aria-expanded"))).toEqual(["false", "true"]);
});

test("the bulk control expands and collapses every answer", async () => {
  const toggle = container.querySelector('[data-testid="tour-faq-toggle-all"]');
  await act(async () => toggle.click());
  expect(triggers().every(e => e.getAttribute("aria-expanded") === "true")).toBe(true);
  expect(toggle.textContent).toBe("Свернуть все ответы");
  await act(async () => toggle.click());
  expect(triggers().every(e => e.getAttribute("aria-expanded") === "false")).toBe(true);
  expect(toggle.textContent).toBe("Раскрыть все ответы");
});

test("new FAQ data starts with its own first answer open", async () => {
  await act(async () => triggers()[0].click());
  await act(async () => root.render(<TourFaqAccordion items={[{ question: "Другой вопрос", answer: "Другой ответ" }]} />));
  expect(triggers()[0].getAttribute("aria-expanded")).toBe("true");
  expect(container.textContent).toContain("Другой ответ");
});
