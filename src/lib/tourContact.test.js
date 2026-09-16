import {
  getCurrentTourFromPath,
  getPhoneForTour,
  normalizePhoneForTel,
} from "./tourContact";

const phones = [
  { label: "Грузия, Абхазия, Осетия", phone: "636-99-11", link: "6369911" },
  { label: "Питер, Арктика, Карелия", phone: "636-22-99", link: "6362299" },
];

test("finds an actual tour only on a tour detail URL", () => {
  const tours = [{ slug: "avtobusniy-tur-v-kareliyu", title: "Карелия" }];
  expect(
    getCurrentTourFromPath(tours, "/tours/avtobusniy-tur-v-kareliyu"),
  ).toBe(tours[0]);
  expect(getCurrentTourFromPath(tours, "/tours")).toBeNull();
  expect(getCurrentTourFromPath(tours, "/tours/kareliya")).toBeNull();
});

test("routes tour destinations to the corresponding manager phone", () => {
  expect(getPhoneForTour({ title: "Тур в Грузию" }, phones).tel).toBe(
    "+375296369911",
  );
  expect(getPhoneForTour({ title: "Тур в Северную Осетию" }, phones).tel).toBe(
    "+375296369911",
  );
  expect(getPhoneForTour({ title: "Тур в Карелию" }, phones).tel).toBe(
    "+375296362299",
  );
  expect(getPhoneForTour({ title: "Тур в Арктику" }, phones).tel).toBe(
    "+375296362299",
  );
  expect(getPhoneForTour({ title: "Тур в Карелию" }, [...phones].reverse()).tel).toBe(
    "+375296362299",
  );
});

test("routes an unknown air tour to the air manager", () => {
  expect(
    getPhoneForTour({ title: "Турция", transport_type: "air" }, phones).tel,
  ).toBe("+375296362299");
});

test("normalizes local Belarus phone values for tel links", () => {
  expect(normalizePhoneForTel("636-99-11")).toBe("+375296369911");
  expect(normalizePhoneForTel("+375 29 636-22-99")).toBe("+375296362299");
});
