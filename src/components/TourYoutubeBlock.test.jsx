import { act } from "react";
import { createRoot } from "react-dom/client";
import TourYoutubeBlock from "./TourYoutubeBlock";

let container;
let root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

test.each(["", "https://example.com/watch?v=dQw4w9WgXcQ", "<script>alert(1)</script>"])(
  "hides the whole video section for missing or invalid input: %s", async (value) => {
    await act(async () => root.render(<TourYoutubeBlock value={value} title="Видео путешествия" />));
    expect(container.childElementCount).toBe(0);
  },
);

test("accepts iframe code without injecting its HTML and creates a player only on click", async () => {
  const value = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" onload="alert(1)"></iframe>';
  await act(async () => root.render(<TourYoutubeBlock value={value} title="Наш маршрут" />));
  expect(container.querySelector("h2").textContent).toBe("Наш маршрут");
  expect(container.querySelector("iframe")).toBeNull();
  await act(async () => container.querySelector("button").click());
  const player = container.querySelector("iframe");
  expect(player.src).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  expect(player.title).toBe("Наш маршрут");
  expect(player.hasAttribute("onload")).toBe(false);
});

test("resets the player when the video changes and removes the section when cleared", async () => {
  await act(async () => root.render(<TourYoutubeBlock value="dQw4w9WgXcQ" />));
  await act(async () => container.querySelector("button").click());
  await act(async () => root.render(<TourYoutubeBlock value="M7lc1UVf-VE" />));
  expect(container.querySelector("iframe")).toBeNull();
  expect(container.querySelector("img").src).toContain("M7lc1UVf-VE");
  await act(async () => root.render(<TourYoutubeBlock value="" title="Сохранённый заголовок" />));
  expect(container.childElementCount).toBe(0);
});
