import { act } from "react";
import { createRoot } from "react-dom/client";
import Header from "./Header";

jest.mock("@/lib/useSiteData", () => ({ useSiteData: () => ({
  settings: {}, articles: [
    { slug: "peterburg-guide", title: "Главные места Санкт-Петербурга", title_highlighted: "Главные места **Санкт-Петербурга**", active: true },
  ], tours: [
    { slug: "bus-trip", title: "Поездка автобусом", transport_type: "bus" },
    { slug: "air-trip", title: "Поездка самолётом", transport_type: "air" },
  ],
}) }));
jest.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/", hash: "" }),
  Link: ({ to, children, onClick, ...props }) => <a href={to} onClick={(event) => { event.preventDefault(); onClick?.(event); }} {...props}>{children}</a>,
  NavLink: ({ to, children, onClick, className, ...props }) => <a className={typeof className === "function" ? className({ isActive: false }) : className} href={to} onClick={(event) => { event.preventDefault(); onClick?.(event); }} {...props}>{children}</a>,
}), { virtual: true });

let container;
let root;
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<Header />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

test("mobile tour labels toggle lists without exposing SEO hub links", async () => {
  await act(async () => container.querySelector('[data-testid="mobile-menu-open"]').click());
  const bus = container.querySelector('[data-testid="mobile-nav-tours-toggle-bus"]');
  const air = container.querySelector('[data-testid="mobile-nav-tours-toggle-air"]');
  expect(bus.tagName).toBe("BUTTON");
  expect(air.tagName).toBe("BUTTON");
  await act(async () => bus.querySelector("span").click());
  expect(bus.getAttribute("aria-expanded")).toBe("true");
  expect(container.querySelector('#mobile-tours-bus a').getAttribute("href")).toBe("/tours/bus-trip");
  await act(async () => air.click());
  expect(bus.getAttribute("aria-expanded")).toBe("false");
  expect(air.getAttribute("aria-expanded")).toBe("true");
  expect(container.querySelector('#mobile-tours-air a').getAttribute("href")).toBe("/tours/air-trip");
  expect(container.querySelector('[data-testid="mobile-menu"] a[href="/tours/avia-iz-minska"]')).toBeNull();
  await act(async () => air.click());
  expect(air.getAttribute("aria-expanded")).toBe("false");
  expect(container.querySelector('[data-testid="mobile-menu"]')).not.toBeNull();
});

test("selecting a mobile tour closes the menu", async () => {
  await act(async () => container.querySelector('[data-testid="mobile-menu-open"]').click());
  await act(async () => container.querySelector('[data-testid="mobile-nav-tours-toggle-bus"]').click());
  await act(async () => container.querySelector('#mobile-tours-bus a').click());
  expect(container.querySelector('[data-testid="mobile-menu"]')).toBeNull();
});

test("desktop all tours links lead to the visible catalog", async () => {
  await act(async () => container.querySelector('[data-testid="nav-tours-bus"]').click());
  expect(container.querySelector('#desktop-tours-bus a').getAttribute("href")).toBe("/#avtobusnie-tury");
  await act(async () => container.querySelector('[data-testid="nav-tours-air"]').click());
  expect(container.querySelector('#desktop-tours-air a').getAttribute("href")).toBe("/#avia-tury");
});

test("mobile blog menu renders the editor-selected words", async () => {
  await act(async () => container.querySelector('[data-testid="mobile-menu-open"]').click());
  await act(async () => container.querySelector('[aria-label="Показать статьи блога"]').click());
  const article = container.querySelector('[data-testid="mobile-article-list"] a[href="/blog/peterburg-guide"]');
  expect(article.querySelector("strong").textContent).toBe("Санкт-Петербурга");
});
