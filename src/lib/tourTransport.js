export const TOUR_TRANSPORT_TYPES = {
  BUS: "bus",
  AIR: "air",
};

export const TOUR_TRANSPORT_OPTIONS = [
  {
    value: TOUR_TRANSPORT_TYPES.BUS,
    label: "Автобусные туры",
    singularLabel: "Автобусный тур",
    anchor: "avtobusnie-tury",
  },
  {
    value: TOUR_TRANSPORT_TYPES.AIR,
    label: "Авиа туры",
    singularLabel: "Авиа тур",
    anchor: "avia-tury",
  },
];

export function getTourTransportType(tour) {
  const value = String(
    tour?.transport_type || tour?.transportType || "",
  ).toLowerCase();

  return value === TOUR_TRANSPORT_TYPES.AIR
    ? TOUR_TRANSPORT_TYPES.AIR
    : TOUR_TRANSPORT_TYPES.BUS;
}

export function getTransportFromHash(hash = "") {
  return String(hash).toLowerCase() === "#avia-tury"
    ? TOUR_TRANSPORT_TYPES.AIR
    : TOUR_TRANSPORT_TYPES.BUS;
}

export function getTourSectionAnchor(transportType) {
  return transportType === TOUR_TRANSPORT_TYPES.AIR
    ? "avia-tury"
    : "avtobusnie-tury";
}

export function getTourSectionPath(transportType) {
  return `/#${getTourSectionAnchor(transportType)}`;
}

export function getTourLandingPath(transportType) {
  return transportType === TOUR_TRANSPORT_TYPES.AIR
    ? "/tours/avia-iz-minska"
    : "/tours/avtobusnye-iz-minska";
}
