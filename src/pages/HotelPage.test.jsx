import { act } from "react";
import { createRoot } from "react-dom/client";
import HotelPage from "./HotelPage";
import { usePublicRecord } from "@/lib/usePublicRecord";

jest.mock("@/lib/usePublicRecord", () => ({ usePublicRecord: jest.fn() }));
jest.mock("@/components/PageSeo", () => () => null);
jest.mock("react-router-dom", () => ({
  useParams: () => ({ slug: "smile" }),
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
}), { virtual: true });

const hotel = {
  id: "hotel-1", slug: "smile", name: "Smile",
  images: ["/uploads/one.webp", "/uploads/two.webp"],
  image_alts: ["Первое фото", "Второе фото"], rooms: [],
  connections: [
    { id: "tour-1~chain-1", tour_id: "tour-1", tour_slug: "piter", tour_title: "Петербург на 5 дней", tour_hotel_anchor: "hotel-hotel-1", dates: [{ id: "d1", start: "2099-01-01", end: "2099-01-05" }] },
    { id: "tour-2~chain-2", tour_id: "tour-2", tour_slug: "new-year", tour_title: "Новый год в Петербурге", tour_hotel_anchor: "hotel-hotel-1", dates: [{ id: "d2", start: "2099-12-29", end: "2100-01-03" }] },
  ],
};

let container;
let root;
beforeEach(async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  usePublicRecord.mockReturnValue({ record: hotel, notFound: false, failed: false, retry: jest.fn() });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<HotelPage />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

test("hotel page switches connected tours without requesting data again", async () => {
  expect(container.textContent).toContain("Петербург на 5 дней");
  expect(container.textContent).toContain("01.01.2099 — 05.01.2099");
  const option = [...container.querySelectorAll("button")].find((button) => button.textContent.includes("Новый год в Петербурге"));
  await act(async () => option.click());
  expect([...container.querySelectorAll("a")].some((link) => link.getAttribute("href") === "/tours/new-year#hotel-hotel-1")).toBe(true);
});

test("standalone gallery has working previous and next controls", async () => {
  expect(container.querySelector('img[alt="Первое фото"]')).not.toBeNull();
  const next = container.querySelector('button[aria-label="Следующее фото"]');
  const previous = container.querySelector('button[aria-label="Предыдущее фото"]');
  expect(previous).not.toBeNull();
  await act(async () => next.click());
  expect(container.querySelector('img[alt="Второе фото"]')).not.toBeNull();
});
