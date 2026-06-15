export const COOKIE_CONSENT_KEY = "tury_cookie_accepted_v1";

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "yclid",
  "fbclid",
  "ttclid",
  "fbp",
  "fbc",
];

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
];

const CLICK_ID_KEYS = ["gclid", "yclid", "fbclid", "ttclid", "fbp", "fbc"];

function safeLocalStorage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function hasMarketingConsent() {
  return safeLocalStorage()?.getItem(COOKIE_CONSENT_KEY) === "1";
}

export function grantMarketingConsent() {
  const storage = safeLocalStorage();
  if (!storage) return;
  storage.setItem(COOKIE_CONSENT_KEY, "1");
  window.dispatchEvent(new Event("cookie-consent-changed"));
}

export function initAttribution() {
  if (typeof window === "undefined") return;
  const storage = safeLocalStorage();
  if (!storage) return;

  const params = new URLSearchParams(window.location.search);
  ATTRIBUTION_KEYS.forEach((key) => {
    const value = params.get(key);
    if (!value) return;
    storage.setItem(`attr_${key}`, value);
    if (!storage.getItem(`first_${key}`)) {
      storage.setItem(`first_${key}`, value);
    }
  });

  if (!storage.getItem("attr_landing_page")) {
    storage.setItem("attr_landing_page", window.location.pathname + window.location.search);
  }
  if (document.referrer && !storage.getItem("attr_referrer")) {
    storage.setItem("attr_referrer", document.referrer);
  }
}

function readStoredObject(keys) {
  const storage = safeLocalStorage();
  const result = {};
  if (!storage) return result;

  keys.forEach((key) => {
    const value = storage.getItem(`attr_${key}`) || storage.getItem(`first_${key}`);
    if (value) result[key] = value;
  });

  return result;
}

export function getAttribution() {
  const storage = safeLocalStorage();
  return {
    utm: readStoredObject(UTM_KEYS),
    click_ids: readStoredObject(CLICK_ID_KEYS),
    landing_page: storage?.getItem("attr_landing_page") || null,
    referrer: storage?.getItem("attr_referrer") || null,
  };
}

export function createEventId(prefix = "evt") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function trackEvent(eventName, payload = {}) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...payload,
  });

  if (window.ym && window.__YANDEX_METRIKA_ID) {
    window.ym(window.__YANDEX_METRIKA_ID, "reachGoal", eventName, payload);
  }
}

export function trackPageView({ path, title }) {
  trackEvent("page_view", {
    page_path: path,
    page_location: typeof window !== "undefined" ? window.location.href : undefined,
    page_title: title || (typeof document !== "undefined" ? document.title : undefined),
  });
}

export function trackTourView(tour) {
  if (!tour) return;
  trackEvent("tour_view", {
    content_type: "tour",
    tour_slug: tour.slug,
    tour_title: tour.title,
    content_name: tour.title,
    content_id: tour.slug,
  });

  if (hasMarketingConsent() && window.fbq) {
    window.fbq("track", "ViewContent", {
      content_type: "tour",
      content_name: tour.title,
      content_ids: [tour.slug],
    });
  }

  if (hasMarketingConsent() && window.ttq) {
    window.ttq.track("ViewContent", {
      content_type: "tour",
      content_name: tour.title,
      content_id: tour.slug,
    });
  }
}

export function trackLeadSubmit({ eventId, tourTitle, tourSlug, formType }) {
  const payload = {
    event_id: eventId,
    form_type: formType,
    content_type: tourSlug ? "tour" : "lead",
    content_name: tourTitle,
    content_id: tourSlug,
  };

  trackEvent("lead_submit", payload);

  if (hasMarketingConsent() && window.fbq) {
    window.fbq(
      "track",
      "Lead",
      {
        content_name: tourTitle,
        content_category: formType || "lead",
        content_ids: tourSlug ? [tourSlug] : [],
      },
      { eventID: eventId },
    );
  }

  if (hasMarketingConsent() && window.ttq) {
    window.ttq.track("SubmitForm", {
      event_id: eventId,
      content_type: tourSlug ? "tour" : "lead",
      content_name: tourTitle,
      content_id: tourSlug,
    });
  }
}
