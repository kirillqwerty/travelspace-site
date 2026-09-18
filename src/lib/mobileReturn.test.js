import { installMobileReturnNavigation, readMobileReturn } from "./mobileReturn";

const originalMatchMedia = window.matchMedia;
let remove, link;
beforeEach(() => {
  window.sessionStorage.clear();
  window.matchMedia = () => ({ matches: false });
  window.history.replaceState(null, "", "/tours/georgia#program");
  remove = installMobileReturnNavigation();
  link = document.createElement("a");
  link.href = "/blog/park";
  document.body.append(link);
});
afterEach(() => {
  remove(); link.remove();
  window.matchMedia = originalMatchMedia;
  window.history.replaceState(null, "", "/");
  window.sessionStorage.clear();
});
const click = (props = {}) => {
  // Cancel the test browser's default navigation after capture recorded it.
  link.addEventListener("click", (event) => event.preventDefault(), { once: true });
  link.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, ...props }));
};

test("mobile captures the originating tour, including its anchor, across documents", () => {
  click();
  expect(readMobileReturn(new URL("/blog/park", window.location.origin).href)).toBe("/tours/georgia#program");
  expect(readMobileReturn(new URL("/blog/other", window.location.origin).href)).toBeNull();
});

test("several linked pages retain their return paths without cycling on the back control", () => {
  click();
  window.history.replaceState(null, "", "/blog/park");
  link.href = "/blog/museum";
  click();
  expect(readMobileReturn(new URL("/blog/museum", window.location.origin).href)).toBe("/blog/park");
  link.href = "/tours/georgia#program";
  link.dataset.navigationBack = "history";
  click();
  expect(readMobileReturn(new URL("/blog/park", window.location.origin).href)).toBe("/tours/georgia#program");
  expect(readMobileReturn(new URL("/tours/georgia", window.location.origin).href)).toBeNull();
});

test.each(["desktop", "blank", "download", "external", "modified", "anchor"])("does not capture %s navigation", (kind) => {
  if (kind === "desktop") window.matchMedia = () => ({ matches: true });
  if (kind === "blank") link.target = "_blank";
  if (kind === "download") link.setAttribute("download", "");
  if (kind === "external") link.href = "https://example.org/park";
  if (kind === "anchor") link.href = "#dates-prices";
  click(kind === "modified" ? { ctrlKey: true } : {});
  expect(window.sessionStorage.getItem("travelspace-mobile-return")).toBeNull();
});

test("expired and invalid external return destinations are ignored", () => {
  const to = new URL("/blog/park", window.location.origin).href;
  window.sessionStorage.setItem("travelspace-mobile-return", JSON.stringify({
    "/blog/park": { from: "https://example.org/", to, time: Date.now() },
  }));
  expect(readMobileReturn(to)).toBeNull();
  window.sessionStorage.setItem("travelspace-mobile-return", JSON.stringify({
    "/blog/park": { from: new URL("/tours/georgia", window.location.origin).href, to, time: Date.now() - 3 * 60 * 60 * 1000 },
  }));
  expect(readMobileReturn(to)).toBeNull();
});
