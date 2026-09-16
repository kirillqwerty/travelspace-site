export const COOKIE_CONSENT_KEY = "tury_cookie_accepted_v1";
export const PENDING_LEAD_CONVERSION_KEY = "tury_pending_lead_conversion_v1";
export const SENT_LEAD_CONVERSION_CHANNELS_KEY =
  "tury_sent_lead_conversion_channels_v1";
export const GOOGLE_ADS_PHONE_CONVERSION_DESTINATION =
  "AW-17966527099/w5DECJS7yyYcEPvkjfdC";

const PENDING_LEAD_TTL_MS = 30 * 60 * 1000;
const SENT_LEAD_TTL_MS = 24 * 60 * 60 * 1000;

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

function safeSessionStorage() {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function readCookie(name) {
  if (typeof document === "undefined" || !document.cookie) return null;

  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.slice(name.length + 1));
}

function saveAttributionValue(key, value) {
  const storage = safeLocalStorage();
  if (!storage || !value) return;

  storage.setItem(`attr_${key}`, value);
  if (!storage.getItem(`first_${key}`)) {
    storage.setItem(`first_${key}`, value);
  }
}

function buildFbcFromFbclid(fbclid) {
  if (!fbclid) return null;
  return `fb.1.${Date.now()}.${fbclid}`;
}

function normalizeLeadConversionPayload(payload = {}) {
  return {
    eventId: payload.eventId || payload.event_id || createEventId("lead"),
    tourTitle:
      payload.tourTitle || payload.tour_title || payload.content_name || null,
    tourSlug:
      payload.tourSlug || payload.tour_slug || payload.content_id || null,
    formType: payload.formType || payload.form_type || "lead",
  };
}

function readSentLeadStates() {
  const storage = safeSessionStorage();
  if (!storage) return {};

  const raw = storage.getItem(SENT_LEAD_CONVERSION_CHANNELS_KEY);
  if (!raw) return {};

  try {
    const states = JSON.parse(raw) || {};
    const now = Date.now();
    let changed = false;

    Object.entries(states).forEach(([eventId, value]) => {
      if (!value?.createdAt || now - value.createdAt > SENT_LEAD_TTL_MS) {
        delete states[eventId];
        changed = true;
      }
    });

    if (changed) {
      storage.setItem(
        SENT_LEAD_CONVERSION_CHANNELS_KEY,
        JSON.stringify(states),
      );
    }

    return states;
  } catch {
    storage.removeItem(SENT_LEAD_CONVERSION_CHANNELS_KEY);
    return {};
  }
}

function writeSentLeadStates(states) {
  const storage = safeSessionStorage();
  if (!storage) return;
  storage.setItem(SENT_LEAD_CONVERSION_CHANNELS_KEY, JSON.stringify(states));
}

function getSentLeadChannels(eventId) {
  if (!eventId) return {};
  return readSentLeadStates()[eventId]?.channels || {};
}

function markLeadChannelSent(eventId, channel) {
  if (!eventId || !channel) return;

  const states = readSentLeadStates();
  const current = states[eventId] || { createdAt: Date.now(), channels: {} };

  states[eventId] = {
    ...current,
    createdAt: current.createdAt || Date.now(),
    channels: {
      ...(current.channels || {}),
      [channel]: true,
    },
  };

  writeSentLeadStates(states);
}

function getConfiguredLeadChannels() {
  if (typeof window === "undefined") return [];

  const channels = [];

  if (window.__TRAVELSPACE_GTM_CONFIGURED) {
    channels.push("dataLayer");
  }

  if (
    window.__TRAVELSPACE_GA_CONFIGURED &&
    !window.__TRAVELSPACE_GTM_CONFIGURED
  ) {
    channels.push("ga");
  }

  if (window.__TRAVELSPACE_YANDEX_METRIKA_CONFIGURED) {
    channels.push("yandex");
  }

  if (window.__TRAVELSPACE_META_PIXEL_CONFIGURED) {
    channels.push("meta");
  }

  if (window.__TRAVELSPACE_TIKTOK_PIXEL_CONFIGURED) {
    channels.push("tiktok");
  }

  return channels;
}

function isLeadConversionComplete(eventId) {
  if (!eventId) return false;

  const sentChannels = getSentLeadChannels(eventId);
  const configuredChannels = getConfiguredLeadChannels();

  return configuredChannels.every((channel) => sentChannels[channel]);
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
    saveAttributionValue(key, value);
  });

  const fbpCookie = readCookie("_fbp");
  const fbcCookie = readCookie("_fbc");
  const fbclidParam = params.get("fbclid");
  const storedFbclid = storage.getItem("attr_fbclid");

  saveAttributionValue("fbp", fbpCookie);
  saveAttributionValue(
    "fbc",
    fbcCookie ||
      buildFbcFromFbclid(fbclidParam) ||
      storage.getItem("attr_fbc") ||
      buildFbcFromFbclid(storedFbclid),
  );

  if (!storage.getItem("attr_landing_page")) {
    storage.setItem(
      "attr_landing_page",
      window.location.pathname + window.location.search,
    );
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
    const value =
      storage.getItem(`attr_${key}`) || storage.getItem(`first_${key}`);
    if (value) result[key] = value;
  });

  return result;
}

export function getAttribution() {
  initAttribution();

  const storage = safeLocalStorage();
  const clickIds = readStoredObject(CLICK_ID_KEYS);
  const fbpCookie = readCookie("_fbp");
  const fbcCookie = readCookie("_fbc");

  if (fbpCookie) clickIds.fbp = fbpCookie;
  if (fbcCookie) clickIds.fbc = fbcCookie;

  return {
    utm: readStoredObject(UTM_KEYS),
    click_ids: clickIds,
    landing_page: storage?.getItem("attr_landing_page") || null,
    referrer: storage?.getItem("attr_referrer") || null,
  };
}

export function createEventId(prefix = "evt") {
  const cryptoApi = typeof window !== "undefined" ? window.crypto : null;

  if (cryptoApi?.randomUUID) {
    return `${prefix}_${cryptoApi.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function savePendingLeadConversion(payload = {}) {
  const storage = safeSessionStorage();
  if (!storage) return;

  storage.setItem(
    PENDING_LEAD_CONVERSION_KEY,
    JSON.stringify({
      ...normalizeLeadConversionPayload(payload),
      createdAt: Date.now(),
    }),
  );
}

export function getPendingLeadConversion() {
  const storage = safeSessionStorage();
  if (!storage) return null;

  const raw = storage.getItem(PENDING_LEAD_CONVERSION_KEY);
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw);

    if (
      !payload?.createdAt ||
      Date.now() - payload.createdAt > PENDING_LEAD_TTL_MS
    ) {
      storage.removeItem(PENDING_LEAD_CONVERSION_KEY);
      return null;
    }

    return normalizeLeadConversionPayload(payload);
  } catch {
    storage.removeItem(PENDING_LEAD_CONVERSION_KEY);
    return null;
  }
}

export function clearPendingLeadConversion() {
  safeSessionStorage()?.removeItem(PENDING_LEAD_CONVERSION_KEY);
}

export function consumePendingLeadConversion() {
  const payload = getPendingLeadConversion();
  if (payload) clearPendingLeadConversion();
  return payload;
}

export function canSendBrowserLeadConversion() {
  if (typeof window === "undefined") return false;

  return Boolean(
    window.__TRAVELSPACE_MARKETING_SETTINGS_READY ||
    window.fbq ||
    window.ttq ||
    window.ym,
  );
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
  } else if (window.__TRAVELSPACE_YANDEX_METRIKA_CONFIGURED) {
    window.__TRAVELSPACE_PENDING_YANDEX_EVENTS =
      window.__TRAVELSPACE_PENDING_YANDEX_EVENTS || [];
    window.__TRAVELSPACE_PENDING_YANDEX_EVENTS.push({ eventName, payload });
  }
}

export function trackPhoneClick({ phone, linkText, placement } = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    phone_number: phone || null,
    link_text: linkText || null,
    placement: placement || null,
    page_path: window.location.pathname + window.location.search,
    page_location: window.location.href,
  };

  // Sends the phone_click event to dataLayer and the same-named goal to
  // Yandex Metrika. The goal identifier in Metrika must be "phone_click".
  trackEvent("phone_click", payload);

  // The site already owns the Google tag. Only send its Ads event snippet;
  // do not install another global tag for the AW destination.
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function queueGoogleTagCommand() {
      window.dataLayer.push(arguments);
    };
  window.gtag("event", "conversion", {
    send_to: GOOGLE_ADS_PHONE_CONVERSION_DESTINATION,
  });
}

export function trackPageView({ path, title }) {
  const payload = {
    page_path: path,
    page_location:
      typeof window !== "undefined" ? window.location.href : undefined,
    page_title:
      title || (typeof document !== "undefined" ? document.title : undefined),
  };

  trackEvent("page_view", payload);

  if (typeof window === "undefined") return;

  // Do not send Meta/TikTok PageView on SPA route changes.
  // Otherwise a form submit can be counted twice: Lead + URL-based /thanks conversion.
  if (window.gtag) {
    window.gtag("event", "page_view", payload);
  }
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

  if (typeof window === "undefined") return;

  if (window.fbq) {
    window.fbq("track", "ViewContent", {
      content_type: "tour",
      content_name: tour.title,
      content_ids: [tour.slug],
    });
  }

  if (window.ttq) {
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

  if (typeof window === "undefined") return false;

  const sentChannels = getSentLeadChannels(eventId);

  if (!sentChannels.dataLayer) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "lead_submit",
      ...payload,
    });
    markLeadChannelSent(eventId, "dataLayer");
  }

  if (!sentChannels.ga && window.gtag) {
    window.gtag("event", "lead_submit", payload);
    markLeadChannelSent(eventId, "ga");
  }

  if (!sentChannels.yandex && window.ym && window.__YANDEX_METRIKA_ID) {
    window.ym(window.__YANDEX_METRIKA_ID, "reachGoal", "lead_submit", payload);
    markLeadChannelSent(eventId, "yandex");
  }

  if (!sentChannels.meta && window.fbq) {
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
    markLeadChannelSent(eventId, "meta");
  }

  if (!sentChannels.tiktok && window.ttq) {
    window.ttq.track("SubmitForm", {
      event_id: eventId,
      content_type: tourSlug ? "tour" : "lead",
      content_name: tourTitle,
      content_id: tourSlug,
    });
    markLeadChannelSent(eventId, "tiktok");
  }

  return isLeadConversionComplete(eventId);
}
