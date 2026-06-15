export function isTourShownInCatalog(tour) {
  if (!tour) return false;

  return !(
    tour.hidden === true ||
    tour.hide_from_catalog === true ||
    tour.catalog_hidden === true ||
    tour.show_in_catalog === false ||
    tour.visible === false
  );
}
