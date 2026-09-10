export function cleanPagePath(path = "/") {
  return (path.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/");
}

export function readPageBootstrap(doc = document) {
  try {
    const data = JSON.parse(doc.getElementById("page-bootstrap")?.textContent || "null");
    if (data?.version !== 1 || !data.seo || !data.site || typeof data.path !== "string") return null;
    return data;
  } catch { return null; }
}

let bootstrap = typeof document !== "undefined" ? readPageBootstrap() : null;
let pageMounted = false;
const mountListeners = new Set();

export const isPageMounted = () => pageMounted;
export function subscribePageMount(listener) {
  mountListeners.add(listener);
  return () => mountListeners.delete(listener);
}

export function getPageBootstrap(path = typeof window !== "undefined" ? window.location.pathname : "/") {
  return bootstrap && cleanPagePath(bootstrap.path) === cleanPagePath(path) ? bootstrap : null;
}

export function getInitialSiteData() { return bootstrap?.site || null; }
export function getInitialCollection(name) { return bootstrap?.collections?.[name] || []; }
export function invalidatePageBootstrap() { bootstrap = null; }

export function preserveServerPage(doc = document) {
  // Admin routes do not use the public-page readiness lifecycle. An older
  // backend may still include a SEO snapshot here: discard it, never hide React.
  if (/^\/admin(?:\/|$)/.test(doc.location?.pathname || "")) {
    completePageMount(doc);
    return;
  }
  const root = doc.getElementById("root");
  const snapshot = root?.querySelector("[data-seo-prerender]");
  if (snapshot) {
    root.before(snapshot);
    root.hidden = true;
    // Keep the branded cover over the server snapshot until React has
    // committed the real page. The snapshot remains in the DOM for crawlers,
    // while visitors see a polished loading state instead of raw HTML.
  }
}

export function completePageMount(doc = document) {
  const root = doc.getElementById("root");
  if (root) root.hidden = false;
  doc.querySelector("[data-seo-prerender]")?.remove();
  doc.getElementById("server-page-style")?.remove();
  doc.getElementById("initial-load-cover")?.remove();
  if (!pageMounted) {
    pageMounted = true;
    mountListeners.forEach((listener) => listener());
  }
}

export function publicNavigationUrl(event, location = window.location) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const link = event.target?.closest?.("a[href]");
  if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return null;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin || cleanPagePath(url.pathname) === cleanPagePath(location.pathname)) return null;
  if (!/^\/(?:$|tours(?:\/[^/]+)?\/?$|blog(?:\/[^/]+)?\/?$|about\/?$|contacts\/?$|faq\/?$|promotions\/?$|reviews\/?$|agencies\/?$|payment\/?$|legal\/?$)/.test(url.pathname)) return null;
  return url.href;
}

export function installPublicNavigation(doc = document, navigate = (url) => window.location.assign(url)) {
  if (!bootstrap) return () => {};
  const handle = (event) => {
    const url = publicNavigationUrl(event);
    if (!url) return;
    event.preventDefault();
    event.stopPropagation();
    navigate(url);
  };
  doc.addEventListener("click", handle, true);
  return () => doc.removeEventListener("click", handle, true);
}
