export const validFaqItems = (items) =>
  (Array.isArray(items) ? items : []).filter(
    (item) => item?.question?.trim() && item?.answer?.trim(),
  );

export const getStaticPageFaqConfig = (settings, pathname) => {
  // The homepage FAQ has one source: the shared FAQ collection filtered by
  // show_on_home. Legacy seo_pages.home.faq_items must never create a second
  // block below it.
  if (pathname === "/") return null;
  return Object.values(settings?.seo_pages || {}).find(
    (page) => page.path === pathname,
  );
};
