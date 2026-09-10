import { initializeCrmChat } from "./CrmChat";
test("initializes the supplied CRM configuration exactly once", () => {
  initializeCrmChat();
  const script = document.getElementById("amo_social_button_script");
  expect(script.src).toBe("https://gso.amocrm.ru/js/button.js");
  expect(window.amo_social_button.id).toBe("450115");
  expect(window.amo_social_button.inline).toBe(true);
  expect(window.amoSocialButtonConfig.hidden).toBe(true);
  window.amo_social_button.setMeta({ test: true });
  initializeCrmChat();
  expect(document.querySelectorAll("#amo_social_button_script")).toHaveLength(1);
  expect(window.amo_social_button.params).toEqual([{ test: true }]);
  script.remove();
});
