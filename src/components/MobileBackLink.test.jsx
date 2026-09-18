import { act } from "react";
import { createRoot } from "react-dom/client";
import MobileBackLink from "./MobileBackLink";

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/blog/park", search: "" }),
  Link: ({ to, onClick, children, ...props }) => <a href={to} {...props} onClick={(event) => { event.preventDefault(); onClick?.(event); }}>{children}</a>,
}), { virtual: true });

let root, container, back, referrer;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.sessionStorage.clear();
  window.history.pushState({ idx: 0 }, "", "/blog/park");
  back = jest.spyOn(window.history, "back").mockImplementation(() => {});
  referrer = jest.spyOn(document, "referrer", "get").mockReturnValue("");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove(); back.mockRestore(); referrer.mockRestore();
  window.sessionStorage.clear();
  window.history.replaceState(null, "", "/");
});
const saveReturn = () => window.sessionStorage.setItem("travelspace-mobile-return", JSON.stringify({
  "/blog/park": { from: new URL("/tours/georgia#program", window.location.origin).href,
    to: new URL("/blog/park", window.location.origin).href, time: Date.now() },
}));
const render = async () => act(async () => root.render(<MobileBackLink fallback="/blog" label="Вернуться в блог" />));

test("direct visits return to the parent section in the same tab", async () => {
  await render();
  expect(container.querySelector("a").getAttribute("href")).toBe("/blog");
  expect(container.querySelector("a").hasAttribute("target")).toBe(false);
});

test("a noreferrer document returns to the exact source URL rather than an unrelated browser entry", async () => {
  saveReturn(); await render();
  const link = container.querySelector("a");
  expect(link.getAttribute("href")).toBe("/tours/georgia#program");
  expect(link.dataset.navigationBack).toBe("true");
  await act(async () => link.click());
  expect(back).not.toHaveBeenCalled();
});

test.each(["router", "referrer"])("%s navigation uses browser back and retains the source scroll position", async (kind) => {
  saveReturn();
  if (kind === "router") window.history.replaceState({ idx: 1 }, "", "/blog/park");
  else referrer.mockReturnValue(new URL("/tours/georgia", window.location.origin).href);
  await render();
  const link = container.querySelector("a");
  expect(link.dataset.navigationBack).toBe("history");
  await act(async () => link.click());
  expect(back).toHaveBeenCalledTimes(1);
});
