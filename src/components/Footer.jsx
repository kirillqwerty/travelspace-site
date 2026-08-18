import { useState } from "react";
import { Link } from "react-router-dom";
import { useSiteData } from "@/lib/useSiteData";
import MessengerModal from "@/components/MessengerModal";
import { Mail, MapPin, Phone } from "lucide-react";
import paymentImage from "../assets/footer-payment.png";
import socialTelegram from "../assets/social-telegram.png";
import socialViber from "../assets/social-viber.png";
import socialWhatsapp from "../assets/social-whatsapp.png";
import socialInstagram from "../assets/social-instagram.png";
import socialVk from "../assets/social-vk.png";
import socialPinterest from "../assets/social-pinterest.png";
import socialYoutube from "../assets/social-youtube.png";
import socialTiktok from "../assets/social-tiktok.png";

const phoneTel = (phone) => String(phone || "").replace(/[^\d]/g, "");

const SOCIAL_LINKS = [
  {
    label: "Telegram",
    type: "telegram",
    short: "TG",
    href: "https://t.me/travelspaceby",
    className: "bg-[#229ED9]",
    iconAsset: socialTelegram,
  },
  {
    label: "Viber",
    type: "viber",
    short: "VB",
    href: "viber://chat?number=%2B375636999111",
    className: "bg-[#7360F2]",
    iconAsset: socialViber,
  },
  {
    label: "WhatsApp",
    type: "whatsapp",
    short: "WA",
    href: "https://wa.me/375636999111",
    className: "bg-[#25D366]",
    iconAsset: socialWhatsapp,
  },
  {
    label: "Instagram",
    type: "instagram",
    short: "IG",
    href: "https://www.instagram.com/travelspace.by",
    className: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
    iconAsset: socialInstagram,
  },
  {
    label: "VK",
    type: "vk",
    short: "VK",
    href: "https://vk.com/travelspace_by",
    className: "bg-[#0077FF]",
    iconAsset: socialVk,
  },
  {
    label: "Pinterest",
    type: "pinterest",
    short: "P",
    href: "https://www.pinterest.com/Travel_Space/",
    className: "bg-[#E60023]",
    iconAsset: socialPinterest,
  },
  {
    label: "YouTube",
    type: "youtube",
    short: "YT",
    href: "https://www.youtube.com/@TravelSpace_Minsk",
    className: "bg-[#FF0000]",
    iconAsset: socialYoutube,
  },
  {
    label: "TikTok",
    type: "tiktok",
    short: "TT",
    href: "https://www.tiktok.com/@travelspace.by",
    className: "bg-neutral-900 border border-white/20",
    iconAsset: socialTiktok,
  },
];

function normalizeSocialKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function getConfiguredSocialUrl(settingsSocialLinks, fixedItem) {
  if (!Array.isArray(settingsSocialLinks)) return "";

  const fixedKeys = [fixedItem.type, fixedItem.label, fixedItem.short]
    .map(normalizeSocialKey)
    .filter(Boolean);

  const configured = settingsSocialLinks.find((item) => {
    if (!item || item.active === false) return false;

    const itemKeys = [item.type, item.label, item.short]
      .map(normalizeSocialKey)
      .filter(Boolean);

    return itemKeys.some((key) => fixedKeys.includes(key));
  });

  return configured?.href || configured?.url || configured?.link || "";
}

function getFooterSocialLinks(settings) {
  const settingsSocialLinks = Array.isArray(settings?.social_buttons)
    ? settings.social_buttons
    : [];

  return SOCIAL_LINKS.map((item) => ({
    ...item,
    href: getConfiguredSocialUrl(settingsSocialLinks, item) || item.href,
  }));
}

function isHeaderMessengerType(type) {
  return ["telegram", "viber", "whatsapp"].includes(normalizeSocialKey(type));
}

function isMessengerUrl(url) {
  const value = String(url || "").toLowerCase();

  return (
    value.startsWith("viber://") ||
    value.startsWith("tg://") ||
    value.includes("t.me/") ||
    value.includes("wa.me/") ||
    value.includes("api.whatsapp.com/")
  );
}

function getExternalLinkProps(url) {
  return isMessengerUrl(url) ? {} : { target: "_blank", rel: "noreferrer" };
}

export default function Footer() {
  const { settings } = useSiteData();
  const [messenger, setMessenger] = useState({
    open: false,
    type: "telegram",
  });

  const currentYear = new Date().getFullYear();
  const footerPhones = settings?.header_phones?.length
    ? settings.header_phones
    : [
        {
          label: "Грузия и Дагестан",
          phone: "636-99-11",
          link: "+375296369911",
        },
        { label: "Питер и Карелия", phone: "636-22-99", link: "+375296362299" },
      ];

  const footerSocialLinks = getFooterSocialLinks(settings);

  return (
    <footer className="mt-20 bg-black text-white" data-testid="site-footer">
      {/* <div className="w-full bg-black">
        <img
          src={footerFilm}
          alt="Travel Space"
          className="block w-full h-[92px] sm:h-[130px] lg:h-[180px] object-cover object-center"
          loading="lazy"
        />
      </div> */}

      <div className="section-container py-12 lg:py-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1px_1.35fr] lg:items-center">
          <div className="space-y-6 text-sm font-semibold leading-relaxed">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 size-4 shrink-0 text-[#F97316]" />
              <div>
                <p>Адрес:</p>
                <p>
                  {settings?.address || "Минск, Площадь Свободы 23, офис 16А"}
                </p>
                <p>220030</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="mt-1 size-4 shrink-0 text-[#F97316]" />
              <div>
                <p>Тел.:</p>
                {footerPhones.map((item) => (
                  <a
                    key={item.link || item.phone}
                    href={`tel:${phoneTel(item.link || item.phone)}`}
                    className="block hover:text-[#F97316]"
                  >
                    A1/MTS: {item.phone} · {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="mt-1 size-4 shrink-0 text-[#F97316]" />
              <div>
                <p>Эл. почта:</p>
                <a
                  href={`mailto:${settings?.email || "info@travel-space.by"}`}
                  className="hover:text-[#F97316]"
                >
                  {settings?.email || "info@travel-space.by"}
                </a>
              </div>
            </div>

            <div>
              <p>Мы в системе оплаты "ЕРИП":</p>
              <p>
                "Туризм и отдых" - "Турагентства, туроператор" - "Пространство
                путешествий"
              </p>
            </div>
          </div>

          <div className="hidden h-full min-h-[210px] w-px bg-white lg:block" />

          <div className="space-y-7 text-sm font-semibold leading-relaxed">
            <div>
              <p>ООО "Пространство Путешествий" УНП 193738609</p>
              <p>
                Зарегистрированы в реестре субъектов туристической деятельности
                РБ, №1310
              </p>
              <p>
                Является членом Республиканская Ассоциация Туристических
                Агентств
              </p>
            </div>

            <div>
              <p>График работы:</p>
              <p>{settings?.work_hours || "По будням с 11:00 до 19:00"}</p>
              <p>
                На связи в{" "}
                <a
                  className="text-[#F97316] transition hover:-translate-y-0.5 hover:opacity-90"
                  href="https://www.instagram.com/travelspace.by/"
                  target="_blank"
                >
                  instagram{" "}
                </a>
                24/7
              </p>
            </div>

            <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
              <div className="flex flex-wrap items-center gap-2.5 2xl:flex-nowrap">
                {footerSocialLinks.map((item) => {
                  const icon = (
                    <img
                      src={item.iconAsset}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  );
                  const buttonClassName = `grid size-10 shrink-0 place-items-center overflow-hidden rounded-full text-[10px] font-black text-white transition hover:-translate-y-0.5 hover:opacity-90 ${item.className}`;

                  if (isHeaderMessengerType(item.type)) {
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() =>
                          setMessenger({ open: true, type: item.type })
                        }
                        aria-label={item.label}
                        title={item.label}
                        className={buttonClassName}
                      >
                        {icon}
                      </button>
                    );
                  }

                  return (
                    <a
                      key={item.type}
                      href={item.href}
                      {...getExternalLinkProps(item.href)}
                      aria-label={item.label}
                      title={item.label}
                      className={buttonClassName}
                    >
                      {icon}
                    </a>
                  );
                })}
              </div>

              <a
                href="/public-contract.pdf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-white/25 px-6 py-3 text-base font-bold leading-none transition hover:border-[#F97316] hover:text-[#F97316]"
              >
                Публичный договор
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 text-center text-xs font-semibold text-white/80">
          © {currentYear} {settings?.site_url || "travel-space.by"}
        </div>
      </div>
      <div className="border-t border-white/10 bg-black py-4">
        <div className="section-container flex justify-center">
          <img
            src={paymentImage}
            alt="Webpay, Visa, Mastercard, Белкарт"
            className="max-h-12 w-auto max-w-full object-contain"
            loading="lazy"
          />
        </div>
      </div>

      <MessengerModal
        open={messenger.open}
        onOpenChange={(v) => setMessenger((m) => ({ ...m, open: v }))}
        defaultType={messenger.type}
      />
    </footer>
  );
}
