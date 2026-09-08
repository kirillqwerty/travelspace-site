import { act } from "react";
import { createRoot } from "react-dom/client";
import Header from "./Header";

jest.mock("@/lib/useSiteData", () => ({
  useSiteData: () => ({
    settings: {}, articles: [],
    tours: ["bus", "air"].flatMap((transport_type) =>
      Array.from({ length: 20 }, (_, index) => ({
        slug: `${transport_type}-${index}`, transport_type,
        title: `Длинное название тура из Минска на праздники — программа ${index + 1}`,
        title_highlighted: index === 0 ? "Длинное название тура из **Минска** на праздники — программа 1" : "",
      })),
    ),
  }),
}));
jest.mock("react-router-dom", () => {
  const React = require("react");
  const Link = ({ to, className, children, ...props }) => (
    <a href={to} className={typeof className === "function" ? className({ isActive: false }) : className} {...props}>
      {children}
    </a>
  );
  return { Link, NavLink: Link, useLocation: () => ({ pathname: "/tours", hash: "" }) };
}, { virtual: true }); // CRA's older Jest cannot resolve Router 7's package exports.
jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    AnimatePresence: ({ children }) => children,
    motion: { div: ({ initial, animate, exit, transition, children, ...props }) => <div {...props}>{children}</div> },
  };
});
jest.mock("@/components/MessengerModal", () => () => null);
jest.mock("@/components/LeadDialog", () => () => null);

let root;
let container;
const byId = (id) => container.querySelector(`[data-testid="${id}"]`);

beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root.render(<Header />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

async function dispatch(element, type, pointerType = "mouse", detail = 1) {
  await act(async () => {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, detail });
    Object.defineProperty(event, "pointerType", { value: pointerType });
    element.dispatchEvent(event);
  });
}

test.each(["bus", "air"])("%s menu remains open after mouse hover followed by click, and Escape closes it", async (type) => {
  const trigger = byId(`nav-tours-${type}`);
  await dispatch(trigger, "pointerover");
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  await dispatch(trigger, "click");
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  const list = byId(`desktop-tour-list-${type}`);
  expect(list.querySelectorAll("a")).toHaveLength(20);
  expect(list.className).toContain("overflow-y-auto");
  expect(list.querySelector("a").textContent).toContain("Длинное название тура");
  await act(async () => trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(trigger);
});

test.each([["keyboard", 0], ["touch", 1], ["pen", 1]])("%s activation toggles the desktop menu even after receiving focus", async (pointerType, detail) => {
  const trigger = byId("nav-tours-air");
  await act(async () => trigger.focus());
  await dispatch(trigger, "click", pointerType, detail);
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  await dispatch(trigger, "click", pointerType, detail);
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
});

test("mobile tour sections expand and collapse independently", async () => {
  await dispatch(byId("mobile-menu-open"), "click", "touch");
  const air = byId("mobile-nav-tours-toggle-air");
  await dispatch(air, "click", "touch");
  expect(air.getAttribute("aria-expanded")).toBe("true");
  expect(container.querySelectorAll('#mobile-tours-air a')).toHaveLength(20);
  await dispatch(air, "click", "touch");
  expect(air.getAttribute("aria-expanded")).toBe("false");
  expect(container.querySelector('#mobile-tours-air')).toBeNull();
});

test.each(["bus", "air"])("%s destinations are bold in desktop and mobile menus without changing link names", async (type) => {
  await dispatch(byId(`nav-tours-${type}`), "click");
  let link = byId(`desktop-tour-list-${type}`).querySelector(`a[href="/tours/${type}-0"]`);
  expect(link.querySelector("strong").textContent).toBe("Минска");
  expect(link.textContent).toBe("Длинное название тура из Минска на праздники — программа 1");
  expect(link.querySelectorAll("a")).toHaveLength(0);
  await dispatch(byId("mobile-menu-open"), "click", "touch");
  await dispatch(byId(`mobile-nav-tours-toggle-${type}`), "click", "touch");
  link = container.querySelector(`#mobile-tours-${type} a[href="/tours/${type}-0"]`);
  expect(link.querySelector("strong").textContent).toBe("Минска");
  expect(link.textContent).not.toContain("**");
});
