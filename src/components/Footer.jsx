// import { Link } from "react-router-dom";
// import { useSiteData } from "@/lib/useSiteData";
// import { Mail, MapPin, Phone } from "lucide-react";
// import { mediaUrl } from "@/lib/media";
// import paymentImage from "../assets/footer-payment.png";

// const phoneTel = (phone) => String(phone || "").replace(/[^\d]/g, "");

// const SOCIAL_LINKS = [
//   {
//     label: "Telegram",
//     short: "TG",
//     href: "https://t.me/travelspaceby",
//     className: "bg-[#229ED9]",
//   },
//   {
//     label: "Viber",
//     short: "VB",
//     href: "viber://chat?number=%2B375636999111",
//     className: "bg-[#7360F2]",
//   },
//   {
//     label: "WhatsApp",
//     short: "WA",
//     href: "https://wa.me/375636999111",
//     className: "bg-[#25D366]",
//   },
//   {
//     label: "Instagram",
//     short: "IG",
//     href: "https://www.instagram.com/travelspace.by",
//     className: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
//   },
//   {
//     label: "VK",
//     short: "VK",
//     href: "https://vk.com/travelspaceby",
//     className: "bg-[#0077FF]",
//   },
//   {
//     label: "Pinterest",
//     short: "P",
//     href: "https://www.pinterest.com/",
//     className: "bg-[#E60023]",
//   },
//   {
//     label: "YouTube",
//     short: "YT",
//     href: "https://www.youtube.com/",
//     className: "bg-[#FF0000]",
//   },
//   {
//     label: "TikTok",
//     short: "TT",
//     href: "https://www.tiktok.com/",
//     className: "bg-neutral-900 border border-white/20",
//   },
// ];

// export default function Footer() {
//   const { settings } = useSiteData();

//   const currentYear = new Date().getFullYear();
//   const footerPhones = settings?.header_phones?.length
//     ? settings.header_phones
//     : [
//         {
//           label: "Грузия и Дагестан",
//           phone: "636-99-11",
//           link: "+375296369911",
//         },
//         { label: "Питер и Карелия", phone: "636-22-99", link: "+375296362299" },
//       ];

//   const footerSocialLinks =
//     Array.isArray(settings?.social_buttons) && settings.social_buttons.length
//       ? settings.social_buttons.filter(
//           (item) => item?.active !== false && item?.url,
//         )
//       : SOCIAL_LINKS;

//   return (
//     <footer className="mt-20 bg-black text-white" data-testid="site-footer">
//       {/* <div className="w-full bg-black">
//         <img
//           src={footerFilm}
//           alt="Travel Space"
//           className="block w-full h-[92px] sm:h-[130px] lg:h-[180px] object-cover object-center"
//           loading="lazy"
//         />
//       </div> */}

//       <div className="section-container py-12 lg:py-8">
//         <div className="grid gap-10 lg:grid-cols-[1fr_1px_1.35fr] lg:items-center">
//           <div className="space-y-6 text-sm font-semibold leading-relaxed">
//             <div className="flex items-start gap-3">
//               <MapPin className="mt-1 size-4 shrink-0 text-[#F97316]" />
//               <div>
//                 <p>Адрес:</p>
//                 <p>
//                   {settings?.address || "Минск, Площадь Свободы 23, офис 16А"}
//                 </p>
//                 <p>220030</p>
//               </div>
//             </div>

//             <div className="flex items-start gap-3">
//               <Phone className="mt-1 size-4 shrink-0 text-[#F97316]" />
//               <div>
//                 <p>Тел.:</p>
//                 {footerPhones.map((item) => (
//                   <a
//                     key={item.link || item.phone}
//                     href={`tel:${phoneTel(item.link || item.phone)}`}
//                     className="block hover:text-[#F97316]"
//                   >
//                     A1/MTS: {item.phone} · {item.label}
//                   </a>
//                 ))}
//               </div>
//             </div>

//             <div className="flex items-start gap-3">
//               <Mail className="mt-1 size-4 shrink-0 text-[#F97316]" />
//               <div>
//                 <p>Эл. почта:</p>
//                 <a
//                   href={`mailto:${settings?.email || "info@travel-space.by"}`}
//                   className="hover:text-[#F97316]"
//                 >
//                   {settings?.email || "info@travel-space.by"}
//                 </a>
//               </div>
//             </div>

//             <div>
//               <p>Мы в системе оплаты "ЕРИП":</p>
//               <p>
//                 "Туризм и отдых" - "Турагентства, туроператор" - "Пространство
//                 путешествий"
//               </p>
//             </div>
//           </div>

//           <div className="hidden h-full min-h-[210px] w-px bg-white lg:block" />

//           <div className="space-y-7 text-sm font-semibold leading-relaxed">
//             <div>
//               <p>ООО "Пространство Путешествий" УНП 193738609</p>
//               <p>
//                 Зарегистрированы в реестре субъектов туристической деятельности
//                 РБ, №1310
//               </p>
//               <p>
//                 Является членом Республиканская Ассоциация Туристических
//                 Агентств
//               </p>
//             </div>

//             <div>
//               <p>График работы:</p>
//               <p>{settings?.work_hours || "По будням с 11:00 до 19:00"}</p>
//               <p>
//                 На связи в{" "}
//                 <a
//                   className="text-[#F97316] transition hover:-translate-y-0.5 hover:opacity-90"
//                   href="https://www.instagram.com/travelspace.by/"
//                   target="_blank"
//                 >
//                   instagram{" "}
//                 </a>
//                 24/7
//               </p>
//             </div>

//             <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
//               <div className="flex flex-wrap gap-3">
//                 {footerSocialLinks.map((item, index) => (
//                   <a
//                     key={item.label || item.url || index}
//                     href={item.href || item.url}
//                     target="_blank"
//                     rel="noreferrer"
//                     aria-label={item.label}
//                     className={`grid size-9 place-items-center overflow-hidden rounded-full text-[10px] font-black text-white transition hover:-translate-y-0.5 hover:opacity-90 ${item.className || ""}`}
//                     style={item.color ? { background: item.color } : undefined}
//                   >
//                     {item.icon ? (
//                       <img
//                         src={mediaUrl(item.icon)}
//                         alt=""
//                         className="h-5 w-5 object-contain"
//                       />
//                     ) : (
//                       item.short ||
//                       (item.label || "?").slice(0, 2).toUpperCase()
//                     )}
//                   </a>
//                 ))}
//               </div>

//               <Link
//                 to="/legal#offer"
//                 className="text-base font-bold hover:text-[#F97316]"
//               >
//                 Публичный договор
//               </Link>
//             </div>
//           </div>
//         </div>

//         <div className="mt-10 border-t border-white/10 pt-5 text-center text-xs font-semibold text-white/80">
//           © {currentYear} {settings?.site_url || "travel-space.by"}
//           <Link to="/admin/login" className="ml-3 opacity-40 hover:opacity-80">
//             admin-panel
//           </Link>
//         </div>
//       </div>
//       <div className="border-t border-white/10 bg-white py-4">
//         <div className="section-container flex justify-center">
//           <img
//             src={paymentImage}
//             alt="Webpay, Visa, Mastercard, Белкарт"
//             className="max-h-12 w-auto max-w-full object-contain"
//             loading="lazy"
//           />
//         </div>
//       </div>
//     </footer>
//   );
// }
import { Link } from "react-router-dom";
import { useSiteData } from "@/lib/useSiteData";
import { Mail, MapPin, Phone } from "lucide-react";
import { mediaUrl } from "@/lib/media";
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

const SOCIAL_ICON_BY_KEY = {
  telegram: socialTelegram,
  tg: socialTelegram,
  viber: socialViber,
  vi: socialViber,
  whatsapp: socialWhatsapp,
  wa: socialWhatsapp,
  instagram: socialInstagram,
  ig: socialInstagram,
  vk: socialVk,
  вк: socialVk,
  pinterest: socialPinterest,
  p: socialPinterest,
  youtube: socialYoutube,
  yt: socialYoutube,
  tiktok: socialTiktok,
  tt: socialTiktok,
};

function getSocialIconAsset(item = {}) {
  const keys = [item.type, item.label, item.short]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());

  return keys.map((key) => SOCIAL_ICON_BY_KEY[key]).find(Boolean) || null;
}

const SOCIAL_LINKS = [
  {
    label: "Telegram",
    type: "telegram",
    short: "TG",
    href: "https://t.me/travelspaceby",
    className: "bg-[#229ED9]",
  },
  {
    label: "Viber",
    type: "viber",
    short: "VB",
    href: "viber://chat?number=%2B375636999111",
    className: "bg-[#7360F2]",
  },
  {
    label: "WhatsApp",
    type: "whatsapp",
    short: "WA",
    href: "https://wa.me/375636999111",
    className: "bg-[#25D366]",
  },
  {
    label: "Instagram",
    type: "instagram",
    short: "IG",
    href: "https://www.instagram.com/travelspace.by",
    className: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
  },
  {
    label: "VK",
    type: "vk",
    short: "VK",
    href: "https://vk.com/travelspace_by",
    className: "bg-[#0077FF]",
  },
  {
    label: "Pinterest",
    type: "pinterest",
    short: "P",
    href: "https://www.pinterest.com/Travel_Space/",
    className: "bg-[#E60023]",
  },
  {
    label: "YouTube",
    type: "youtube",
    short: "YT",
    href: "https://www.youtube.com/@TravelSpace_Minsk",
    className: "bg-[#FF0000]",
  },
  {
    label: "TikTok",
    type: "tiktok",
    short: "TT",
    href: "https://www.tiktok.com/@travelspace.by",
    className: "bg-neutral-900 border border-white/20",
  },
];

export default function Footer() {
  const { settings } = useSiteData();

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

  const footerSocialLinks =
    Array.isArray(settings?.social_buttons) && settings.social_buttons.length
      ? settings.social_buttons.filter(
          (item) => item?.active !== false && item?.url,
        )
      : SOCIAL_LINKS;

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

            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex flex-wrap gap-3">
                {footerSocialLinks.map((item, index) => {
                  const localIcon = getSocialIconAsset(item);

                  return (
                    <a
                      key={item.label || item.url || item.href || index}
                      href={item.href || item.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.label}
                      className={`grid size-11 place-items-center overflow-hidden rounded-full text-[10px] font-black text-white transition hover:-translate-y-0.5 hover:opacity-90 ${!item.icon && !localIcon ? item.className || "" : ""}`}
                      style={
                        !item.icon && !localIcon && item.color
                          ? { background: item.color }
                          : undefined
                      }
                    >
                      {item.icon ? (
                        <img
                          src={mediaUrl(item.icon)}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      ) : localIcon ? (
                        <img
                          src={localIcon}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        item.short ||
                        (item.label || "?").slice(0, 2).toUpperCase()
                      )}
                    </a>
                  );
                })}
              </div>

              <a
                href="/public-contract.pdf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-5 py-3 text-base font-bold transition hover:border-[#F97316] hover:text-[#F97316]"
              >
                Публичный договор
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 text-center text-xs font-semibold text-white/80">
          © {currentYear} {settings?.site_url || "travel-space.by"}
          <Link to="/admin/login" className="ml-3 opacity-40 hover:opacity-80">
            admin-panel
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 bg-white py-4">
        <div className="section-container flex justify-center">
          <img
            src={paymentImage}
            alt="Webpay, Visa, Mastercard, Белкарт"
            className="max-h-12 w-auto max-w-full object-contain"
            loading="lazy"
          />
        </div>
      </div>
    </footer>
  );
}
