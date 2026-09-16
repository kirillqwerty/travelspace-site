import {
  getTourTransportType,
  TOUR_TRANSPORT_TYPES,
} from "@/lib/tourTransport";

const FIRST_PHONE_DESTINATIONS = [
  "грузи",
  "кобул",
  "абхаз",
  "осети",
  "дагест",
];

const SECOND_PHONE_DESTINATIONS = [
  "петербург",
  "питер",
  "карел",
  "аркти",
  "мурман",
  "москв",
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е");
}

function tourSearchText(tour) {
  return [
    tour?.slug,
    tour?.title,
    tour?.region_slug,
    tour?.region_name,
    tour?.direction_name,
  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" ");
}

export function normalizePhoneForTel(value) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/[^\d]/g, "");

  if (!digits) return "";
  if (digits.startsWith("375") && digits.length === 12) return `+${digits}`;
  if (digits.length === 7) return `+37529${digits}`;
  if (digits.length === 9 && digits.startsWith("29")) return `+375${digits}`;
  if (raw.startsWith("+") || digits.length >= 10) return `+${digits}`;
  return digits;
}

export function getCurrentTourFromPath(tours = [], pathname = "") {
  const match = String(pathname).match(/^\/tours\/([^/]+)\/?$/);
  if (!match) return null;

  let slug = match[1];
  try {
    slug = decodeURIComponent(slug);
  } catch {
    // Keep the original slug when the URL contains malformed escaping.
  }

  return (Array.isArray(tours) ? tours : []).find(
    (tour) => String(tour?.slug || "") === slug,
  ) || null;
}

export function getPhoneForTour(tour, configuredPhones = []) {
  if (!tour) return null;

  const phones = (Array.isArray(configuredPhones) ? configuredPhones : []).filter(
    (item) => item?.link || item?.phone,
  );
  if (!phones.length) return null;

  const text = tourSearchText(tour);
  const matchingDestinationKeywords = [
    ...FIRST_PHONE_DESTINATIONS,
    ...SECOND_PHONE_DESTINATIONS,
  ].filter((keyword) => text.includes(keyword));
  const phoneMatchedByLabel = phones.find((item) => {
    const label = normalizeText(item.label);
    return matchingDestinationKeywords.some((keyword) =>
      label.includes(keyword),
    );
  });
  if (phoneMatchedByLabel) {
    const phone = normalizePhoneForTel(
      phoneMatchedByLabel.link || phoneMatchedByLabel.phone,
    );
    return phone ? { ...phoneMatchedByLabel, tel: phone } : null;
  }

  if (getTourTransportType(tour) === TOUR_TRANSPORT_TYPES.AIR) {
    const airPhone = phones.find((item) =>
      normalizeText(item.label).includes("авиа"),
    );
    if (airPhone) {
      const phone = normalizePhoneForTel(airPhone.link || airPhone.phone);
      return phone ? { ...airPhone, tel: phone } : null;
    }
  }

  let preferredIndex = 0;

  if (SECOND_PHONE_DESTINATIONS.some((keyword) => text.includes(keyword))) {
    preferredIndex = 1;
  } else if (
    FIRST_PHONE_DESTINATIONS.some((keyword) => text.includes(keyword))
  ) {
    preferredIndex = 0;
  } else if (getTourTransportType(tour) === TOUR_TRANSPORT_TYPES.AIR) {
    preferredIndex = 1;
  }

  const selected = phones[preferredIndex] || phones[0];
  const phone = normalizePhoneForTel(selected.link || selected.phone);
  return phone ? { ...selected, tel: phone } : null;
}
