import {
  GOOGLE_ADS_PHONE_CONVERSION_DESTINATION,
  trackPhoneClick,
} from "./analytics";

test("sends a phone click to Yandex Metrika and Google Ads", () => {
  window.history.replaceState({}, "", "/tours/kareliya?utm_source=yandex");
  window.dataLayer = [];
  window.__YANDEX_METRIKA_ID = 44886274;
  window.ym = jest.fn();
  window.gtag = jest.fn();

  trackPhoneClick({
    phone: "+375296369911",
    linkText: "636-99-11",
    placement: "footer",
  });

  const expectedPayload = {
    phone_number: "+375296369911",
    link_text: "636-99-11",
    placement: "footer",
    page_path: "/tours/kareliya?utm_source=yandex",
  };

  expect(window.dataLayer[0]).toEqual(
    expect.objectContaining({ event: "phone_click", ...expectedPayload }),
  );
  expect(window.ym).toHaveBeenCalledWith(
    44886274,
    "reachGoal",
    "phone_click",
    expect.objectContaining(expectedPayload),
  );
  expect(window.gtag).toHaveBeenCalledWith(
    "event",
    "conversion",
    { send_to: GOOGLE_ADS_PHONE_CONVERSION_DESTINATION },
  );

  delete window.ym;
  delete window.gtag;
  delete window.__YANDEX_METRIKA_ID;
  delete window.dataLayer;
  window.history.replaceState({}, "", "/");
});

test("keeps a phone goal queued until deferred Yandex Metrika loads", () => {
  window.dataLayer = [];
  window.__TRAVELSPACE_YANDEX_METRIKA_CONFIGURED = true;
  delete window.ym;

  trackPhoneClick({
    phone: "+375296369911",
    linkText: "636-99-11",
    placement: "mobile_bar",
  });

  expect(window.__TRAVELSPACE_PENDING_YANDEX_EVENTS).toEqual([
    expect.objectContaining({
      eventName: "phone_click",
      payload: expect.objectContaining({
        phone_number: "+375296369911",
        placement: "mobile_bar",
      }),
    }),
  ]);

  delete window.__TRAVELSPACE_YANDEX_METRIKA_CONFIGURED;
  delete window.__TRAVELSPACE_PENDING_YANDEX_EVENTS;
  delete window.gtag;
  delete window.dataLayer;
});
