import { isTourShownInCatalog } from "./tourVisibility";

export function upcomingTourDates(tour, today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Minsk" })) {
  const dates = tour.use_hotel_chains
    ? (tour.chains || []).filter((chain) => chain.active !== false).flatMap((chain) => chain.dates || [])
    : [...(tour.dates || []), ...(tour.chains || []).filter((chain) => chain.active !== false).flatMap((chain) => chain.dates || [])];
  return dates.filter((date) => date.status !== "hidden" && date.status !== "sold_out" && String(date.start || "").slice(0, 10) >= today).sort((a, b) => String(a.start).localeCompare(String(b.start)));
}

export function selectTravelLinksTours(tours = [], config = {}, today) {
  const visible = tours.filter((tour) => tour.active !== false && isTourShownInCatalog(tour));
  if (Array.isArray(config.tour_slugs)) {
    const bySlug = new Map(visible.map((tour) => [tour.slug, tour]));
    return [...new Set(config.tour_slugs)].map((slug) => bySlug.get(slug)).filter(Boolean);
  }
  return visible.filter((tour) => upcomingTourDates(tour, today).length).sort((a, b) => {
    const dateOrder = String(upcomingTourDates(a, today)[0].start).localeCompare(String(upcomingTourDates(b, today)[0].start));
    return dateOrder || Number(a.sort_order ?? a.order ?? 9999) - Number(b.sort_order ?? b.order ?? 9999);
  });
}
