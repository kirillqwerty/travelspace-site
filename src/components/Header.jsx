import ResponsiveLink from "@/components/ResponsiveLink";
import { lazy, Suspense, useState, useEffect, useMemo } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, LogOut } from "lucide-react";
import MobileBackLink from "@/components/MobileBackLink";
import { Button } from "@/components/ui/button";
import { useSiteData } from "@/lib/useSiteData";
import { TourMenuTitle } from "@/lib/tourTitle";
import logoBlack from "../assets/logo-travelspace-black.webp";
import logoWhite from "../assets/logo-travelspace-white.webp";
import socialTelegram from "../assets/social-telegram.png";
import socialViber from "../assets/social-viber.png";
import socialWhatsapp from "../assets/social-whatsapp.png";
import {
  getTourLandingPath,
  getTourSectionPath,
  getTourTransportType,
  getTransportFromHash,
  TOUR_TRANSPORT_TYPES,
} from "@/lib/tourTransport";

const MessengerModal = lazy(() => import("@/components/MessengerModal"));
const LeadDialog = lazy(() => import("@/components/LeadDialog"));

const TOUR_NAV = [
  {
    to: getTourLandingPath(TOUR_TRANSPORT_TYPES.BUS),
    label: "Автобусные туры",
    transportType: TOUR_TRANSPORT_TYPES.BUS,
  },
  {
    to: getTourLandingPath(TOUR_TRANSPORT_TYPES.AIR),
    label: "Авиа туры",
    transportType: TOUR_TRANSPORT_TYPES.AIR,
  },
];

const PRIMARY_NAV = [
  { to: "/promotions", label: "Акции" },
  { to: "/blog", label: "Блог", blogDropdown: true },
  { to: "/reviews", label: "Отзывы" },
  { to: "/about", label: "О нас" },
  { to: "/agencies", label: "Агентствам", desktopOnly: true },
  { to: "/contacts", label: "Контакты" },
];

const ViberSvg = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
    <path d="M12.011 0C5.373 0 0 5.373 0 12.011c0 2.119.553 4.108 1.52 5.832L0 24l6.36-1.487a11.94 11.94 0 0 0 5.651 1.42c6.638 0 12.011-5.373 12.011-12.011S18.649 0 12.011 0Zm6.43 16.77c-.265.748-1.56 1.43-2.14 1.51-.553.073-1.246.11-4.018-1.03-3.538-1.465-5.819-5.073-5.994-5.31-.176-.237-1.438-1.91-1.438-3.645 0-1.735.91-2.585 1.237-2.935.324-.35.703-.438.938-.438h.675c.21 0 .49-.08.763.58.265.65.903 2.25.983 2.41.08.158.132.342.026.553-.105.21-.158.342-.316.526-.158.184-.333.412-.474.553-.158.158-.316.324-.132.632.184.316.825 1.342 1.773 2.166 1.22 1.07 2.245 1.404 2.56 1.562.316.158.5.132.685-.08.184-.21.79-.922 1-1.237.21-.316.42-.263.71-.158.29.105 1.84.86 2.156 1.017.316.158.526.237.605.368.08.132.08.773-.184 1.52Z" />
  </svg>
);

const TgSvg = () => (
  <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
    <path d="M9.5 14.5 9.4 18c.3 0 .4-.1.6-.3l1.5-1.4 3.1 2.3c.6.3 1 .2 1.2-.5l2.1-9.9c.2-.9-.3-1.2-.9-1l-12.4 4.8c-.8.3-.8.8-.2 1l3.2 1 7.4-4.7c.4-.2.7-.1.4.2" />
  </svg>
);

const WaSvg = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
    <path d="M20.52 3.48A11.82 11.82 0 0 0 12.07 0C5.5 0 .15 5.35.15 11.93c0 2.1.55 4.16 1.6 5.97L0 24l6.26-1.64a11.92 11.92 0 0 0 5.8 1.48h.01c6.58 0 11.93-5.35 11.93-11.93 0-3.19-1.24-6.19-3.48-8.43Zm-8.45 18.34h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.98.99-3.62-.24-.37a9.9 9.9 0 0 1-1.52-5.3c0-5.47 4.45-9.92 9.92-9.92a9.86 9.86 0 0 1 7.02 2.91 9.86 9.86 0 0 1 2.9 7.01c0 5.47-4.45 9.92-9.92 9.92Zm5.44-7.43c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.95 1.18-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.67-2.07-.18-.3-.02-.47.13-.62.13-.13.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.08-.79.38-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.21 5.08 4.5.7.3 1.25.48 1.68.62.71.23 1.35.2 1.86.12.57-.08 1.78-.73 2.03-1.44.25-.7.25-1.3.17-1.43-.08-.13-.27-.2-.57-.35Z" />
  </svg>
);

const MESSENGER_BTNS = [
  {
    type: "viber",
    color: "#7360F2",
    Icon: ViberSvg,
    label: "Viber",
    iconAsset: socialViber,
  },
  {
    type: "telegram",
    color: "#0088CC",
    Icon: TgSvg,
    label: "Telegram",
    iconAsset: socialTelegram,
  },
  {
    type: "whatsapp",
    color: "#25D366",
    Icon: WaSvg,
    label: "WhatsApp",
    iconAsset: socialWhatsapp,
  },
];

function getHeaderSocialButtons() {
  return MESSENGER_BTNS.map((item) => ({
    type: item.type,
    label: item.label,
    color: item.color,
    Icon: item.Icon,
    iconAsset: item.iconAsset,
  }));
}

function SocialButton({ item, onMessenger }) {
  const Icon = item.Icon;
  const localIcon = item.iconAsset;
  const content = localIcon ? (
    <img src={localIcon} alt="" className="h-full w-full object-contain" />
  ) : Icon ? (
    <Icon className="size-4" />
  ) : (
    <span className="text-[10px] font-bold">
      {(item.label || "?").slice(0, 2).toUpperCase()}
    </span>
  );

  const hasPictureIcon = Boolean(localIcon);

  return (
    <button
      type="button"
      onClick={() => onMessenger(item.type || "telegram")}
      aria-label={item.label}
      title={item.label}
      className="grid size-8 place-items-center overflow-hidden rounded-full text-white transition hover:scale-110 2xl:size-9"
      style={hasPictureIcon ? undefined : { background: item.color || "#111827" }}
    >
      {content}
    </button>
  );
}

const phoneTel = (phone) => {
  return String(phone || "").replace(/[^\d]/g, "");
};

export default function Header() {
  const { settings, tours, articles } = useSiteData();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [toursOpen, setToursOpen] = useState(null);
  const [articlesOpen, setArticlesOpen] = useState(false);
  const [mobileToursOpen, setMobileToursOpen] = useState(null);
  const [mobileArticlesOpen, setMobileArticlesOpen] = useState(false);
  const [messenger, setMessenger] = useState({
    open: false,
    type: "telegram",
  });
  const [leadOpen, setLeadOpen] = useState(false);
  const [hasScrolled, setScrolled] = useState(false);
  const scrolled = hasScrolled || location.pathname.startsWith("/hotels/") || location.pathname.startsWith("/blog/");

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    fn();
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    setToursOpen(null);
    setArticlesOpen(false);
    setMobileToursOpen(null);
    setMobileArticlesOpen(false);
  }, [location.pathname, location.hash]);

  const tourLinksByTransport = useMemo(() => {
    const links = {
      [TOUR_TRANSPORT_TYPES.BUS]: [],
      [TOUR_TRANSPORT_TYPES.AIR]: [],
    };

    [...tours]
      .filter((tour) => tour.slug)
      .sort(
        (a, b) =>
          Number(a.order ?? 99) - Number(b.order ?? 99) ||
          String(a.title || "").localeCompare(String(b.title || ""), "ru"),
      )
      .forEach((tour) => {
        links[getTourTransportType(tour)].push({
          slug: tour.slug,
          label: tour.title,
          tour,
        });
      });

    return links;
  }, [tours]);

  const articleLinks = useMemo(() => {
    return (articles || [])
      .filter((item) => item.slug && item.active !== false && !item.hidden && !item.hidden_from_list && !item.hide_from_list)
      .map((item) => ({
        slug: item.slug,
        label: item.title,
      }));
  }, [articles]);

  const socialButtons = getHeaderSocialButtons();

  const headerPhones = settings?.header_phones?.length
      ? settings.header_phones
      : [
        {
          label: "Автобусные туры",
          phone: "636-99-11",
          link: "+375296369911",
        },
        {
          label: "Авиа туры",
          phone: "636-22-99",
          link: "+375296362299",
        },
      ];

  const headerMutedText = scrolled ? "text-neutral-700" : "text-white/90";
  const workHours = settings?.work_hours || "По будням с 11:00 до 19:00";
  const address = settings?.address || "Минск, Площадь Свободы 23, офис 16А";

  const closeMenu = () => {
    setOpen(false);
    setMobileToursOpen(null);
    setMobileArticlesOpen(false);
  };

  const mobileNav = [
    ...TOUR_NAV.map((item) => ({ ...item, dropdown: true })),
    ...PRIMARY_NAV,
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-md border-black/5"
            : "bg-black/25 backdrop-blur-md border-transparent"
        }`}
      >
        {/* TOP INFO BAR */}
        {!scrolled && (
            <div
              className="hidden overflow-hidden border-b border-white/10 lg:block lg:animate-in lg:fade-in lg:duration-300"
              data-testid="header-top-bar"
            >
              <div className="mx-auto flex h-9 w-full max-w-[1440px] items-center justify-between px-4 text-[11px] text-white/90 xl:px-6 xl:text-[12px]">
                <div className="flex min-w-0 items-center gap-3 xl:gap-5">
                  <span className="min-w-0 truncate">Адрес: {address}</span>
                  <span className="min-w-0 truncate">
                    График работы: {workHours}
                  </span>
                </div>

                <ResponsiveLink
                  className="ml-4 flex shrink-0 items-center"
                  href="https://www.instagram.com/travelspace.by/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="flex items-center gap-2 rounded-full border border-[#F97316]/30 bg-[#F97316]/15 px-4 py-1.5 text-xs font-semibold text-[#FB923C] shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                    <span className="animate-pulse text-[#FB923C]">●</span>
                    <span>На связи в Instagram 24/7</span>
                  </div>
                </ResponsiveLink>
              </div>
            </div>
        )}

        {/* MAIN HEADER */}
        <div
          className={`mx-auto flex w-full max-w-[1440px] items-center gap-2 px-4 transition-all duration-500 xl:gap-2.5 xl:px-6 ${
            scrolled ? "h-14" : "h-16"
          }`}
        >
          <Link
            to="/"
            className="flex shrink-0 items-center"
            data-testid="header-logo"
          >
            <img
              src={scrolled ? logoBlack : logoWhite}
              alt="TRAVELSPACE"
              width="400"
              height="41"
              className={`object-contain object-left transition-all duration-500 ${
                scrolled
                  ? "h-6 w-[145px] xl:w-[158px]"
                  : "h-7 w-[165px] xl:h-8 xl:w-[182px]"
              }`}
            />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden shrink-0 items-center gap-0.5 text-[11px] font-medium leading-none lg:flex xl:gap-1 xl:text-[12px] 2xl:text-[13px]">
            {TOUR_NAV.map((navItem) => {
              const isOpen = toursOpen === navItem.transportType;
              const isActive =
                location.pathname === navItem.to ||
                (location.pathname === "/" &&
                  getTransportFromHash(location.hash) === navItem.transportType);
              const tourLinks =
                tourLinksByTransport[navItem.transportType] || [];

              return (
                <div
                  key={navItem.transportType}
                  className="relative"
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") setToursOpen(navItem.transportType);
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType === "mouse") setToursOpen(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.stopPropagation();
                      setToursOpen(null);
                      event.currentTarget.querySelector("button")?.focus();
                    }
                  }}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setToursOpen(null);
                    }
                  }}
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      // Mouse hover may already have opened the menu before
                      // the click. Keep it open; keyboard/touch clicks toggle.
                      const shouldToggle =
                        event.detail === 0 ||
                        ["touch", "pen"].includes(event.nativeEvent.pointerType);
                      setToursOpen((current) =>
                        shouldToggle && current === navItem.transportType
                          ? null
                          : navItem.transportType,
                      );
                    }}
                    className={`flex items-center gap-1 whitespace-nowrap rounded-full px-0.5 py-1.5 transition-all duration-200 hover:bg-white/15 hover:text-[#F97316] hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.4)] xl:px-1 2xl:px-1.5 ${
                      isActive || isOpen ? "text-[#F97316]" : headerMutedText
                    }`}
                    aria-expanded={isOpen}
                    aria-controls={`desktop-tours-${navItem.transportType}`}
                    data-testid={`nav-tours-${navItem.transportType}`}
                  >
                    {navItem.label}
                    <ChevronDown
                      className={`size-4 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={`desktop-tours-${navItem.transportType}`}
                      className="absolute left-0 top-full pt-4"
                    >
                      <div className="w-[min(440px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 shadow-2xl">
                        <NavLink
                          to={getTourSectionPath(navItem.transportType)}
                          onClick={() => setToursOpen(null)}
                          className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-[#C2410C] hover:bg-orange-50"
                        >
                          Все {navItem.label.toLowerCase()}
                        </NavLink>
                        <div
                          className="max-h-[min(560px,calc(100dvh-200px))] overflow-y-auto overscroll-contain border-t border-neutral-100"
                          data-testid={`desktop-tour-list-${navItem.transportType}`}
                        >
                          {tourLinks.length ? (
                            tourLinks.map((item) => (
                              <NavLink
                                key={item.slug}
                                to={`/tours/${item.slug}`}
                                onClick={() => setToursOpen(null)}
                                className={({ isActive: isTourActive }) =>
                                  `block whitespace-normal rounded-xl px-4 py-2.5 text-sm leading-snug [overflow-wrap:anywhere] transition-colors ${
                                    isTourActive
                                      ? "bg-orange-50 text-[#C2410C]"
                                      : "text-neutral-700 hover:bg-orange-50 hover:text-[#C2410C]"
                                  }`
                                }
                              >
                                <TourMenuTitle tour={item.tour} />
                              </NavLink>
                            ))
                          ) : (
                            <p className="px-4 py-3 text-sm text-neutral-500">
                              Туры скоро появятся
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {PRIMARY_NAV.map((n) =>
              n.blogDropdown ? (
                <div
                  key={n.to}
                  className="relative"
                  onMouseEnter={() => setArticlesOpen(true)}
                  onMouseLeave={() => setArticlesOpen(false)}
                >
                  <NavLink
                    to={n.to}
                    className={({ isActive }) =>
                      `flex items-center gap-1 whitespace-nowrap rounded-full px-0.5 py-1.5 xl:px-1 2xl:px-1.5
                      transition-all duration-200
                      hover:bg-white/15 hover:text-[#F97316]
                      hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]
                      ${isActive || articlesOpen ? "text-[#F97316]" : headerMutedText}`
                    }
                    data-testid="nav-blog"
                  >
                    {n.label}
                    <ChevronDown
                      className={`size-4 transition-transform ${
                        articlesOpen ? "rotate-180" : ""
                      }`}
                    />
                  </NavLink>

                  {articlesOpen && articleLinks.length > 0 && (
                    <div className="absolute left-0 top-full pt-4">
                      <div data-testid="desktop-article-list" className="max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain w-72 rounded-2xl border border-white/50 bg-white/95 backdrop-blur-xl shadow-2xl p-2">
                        <NavLink
                          to="/blog"
                          className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-[#C2410C] hover:bg-orange-50"
                        >
                          Все статьи
                        </NavLink>
                        {articleLinks.map((item) => (
                          <NavLink
                            key={item.slug}
                            to={`/blog/${item.slug}`}
                            className={({ isActive }) =>
                              `block rounded-xl px-4 py-2.5 text-sm transition-colors ${
                                isActive
                                  ? "bg-orange-50 text-[#C2410C]"
                                  : "text-neutral-700 hover:bg-orange-50 hover:text-[#C2410C]"
                              }`
                            }
                          >
                            {item.label}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    `inline-flex items-center whitespace-nowrap rounded-full px-0.5 py-1.5 xl:px-1 2xl:px-1.5
                    transition-all duration-200
                    hover:bg-white/15 hover:text-[#F97316]
                    hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]
                    ${isActive ? "text-[#F97316]" : headerMutedText}`
                  }
                  data-testid={`nav-${n.to.slice(1) || "home"}`}
                >
                  {n.label}
                </NavLink>
              ),
            )}
          </nav>

          {/* RIGHT SIDE */}
          <div className="hidden min-w-0 flex-1 items-center gap-1.5 lg:flex xl:gap-2">
            <div className="ml-auto flex shrink-0 items-center gap-1">
              {socialButtons.map((item, index) => (
                <SocialButton
                  key={item.id || item.type || item.url || index}
                  item={item}
                  onMessenger={(type) => setMessenger({ open: true, type })}
                />
              ))}
            </div>

            <div
              className={`flex min-w-[90px] max-w-[320px] flex-1 items-center gap-1 text-left leading-none xl:max-w-[360px] ${headerMutedText}`}
            >
              <div className="hidden shrink-0 items-center gap-1 2xl:flex">
                <span className="rounded bg-red-600 px-1 py-0.5 text-[9px] font-black uppercase leading-none text-white">
                  МТС
                </span>
                <span className="rounded bg-red-50 px-1 py-0.5 text-[9px] font-black uppercase leading-none text-red-600">
                  A1
                </span>
              </div>

              <div className="flex min-w-0 flex-col items-stretch gap-1">
                {headerPhones.map((item) => (
                  <a
                    key={item.link || item.phone}
                    href={`tel:${phoneTel(item.link || item.phone)}`}
                    className="group grid max-w-full min-w-0 grid-cols-[74px_minmax(0,1fr)] items-center gap-1 whitespace-nowrap text-[13px] font-bold leading-none transition-colors hover:text-[#F97316] xl:grid-cols-[82px_minmax(0,1fr)] xl:text-[14px] 2xl:text-[15px]"
                    title={`${item.label || "Направление"}: ${item.phone}`}
                  >
                    <span className="shrink-0 tabular-nums">{item.phone}</span>
                    {item.label && (
                      <span className="min-w-0 overflow-hidden text-ellipsis text-[10px] font-semibold leading-none opacity-90 sm:max-w-[150px] xl:max-w-[215px] 2xl:max-w-[245px]">
                        · {item.label}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>

            <Button
              onClick={() => setLeadOpen(true)}
              className="hidden shrink-0 rounded-full bg-[#C2410C] px-4 font-medium text-white hover:bg-[#9A3412] xl:inline-flex 2xl:px-5"
              data-testid="header-pick-tour-btn"
            >
              Подобрать тур
            </Button>
          </div>

          {/* MOBILE */}
          <div className="ml-auto flex items-center gap-2 lg:hidden">
            {location.pathname !== "/" && !location.pathname.startsWith("/hotels/") && (
              <MobileBackLink
                fallback={location.pathname.startsWith("/tours/") ? "/tours" : location.pathname.startsWith("/blog/") ? "/blog" : "/"}
                label={location.pathname.startsWith("/tours/") ? "Вернуться к списку туров" : location.pathname.startsWith("/blog/") ? "Вернуться в блог" : "Вернуться на главную"}
                title="Назад"
                className={`grid size-10 place-items-center rounded-full transition ${scrolled ? "bg-white text-neutral-900 shadow" : "border border-white/20 bg-white/10 text-white"}`}
                data-testid="mobile-page-back"
              />
            )}
            <button
              onClick={() => setOpen(true)}
              aria-label="Меню"
              className={`size-10 grid place-items-center rounded-full transition-all duration-300 ${
                scrolled
                  ? "bg-white text-neutral-900 shadow"
                  : "bg-white/10 border border-white/20 text-white"
              }`}
              data-testid="mobile-menu-open"
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {open && (
          <div
            className="fixed inset-0 z-[60] animate-in fade-in duration-200 lg:hidden"
            data-testid="mobile-menu"
          >
            <div
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              onClick={closeMenu}
            />

            <div
              className="absolute right-0 top-0 h-full w-[88%] max-w-[360px] animate-in slide-in-from-right bg-white p-4 overflow-y-auto shadow-2xl duration-300 sm:max-w-[420px]"
            >
              <div className="flex items-center justify-between">
                <Link to="/" onClick={closeMenu} className="block">
                  <img
                    src={logoBlack}
                    alt="TRAVELSPACE"
                    className="h-7 w-[180px] object-contain object-left"
                  />
                </Link>
                <button
                  onClick={closeMenu}
                  className="size-9 rounded-full bg-neutral-100 grid place-items-center"
                  data-testid="mobile-menu-close"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav className="mt-3 flex flex-col gap-0.5">
                {mobileNav.map((n) =>
                  n.dropdown ? (
                    <div key={n.to}>
                      <button
                        type="button"
                        onClick={() => setMobileToursOpen((value) => value === n.transportType ? null : n.transportType)}
                        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-left text-[16px] font-medium text-neutral-900 transition-colors hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-700"
                        aria-expanded={mobileToursOpen === n.transportType}
                        aria-controls={`mobile-tours-${n.transportType}`}
                        data-testid={`mobile-nav-tours-toggle-${n.transportType}`}
                      >
                        <span>{n.label}</span>
                        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-700">
                          <ChevronDown className={`size-5 transition-transform duration-200 motion-reduce:transition-none ${mobileToursOpen === n.transportType ? "rotate-180" : ""}`} />
                        </span>
                      </button>
                      {mobileToursOpen === n.transportType && (
                          <div
                            id={`mobile-tours-${n.transportType}`}
                            className="animate-in fade-in slide-in-from-top-1 overflow-hidden duration-200"
                          >
                            <div data-testid={`mobile-tour-list-${n.transportType}`} className="max-h-[60dvh] overflow-y-auto overscroll-contain flex flex-col gap-0.5 pl-3 py-1">
                              {tourLinksByTransport[n.transportType]?.length ? (
                                tourLinksByTransport[n.transportType].map(
                                  (item) => (
                                    <NavLink
                                      key={item.slug}
                                      to={`/tours/${item.slug}`}
                                      onClick={closeMenu}
                                      className="whitespace-normal rounded-lg px-2 py-2 text-sm leading-snug text-neutral-700 [overflow-wrap:anywhere] hover:bg-orange-50 hover:text-[#C2410C]"
                                    >
                                      <TourMenuTitle tour={item.tour} />
                                    </NavLink>
                                  ),
                                )
                              ) : (
                                <p className="px-2 py-2 text-sm text-neutral-500">
                                  Туры скоро появятся
                                </p>
                              )}
                            </div>
                          </div>
                      )}
                    </div>
                  ) : n.blogDropdown ? (
                    <div key={n.to}>
                      <div className="flex items-center gap-1">
                        <NavLink
                          to="/blog"
                          onClick={closeMenu}
                          className="flex-1 rounded-xl px-2 py-2.5 text-[16px] font-medium text-neutral-900 hover:bg-neutral-100"
                        >
                          {n.label}
                        </NavLink>
                        <button
                          type="button"
                          onClick={() => setMobileArticlesOpen((v) => !v)}
                          className="size-10 rounded-xl grid place-items-center text-neutral-500 hover:bg-neutral-100"
                          aria-label={mobileArticlesOpen ? "Свернуть статьи блога" : "Показать статьи блога"}
                          aria-expanded={mobileArticlesOpen}
                        >
                          <ChevronDown aria-hidden="true" className={`size-5 text-neutral-700 transition-transform duration-200 motion-reduce:transition-none ${mobileArticlesOpen ? "rotate-180" : ""}`} />
                        </button>
                      </div>
                      {mobileArticlesOpen && (
                          <div
                            className="animate-in fade-in slide-in-from-top-1 overflow-hidden duration-200"
                          >
                            <div data-testid="mobile-article-list" className="max-h-[60dvh] overflow-y-auto overscroll-contain flex flex-col gap-0.5 pl-3 py-1">
                              <NavLink to="/blog" onClick={closeMenu} className="rounded-lg px-2 py-2 text-sm font-semibold text-[#C2410C]">Все статьи</NavLink>
                              {articleLinks.map((item) => (
                                <NavLink
                                  key={item.slug}
                                  to={`/blog/${item.slug}`}
                                  onClick={closeMenu}
                                  className="rounded-lg px-2 py-2 text-sm text-neutral-700 hover:bg-orange-50 hover:text-[#C2410C]"
                                >
                                  {item.label}
                                </NavLink>
                              ))}
                            </div>
                          </div>
                      )}
                    </div>
                  ) : (
                    <NavLink
                      key={n.to}
                      to={n.to}
                      onClick={closeMenu}
                      className="rounded-xl px-2 py-2.5 text-[16px] font-medium text-neutral-900 hover:bg-neutral-100"
                      data-testid={`mobile-nav-${n.to.slice(1) || "home"}`}
                    >
                      {n.label}
                    </NavLink>
                  ),
                )}
              </nav>

              {/* Phones */}
              <div className="mt-4 grid grid-cols-1 gap-2">
                {headerPhones.map((p) => (
                  <a
                    key={p.link || p.phone}
                    href={`tel:${phoneTel(p.link || p.phone)}`}
                    className="rounded-xl border border-neutral-200 px-3 py-2 text-sm flex items-center gap-3 hover:border-[#C2410C]"
                    data-testid={`mobile-phone-${p.link || p.phone}`}
                  >
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                        A1
                      </span>
                      <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                        МТС
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-tight text-neutral-900">
                        {p.phone}
                      </span>
                      {p.label && (
                        <span className="mt-0.5 block text-xs leading-tight text-neutral-500">
                          {p.label}
                        </span>
                      )}
                    </span>
                  </a>
                ))}
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Написать в мессенджер
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {socialButtons.map((item, index) => (
                    <button
                      key={`mobile-${item.type || index}`}
                      type="button"
                      onClick={() => {
                        closeMenu();
                        setMessenger({
                          open: true,
                          type: item.type || "telegram",
                        });
                      }}
                      aria-label={item.label}
                      title={item.label}
                      className="grid size-11 place-items-center overflow-hidden rounded-full active:scale-95 transition"
                      style={
                        item.iconAsset
                          ? undefined
                          : { background: item.color || "#111827" }
                      }
                    >
                      {item.iconAsset ? (
                        <img
                          src={item.iconAsset}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs font-bold text-white">
                          {(item.label || "?").slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
      )}

      {messenger.open && (
        <Suspense fallback={null}>
          <MessengerModal
            open={messenger.open}
            onOpenChange={(v) => setMessenger((m) => ({ ...m, open: v }))}
            defaultType={messenger.type}
          />
        </Suspense>
      )}

      {leadOpen && (
        <Suspense fallback={null}>
          <LeadDialog
            open={leadOpen}
            onOpenChange={setLeadOpen}
            tours={tours}
            title="Подобрать тур"
            description="Расскажите, что вам интересно — менеджер поможет с подбором и расскажет о ближайших датах."
          />
        </Suspense>
      )}
    </>
  );
}
