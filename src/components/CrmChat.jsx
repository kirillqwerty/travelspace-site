import { useEffect } from "react";

export function initializeCrmChat() {
  if (document.getElementById("amo_social_button_script")) return;
  window.amo_social_button = {
    id: "450115",
    hash: "c8bfbb796a544ec19ba0610294888b513c5f82923e9ce6591b57e6ef26cd7b72",
    locale: "ru",
    inline: true,
    setMeta(p) { this.params = (this.params || []).concat([p]); },
  };
  window.amoSocialButton = window.amoSocialButton || function () {
    (window.amoSocialButton.q = window.amoSocialButton.q || []).push(arguments);
  };
  window.amoSocialButtonConfig = window.amoSocialButtonConfig || {};
  window.amoSocialButtonConfig.hidden = true;
  const script = document.createElement("script");
  script.async = true;
  script.id = "amo_social_button_script";
  script.src = "https://gso.amocrm.ru/js/button.js";
  document.head.appendChild(script);
}

export default function CrmChat() {
  useEffect(() => { initializeCrmChat(); }, []);
  return null;
}
