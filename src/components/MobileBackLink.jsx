import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { readMobileReturn } from "@/lib/mobileReturn";

export default function MobileBackLink({ fallback, label, ...props }) {
  const location = useLocation();
  const previous = readMobileReturn(new URL(location.pathname + (location.search || ""), window.location.origin).href);
  let matchingReferrer = false;
  try {
    const referrer = new URL(document.referrer);
    const source = new URL(previous, window.location.origin);
    matchingReferrer = referrer.origin === source.origin && referrer.pathname === source.pathname && referrer.search === source.search;
  } catch { /* A noreferrer link has no referrer; use its saved URL instead. */ }
  const historyBack = previous && window.history.length > 1 && (window.history.state?.idx > 0 || matchingReferrer);
  return <Link {...props} data-navigation-back={historyBack ? "history" : "true"} to={previous || fallback} aria-label={previous ? "Вернуться на предыдущую страницу" : label}
    onClick={(event) => {
      if (historyBack && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        window.history.back();
      }
    }}>
    <ArrowLeft className="size-5" />
  </Link>;
}
