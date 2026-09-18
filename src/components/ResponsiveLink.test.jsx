import { act } from "react";
import { createRoot } from "react-dom/client";
import ResponsiveLink from "./ResponsiveLink";
import { RichText } from "@/lib/richText";

let container, root, desktop, listeners, originalMatchMedia;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  desktop = true;
  listeners = new Set();
  originalMatchMedia = window.matchMedia;
  window.matchMedia = () => ({
    get matches() { return desktop; },
    addEventListener: (_event, listener) => listeners.add(listener),
    removeEventListener: (_event, listener) => listeners.delete(listener),
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  window.matchMedia = originalMatchMedia;
});

test("desktop opens a new tab securely; mobile and resizing retain the same page", async () => {
  await act(async () => root.render(<ResponsiveLink href="/hotels/smile" target="_blank">Отель</ResponsiveLink>));
  const link = container.querySelector("a");
  expect(link.target).toBe("_blank");
  expect(link.rel.split(" ")).toEqual(expect.arrayContaining(["noopener", "noreferrer"]));
  await act(async () => { desktop = false; listeners.forEach((listener) => listener()); });
  expect(link.hasAttribute("target")).toBe(false);
  expect(link.href).toContain("/hotels/smile");
  await act(async () => { desktop = true; listeners.forEach((listener) => listener()); });
  expect(link.target).toBe("_blank");
});

test("router links retain route props, anchors and application links never open tabs", async () => {
  const RouterLink = ({ to, ...props }) => <a href={to} {...props} />;
  await act(async () => root.render(<>
    <ResponsiveLink as={RouterLink} to="/hotels/smile" target="_blank">Отель</ResponsiveLink>
    <ResponsiveLink href="#program" target="_blank">Программа</ResponsiveLink>
    <ResponsiveLink href="tel:+375291234567" target="_blank">Позвонить</ResponsiveLink>
    <ResponsiveLink href="/tours">Туры</ResponsiveLink>
  </>));
  const links = container.querySelectorAll("a");
  expect(links[0].getAttribute("href")).toBe("/hotels/smile");
  expect(links[0].target).toBe("_blank");
  expect([...links].slice(1).every((link) => !link.hasAttribute("target"))).toBe(true);
});

test("links from admin-authored rich text follow the same device rule", async () => {
  desktop = false;
  await act(async () => root.render(<RichText text="[О программе](/tours/georgia#program)" />));
  expect(container.querySelector("a").hasAttribute("target")).toBe(false);
  await act(async () => { desktop = true; listeners.forEach((listener) => listener()); });
  expect(container.querySelector("a").target).toBe("_blank");
});
