import { useEffect } from "react";
import { trackPhoneClick } from "@/lib/analytics";

function phoneFromHref(href = "") {
  return href.replace(/^tel:/i, "").trim();
}

export default function PhoneClickAnalytics() {
  useEffect(() => {
    const handlePhoneClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest('a[href^="tel:"]');
      if (!link) return;

      trackPhoneClick({
        phone: phoneFromHref(link.getAttribute("href") || ""),
        linkText: link.textContent?.replace(/\s+/g, " ").trim() || null,
        placement:
          link.dataset.analyticsPlacement ||
          link.getAttribute("aria-label") ||
          null,
      });
    };

    document.addEventListener("click", handlePhoneClick, true);
    return () => document.removeEventListener("click", handlePhoneClick, true);
  }, []);

  return null;
}
