import { useState, useEffect, useMemo } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import MessengerModal from "@/components/MessengerModal";
import LeadDialog from "@/components/LeadDialog";
import { useSiteData } from "@/lib/useSiteData";
import logo from "../assets/travelspace-logo.png";

const PRIMARY_NAV = [
  { to: "/tours", label: "Автобусные туры", dropdown: true },
  { to: "/promotions", label: "Акции" },
  { to: "/blog", label: "Блог" },
  { to: "/about", label: "О нас" },
  { to: "/agencies", label: "Агентствам", desktopOnly: true },
  { to: "/contacts", label: "Контакты" },
];

const ViberSvg = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <g transform="translate(0.4 0)">
      <path d="M12.04 0C5.4 0 0 5.05 0 11.27c0 2.08.62 4.1 1.8 5.86L.62 24l7.05-1.84a12.4 12.4 0 0 0 4.37.8c6.64 0 12.03-5.05 12.03-11.27C24.07 5.05 18.68 0 12.04 0Zm6.99 15.94c-.3.85-1.78 1.63-2.44 1.72-.63.08-1.42.12-4.58-1.18-4.03-1.67-6.63-5.78-6.83-6.05-.2-.27-1.64-2.18-1.64-4.16 0-1.98 1.04-2.95 1.41-3.35.37-.4.8-.5 1.07-.5h.77c.24 0 .56-.09.87.66.3.74 1.03 2.57 1.12 2.75.09.18.15.39.03.63-.12.24-.18.39-.36.6-.18.21-.38.47-.54.63-.18.18-.36.37-.15.72.21.36.94 1.53 2.02 2.47 1.39 1.22 2.56 1.6 2.92 1.78.36.18.57.15.78-.09.21-.24.9-1.05 1.14-1.41.24-.36.48-.3.81-.18.33.12 2.1.98 2.46 1.16.36.18.6.27.69.42.09.15.09.88-.21 1.73Z" />
    </g>
  </svg>
);

const TgSvg = () => (
  <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
    <path d="M9.5 14.5 9.4 18c.3 0 .4-.1.6-.3l1.5-1.4 3.1 2.3c.6.3 1 .2 1.2-.5l2.1-9.9c.2-.9-.3-1.2-.9-1l-12.4 4.8c-.8.3-.8.8-.2 1l3.2 1 7.4-4.7c.4-.2.7-.1.4.2" />
  </svg>
);

const WaSvg = () => (
  <svg viewBox="0 0 32 32" className="size-5" fill="currentColor">
    <g transform="translate(0.8 0)">
      <path d="M19.11 17.2c-.3-.15-1.77-.87-2.05-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.08-.3-.15-1.28-.47-2.43-1.5-.9-.8-1.5-1.8-1.68-2.1-.18-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.52s1.08 2.92 1.23 3.12c.15.2 2.1 3.2 5.08 4.48.7.3 1.25.48 1.68.62.7.22 1.33.18 1.83.1.56-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.27-.2-.57-.35Z" />
      <path d="M16.03 3C8.85 3 3 8.74 3 15.8c0 2.26.6 4.47 1.74 6.42L3 29l6.98-1.82a13.1 13.1 0 0 0 6.05 1.48h.01C23.2 28.66 29 22.92 29 15.86 29 8.8 23.2 3 16.03 3Zm0 23.3h-.01a10.8 10.8 0 0 1-5.5-1.5l-.4-.23-4.14 1.08 1.1-4.03-.26-.42a10.5 10.5 0 0 1-1.62-5.57c0-5.88 4.84-10.66 10.82-10.66 5.97 0 10.82 4.78 10.82 10.66 0 5.88-4.86 10.67-10.83 10.67Z" />
    </g>
  </svg>
);

const MESSENGER_BTNS = [
  { type: "viber", color: "#7360F2", Icon: ViberSvg, label: "Viber" },
  { type: "telegram", color: "#0088CC", Icon: TgSvg, label: "Telegram" },
  { type: "whatsapp", color: "#25D366", Icon: WaSvg, label: "WhatsApp" },
];

export default function Header() {
  const { settings, tours } = useSiteData();

  const [open, setOpen] = useState(false);
  const [toursOpen, setToursOpen] = useState(false);
  const [mobileToursOpen, setMobileToursOpen] = useState(false);
  const [messenger, setMessenger] = useState({
    open: false,
    type: "telegram",
  });
  const [leadOpen, setLeadOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    fn();
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Unique regions (one entry per region_slug, picking the first matching tour)
  const regionLinks = useMemo(() => {
    const map = new Map();
    tours.forEach((t) => {
      if (!t.region_slug) return;
      if (!map.has(t.region_slug)) {
        // Link to first tour of region; we keep the region label for UI
        map.set(t.region_slug, {
          slug: t.region_slug,
          label: t.region_name || t.title,
          tourSlug: t.slug,
        });
      }
    });
    return Array.from(map.values());
  }, [tours]);

  const headerPhones = settings?.header_phones?.length
    ? settings.header_phones
    : [
        {
          label: "Грузия и Дагестан",
          phone: "636-99-11",
          link: "+375296369911",
        },
        {
          label: "Питер и Карелия",
          phone: "636-22-99",
          link: "+375296362299",
        },
      ];

  const headerText = scrolled ? "text-neutral-900" : "text-white";
  const headerMutedText = scrolled ? "text-neutral-700" : "text-white/90";

  const closeMenu = () => {
    setOpen(false);
    setMobileToursOpen(false);
  };

  // Desktop nav (all primary items)
  const desktopNav = PRIMARY_NAV;
  // Mobile nav: per requirements doc:
  //   - "Подобрать тур" не нужен
  //   - "Агентствам" не показываем (только десктоп)
  //   - Туры с подпунктами (раскрытие)
  const mobileNav = PRIMARY_NAV.filter((n) => !n.desktopOnly);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-md border-b border-black/5"
            : "bg-black/25 backdrop-blur-md"
        }`}
        data-testid="site-header"
      >
        {/* TOP INFO BAR */}
        <AnimatePresence>
          {!scrolled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="hidden lg:block border-b border-white/10 overflow-hidden"
              data-testid="header-top-bar"
            >
              <div className="section-container h-11 flex items-center justify-between text-[13px] text-white/90">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col leading-tight">
                    {headerPhones.map((item) => (
                      <a
                        key={item.phone}
                        href={`tel:${item.link}`}
                        className="hover:text-[#F97316] transition-colors"
                        data-testid={`header-phone-${item.link}`}
                      >
                        {item.phone}: {item.label}
                      </a>
                    ))}
                  </div>

                  <span>
                    Эл. почта:{" "}
                    <a
                      href={`mailto:${settings?.email || "info@travel-space.by"}`}
                      className="hover:text-[#F97316]"
                    >
                      {settings?.email || "info@travel-space.by"}
                    </a>
                  </span>

                  <span>Адрес: {settings?.address || "пр-т Независимости 58, Минск"}</span>
                </div>

                <div className="flex items-center gap-6">
                  <span>График работы: {settings?.work_hours || "Ежедневно 10:00–19:00"}</span>
                  <span className="text-[#F97316] font-medium">
                    На связи в Instagram 24/7
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN HEADER */}
        <div
          className={`section-container flex items-center justify-between transition-all duration-500 ${
            scrolled ? "h-16" : "h-20"
          }`}
        >
          <Link to="/" className="flex items-center gap-2 shrink-0" data-testid="header-logo">
            <img
              src={logo}
              alt="TravelSpace logo"
              className={`object-contain transition-all duration-500 ${
                scrolled ? "w-8 h-8" : "w-10 h-10"
              }`}
            />
            <span
              className={`font-heading font-bold tracking-tight transition-all duration-500 ${headerText} ${
                scrolled ? "text-xl" : "text-2xl"
              }`}
            >
              TRAVELSPACE
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            <div
              className="relative"
              onMouseEnter={() => setToursOpen(true)}
              onMouseLeave={() => setToursOpen(false)}
            >
              <NavLink
                to="/tours"
                className={({ isActive }) =>
                  `flex items-center gap-1 transition-colors hover:text-[#F97316] ${
                    isActive || toursOpen ? "text-[#F97316]" : headerMutedText
                  }`
                }
                data-testid="nav-tours"
              >
                Автобусные туры
                <ChevronDown
                  className={`size-4 transition-transform ${
                    toursOpen ? "rotate-180" : ""
                  }`}
                />
              </NavLink>

              {toursOpen && (
                <div className="absolute left-0 top-full pt-4">
                  <div className="w-64 rounded-2xl border border-white/50 bg-white/95 backdrop-blur-xl shadow-2xl p-2">
                    {regionLinks.map((item) => (
                      <NavLink
                        key={item.slug}
                        to={`/tours/${item.tourSlug}`}
                        className={({ isActive }) =>
                          `block rounded-xl px-4 py-2.5 text-sm transition-colors ${
                            isActive
                              ? "bg-orange-50 text-[#C2410C]"
                              : "text-neutral-700 hover:bg-orange-50 hover:text-[#C2410C]"
                          }`
                        }
                        data-testid={`nav-tour-${item.slug}`}
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {PRIMARY_NAV.filter((n) => !n.dropdown).map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `transition-colors hover:text-[#F97316] ${
                    isActive ? "text-[#F97316]" : headerMutedText
                  }`
                }
                data-testid={`nav-${n.to.slice(1) || "home"}`}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          {/* RIGHT SIDE */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-1">
              {MESSENGER_BTNS.map(({ type, color, Icon, label }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMessenger({ open: true, type })}
                  aria-label={label}
                  title={label}
                  className="size-8 rounded-full grid place-items-center text-white hover:scale-110 transition"
                  style={{ background: color }}
                  data-testid={`header-messenger-${type}`}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>

            <Button
              onClick={() => setLeadOpen(true)}
              className="rounded-full bg-[#C2410C] hover:bg-[#9A3412] text-white font-medium px-6"
              data-testid="header-pick-tour-btn"
            >
              Подобрать тур
            </Button>
          </div>

          {/* MOBILE */}
          <div className="flex lg:hidden items-center gap-2">
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

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-testid="mobile-menu"
          >
            <motion.div
              className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              onClick={closeMenu}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                duration: 0.35,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute right-0 top-0 h-full w-[88%] max-w-[360px] bg-white p-4 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <span className="font-heading text-xl font-bold">TRAVELSPACE</span>
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
                        onClick={() => setMobileToursOpen((v) => !v)}
                        className="w-full flex items-center justify-between rounded-xl px-2 py-2.5 text-[16px] font-medium text-neutral-900 hover:bg-neutral-100"
                        data-testid="mobile-nav-tours-toggle"
                      >
                        <span>{n.label}</span>
                        {mobileToursOpen ? (
                          <Minus className="size-4 text-neutral-500" />
                        ) : (
                          <Plus className="size-4 text-neutral-500" />
                        )}
                      </button>
                      <AnimatePresence initial={false}>
                        {mobileToursOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-col gap-0.5 pl-3 py-1">
                              {regionLinks.map((item) => (
                                <NavLink
                                  key={item.slug}
                                  to={`/tours/${item.tourSlug}`}
                                  onClick={closeMenu}
                                  className="rounded-lg px-2 py-2 text-sm text-neutral-700 hover:bg-orange-50 hover:text-[#C2410C]"
                                  data-testid={`mobile-nav-tour-${item.slug}`}
                                >
                                  {item.label}
                                </NavLink>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
                    key={p.link}
                    href={`tel:${p.link}`}
                    className="rounded-xl border border-neutral-200 px-3 py-2 text-sm flex items-center justify-between hover:border-[#C2410C]"
                    data-testid={`mobile-phone-${p.link}`}
                  >
                    <span className="font-medium text-neutral-900">{p.phone}</span>
                    <span className="text-xs text-neutral-500">{p.label}</span>
                  </a>
                ))}
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Написать в мессенджер
                </p>
                <div className="flex items-center gap-2">
                  {MESSENGER_BTNS.map(({ type, color, Icon, label }) => (
                    <button
                      key={`mobile-${type}`}
                      type="button"
                      onClick={() => {
                        closeMenu();
                        setMessenger({ open: true, type });
                      }}
                      aria-label={label}
                      title={label}
                      className="flex-1 h-10 rounded-full grid place-items-center text-white shadow-sm active:scale-95 transition"
                      style={{ background: color }}
                      data-testid={`mobile-messenger-${type}`}
                    >
                      <Icon />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MessengerModal
        open={messenger.open}
        onOpenChange={(v) => setMessenger((m) => ({ ...m, open: v }))}
        defaultType={messenger.type}
      />

      <LeadDialog
        open={leadOpen}
        onOpenChange={setLeadOpen}
        tours={tours}
        title="Подобрать тур"
        description="Расскажите, что вам интересно — менеджер поможет с подбором и расскажет о ближайших датах."
      />
    </>
  );
}
