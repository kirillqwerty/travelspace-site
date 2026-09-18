import { forwardRef, useSyncExternalStore } from "react";

const DESKTOP_QUERY = "(min-width: 1024px)";

function desktopSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.(DESKTOP_QUERY).matches ?? window.innerWidth >= 1024;
}

function subscribeDesktop(onChange) {
  const media = window.matchMedia?.(DESKTOP_QUERY);
  if (!media) {
    window.addEventListener("resize", onChange);
    return () => window.removeEventListener("resize", onChange);
  }
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

// Use the same breakpoint as the desktop navigation. Native links retain
// keyboard shortcuts, downloads and normal browser/app protocol handling.
const ResponsiveLink = forwardRef(function ResponsiveLink(
  { as: Component = "a", target, rel, href, to, ...props }, ref,
) {
  const desktop = useSyncExternalStore(subscribeDesktop, desktopSnapshot, () => false);
  const destination = typeof (href ?? to) === "string" ? href ?? to : "";
  const sameContext = destination.startsWith("#") || /^(?:tel:|mailto:|sms:|viber:|tg:|whatsapp:)/i.test(destination);
  const resolvedTarget = target === "_blank" ? desktop && !sameContext ? "_blank" : undefined : target;
  const resolvedRel = resolvedTarget === "_blank"
    ? [...new Set(`${rel || ""} noopener noreferrer`.trim().split(/\s+/))].join(" ")
    : rel;
  return <Component {...props} {...(href !== undefined ? { href } : {})} {...(to !== undefined ? { to } : {})} ref={ref} target={resolvedTarget} rel={resolvedRel} />;
});

export default ResponsiveLink;
