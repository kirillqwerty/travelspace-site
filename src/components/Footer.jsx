// import { Link } from "react-router-dom";
// import { useMemo } from "react";
// import { useSiteData } from "@/lib/useSiteData";
// import { Phone, Mail, MapPin, Clock } from "lucide-react";
// import logo from "../assets/travelspace-logo.png";

// export default function Footer() {
//   const { settings, tours } = useSiteData();

//   const tourLinks = useMemo(() => {
//     const map = new Map();
//     tours.forEach((t) => {
//       if (!t.region_slug || map.has(t.region_slug)) return;
//       map.set(t.region_slug, { label: t.region_name || t.title, slug: t.slug });
//     });
//     return Array.from(map.values());
//   }, [tours]);

//   if (!settings) return null;

//   return (
//     <footer
//       className="bg-neutral-950 text-neutral-300 mt-20"
//       data-testid="site-footer"
//     >
//       <div className="section-container py-14 grid lg:grid-cols-12 gap-10">
//         <div className="lg:col-span-4">
//           <div className="flex items-center gap-2">
//             <img
//               src={logo}
//               alt="TravelSpace logo"
//               className="w-8 h-8 object-contain"
//             />
//             <span className="font-heading text-2xl font-bold text-white">
//               TRAVELSPACE
//             </span>
//           </div>
//           <p className="mt-4 text-sm text-neutral-400 leading-relaxed max-w-xs">
//             Туроператор автобусных туров из Минска. Простые программы и забота
//             на всю поездку.
//           </p>
//         </div>

//         <div className="lg:col-span-3">
//           <p className="overline text-neutral-500">Сайт</p>
//           <ul className="mt-4 space-y-2 text-sm">
//             <li>
//               <Link to="/tours" className="hover:text-white">Все туры</Link>
//             </li>
//             <li>
//               <Link to="/promotions" className="hover:text-white">Акции</Link>
//             </li>
//             <li>
//               <Link to="/blog" className="hover:text-white">Блог</Link>
//             </li>
//             <li>
//               <Link to="/about" className="hover:text-white">О компании</Link>
//             </li>
//             <li>
//               <Link to="/agencies" className="hover:text-white">Агентствам</Link>
//             </li>
//             <li>
//               <Link to="/payment" className="hover:text-white">Оплата</Link>
//             </li>
//             <li>
//               <Link to="/faq" className="hover:text-white">FAQ</Link>
//             </li>
//             <li>
//               <Link to="/contacts" className="hover:text-white">Контакты</Link>
//             </li>
//           </ul>
//         </div>

//         <div className="lg:col-span-3">
//           <p className="overline text-neutral-500">Туры</p>
//           <ul className="mt-4 space-y-2 text-sm">
//             {tourLinks.map((t) => (
//               <li key={t.slug}>
//                 <Link to={`/tours/${t.slug}`} className="hover:text-white">
//                   {t.label}
//                 </Link>
//               </li>
//             ))}
//           </ul>
//         </div>

//         <div className="lg:col-span-2">
//           <p className="overline text-neutral-500">Контакты</p>
//           <ul className="mt-4 space-y-3 text-sm">
//             <li className="flex items-start gap-2">
//               <Phone className="size-4 mt-0.5 text-[#F97316]" />
//               <a
//                 href={`tel:${settings.phone_link}`}
//                 className="hover:text-white"
//               >
//                 {settings.phone}
//               </a>
//             </li>
//             <li className="flex items-start gap-2">
//               <Mail className="size-4 mt-0.5 text-[#F97316]" />
//               <a
//                 href={`mailto:${settings.email}`}
//                 className="hover:text-white break-all"
//               >
//                 {settings.email}
//               </a>
//             </li>
//             <li className="flex items-start gap-2">
//               <MapPin className="size-4 mt-0.5 text-[#F97316]" />
//               <span>{settings.address}</span>
//             </li>
//             <li className="flex items-start gap-2">
//               <Clock className="size-4 mt-0.5 text-[#F97316]" />
//               <span>{settings.work_hours}</span>
//             </li>
//           </ul>
//         </div>
//       </div>

//       {/* Decorative pre-footer band — fingerprint style */}
//       <div
//         className="relative h-2 overflow-hidden"
//         style={{
//           background:
//             "repeating-linear-gradient(90deg, #C2410C 0 14px, transparent 14px 28px)",
//         }}
//       />

//       <div className="border-t border-neutral-900">
//         <div className="section-container py-5 flex flex-col sm:flex-row gap-2 sm:items-center justify-between text-xs text-neutral-500">
//           <p>
//             © {new Date().getFullYear()} {settings.legal_name}. УНП {settings.unp}.
//           </p>
//           <div className="flex flex-wrap gap-x-4 gap-y-1">
//             <Link to="/legal" className="hover:text-white">
//               Политика конфиденциальности
//             </Link>
//             <Link to="/legal#offer" className="hover:text-white">
//               Публичный договор
//             </Link>
//             <Link to="/admin/login" className="hover:text-white opacity-70">
//               Админ-панель
//             </Link>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// }
import { Link } from "react-router-dom";
import { useSiteData } from "@/lib/useSiteData";
import { Mail, MapPin, Phone } from "lucide-react";
import footerFilm from "../assets/footer-image.png";

const SOCIAL_LINKS = [
  {
    label: "Telegram",
    short: "TG",
    href: "https://t.me/travelspaceby",
    className: "bg-[#229ED9]",
  },
  {
    label: "Viber",
    short: "VB",
    href: "viber://chat?number=%2B375636999111",
    className: "bg-[#7360F2]",
  },
  {
    label: "WhatsApp",
    short: "WA",
    href: "https://wa.me/375636999111",
    className: "bg-[#25D366]",
  },
  {
    label: "Instagram",
    short: "IG",
    href: "https://www.instagram.com/travelspace.by",
    className: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
  },
  {
    label: "VK",
    short: "VK",
    href: "https://vk.com/travelspaceby",
    className: "bg-[#0077FF]",
  },
  {
    label: "Pinterest",
    short: "P",
    href: "https://www.pinterest.com/",
    className: "bg-[#E60023]",
  },
  {
    label: "YouTube",
    short: "YT",
    href: "https://www.youtube.com/",
    className: "bg-[#FF0000]",
  },
  {
    label: "TikTok",
    short: "TT",
    href: "https://www.tiktok.com/",
    className: "bg-neutral-900 border border-white/20",
  },
];

export default function Footer() {
  const { settings } = useSiteData();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-black text-white" data-testid="site-footer">
      <div className="w-full bg-black">
        <img
          src={footerFilm}
          alt="Travel Space"
          className="block w-full h-[92px] sm:h-[130px] lg:h-[180px] object-cover object-center"
          loading="lazy"
        />
      </div>

      <div className="section-container py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1px_1.35fr] lg:items-center">
          <div className="space-y-6 text-sm font-semibold leading-relaxed">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 size-4 shrink-0 text-[#F97316]" />
              <div>
                <p>Адрес:</p>
                <p>пр-т Независимости 58</p>
                <p>220005</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="mt-1 size-4 shrink-0 text-[#F97316]" />
              <div>
                <p>Тел.:</p>
                <a
                  href="tel:+375636999111"
                  className="block hover:text-[#F97316]"
                >
                  A1/MTS: 636-99-11 · Грузия и Дагестан
                </a>
                <a
                  href="tel:+375636222999"
                  className="block hover:text-[#F97316]"
                >
                  A1/MTS: 636-22-99 · Питер и Карелия
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="mt-1 size-4 shrink-0 text-[#F97316]" />
              <div>
                <p>Эл. почта:</p>
                <a
                  href="mailto:info@travel-space.by"
                  className="hover:text-[#F97316]"
                >
                  info@travel-space.by
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
              <p>Ежедневно с 10:00 до 19:00</p>
              <p>На связи в instagram 24/7</p>
            </div>

            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex flex-wrap gap-3">
                {SOCIAL_LINKS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className={`grid size-9 place-items-center rounded-full text-[10px] font-black text-white transition hover:-translate-y-0.5 hover:opacity-90 ${item.className}`}
                  >
                    {item.short}
                  </a>
                ))}
              </div>

              <Link
                to="/legal#offer"
                className="text-base font-bold hover:text-[#F97316]"
              >
                Публичный договор
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 text-center text-xs font-semibold text-white/80">
          © {currentYear} {settings?.site_url || "travel-space.by"}
          <Link to="/admin/login" className="ml-3 opacity-40 hover:opacity-80">
            ·
          </Link>
        </div>
      </div>
    </footer>
  );
}
