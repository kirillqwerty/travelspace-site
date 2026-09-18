const RETURN_KEY = "travelspace-mobile-return";
const MAX_AGE = 2 * 60 * 60 * 1000;

export function readMobileReturn(currentHref = window.location.href) {
  try {
    const current = new URL(currentHref);
    const saved = JSON.parse(window.sessionStorage.getItem(RETURN_KEY) || "{}")[current.pathname + current.search];
    if (!saved || Date.now() - saved.time > MAX_AGE || saved.time > Date.now()) return null;
    const from = new URL(saved.from);
    const to = new URL(saved.to);
    if (from.origin !== current.origin || to.origin !== current.origin ||
        to.pathname !== current.pathname || to.search !== current.search || from.pathname === current.pathname) return null;
    return from.pathname + from.search + from.hash;
  } catch { return null; }
}

export function installMobileReturnNavigation(doc = document) {
  const remember = (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const desktop = window.matchMedia?.("(min-width: 1024px)").matches ?? window.innerWidth >= 1024;
    if (desktop) return;
    const link = event.target?.closest?.("a[href]");
    if (!link || link.hasAttribute("data-navigation-back") || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    try {
      const from = new URL(doc.location.href);
      const to = new URL(link.href, from);
      if (to.origin !== from.origin || to.pathname === from.pathname) return;
      const saved = JSON.parse(window.sessionStorage.getItem(RETURN_KEY) || "{}");
      const entries = Object.entries(saved).filter(([, value]) => value && Date.now() - value.time <= MAX_AGE)
        .sort((a, b) => b[1].time - a[1].time).slice(0, 24);
      window.sessionStorage.setItem(RETURN_KEY, JSON.stringify({ ...Object.fromEntries(entries),
        [to.pathname + to.search]: { from: from.href, to: to.href, time: Date.now() } }));
    } catch { /* Navigation also works when session storage is unavailable. */ }
  };
  // The public bootstrap can prevent the click before React sees it. This
  // document listener still records that same-window document navigation.
  doc.addEventListener("click", remember, true);
  return () => doc.removeEventListener("click", remember, true);
}
