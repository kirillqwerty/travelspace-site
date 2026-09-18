import { normalizeRecord } from "./AdminCollection";

jest.mock("react-router-dom", () => ({ Link: () => null }), { virtual: true });

test("tour editor preserves shared hotel fields, revision and room pricing", () => {
  const record = {
    id: "tour-1", title: "Грузия", _hotels_revision: "revision-from-server", use_hotel_chains: true,
    chains: [{ id: "chain-1", dates: [{ id: "date-1", start: "01.06.2099", end: "10.06.2099" }], hotels: [{
      id: "hotel-1", name: "Smile", hotel_slug: "smile", hotel_page_slug: "smile",
      nearby: ["Пляж"], amenities: ["Wi-Fi"], location_description: "У моря", rules: "Заезд с паспортом",
      page_enabled: false, seo_title: "Smile Hotel", youtube_url: "dQw4w9WgXcQ",
      rooms: [{ id: "room-1", title: "Стандарт", gallery: ["/uploads/room.webp"], gallery_alts: ["Номер"],
        date_prices: [{ date_id: "date-1", price: 500, currency: "USD" }], unavailable_dates: ["date-1"] }],
    }] }],
  };
  const result = normalizeRecord(record, "tours");
  const hotel = result.chains[0].hotels[0];
  expect(result._hotels_revision).toBe("revision-from-server");
  expect(hotel).toMatchObject({ hotel_slug: "smile", nearby: ["Пляж"], amenities: ["Wi-Fi"], rules: "Заезд с паспортом", page_enabled: false, seo_title: "Smile Hotel", youtube_url: "dQw4w9WgXcQ" });
  expect(hotel.rooms[0].date_prices[0]).toMatchObject({ date_id: "date-1", price: 500, currency: "USD" });
  expect(hotel.rooms[0].unavailable_dates).toEqual(["date-1"]);
});
