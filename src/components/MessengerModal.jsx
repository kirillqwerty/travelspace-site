import ResponsiveLink from "@/components/ResponsiveLink";
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { RichInline } from "@/lib/richText";
import { Loader2, Phone } from "lucide-react";

const MESSENGER_META = {
  viber: { name: "Viber", color: "#7360F2" },
  telegram: { name: "Telegram", color: "#0088CC" },
  whatsapp: { name: "WhatsApp", color: "#25D366" },
};

const DEFAULT_HEADER_PHONES = [
  { label: "Грузия", phone: "636-99-11", link: "6369911" },
  { label: "Дагестан, Питер и Карелия", phone: "636-22-99", link: "6362299" },
];

const REGION_CONTACT_KEYWORDS = {
  dagestan: ["дагестан"],
  kareliya: ["карел"],
  "sankt-peterburg": ["питер", "петербург", "санкт"],
  "saint-petersburg": ["питер", "петербург", "санкт"],
  kobuleti: ["груз", "кобулети"],
  georgia: ["груз", "кобулети"],
  "georgia-kobuleti": ["груз", "кобулети"],
};

const REGION_DISPLAY_NAMES = {
  dagestan: "Дагестан",
  kareliya: "Карелия",
  "sankt-peterburg": "Санкт-Петербург",
  "saint-petersburg": "Санкт-Петербург",
  kobuleti: "Грузия",
  georgia: "Грузия",
  "georgia-kobuleti": "Грузия",
};

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .trim();
}

function normalizePhoneDigits(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function toInternationalPhone(value) {
  const raw = String(value || "").trim();
  const digits = normalizePhoneDigits(raw);

  if (!digits) return "";

  if (raw.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }

  if (digits.startsWith("375") && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.length === 7) {
    return `+37529${digits}`;
  }

  if (digits.length === 9 && digits.startsWith("29")) {
    return `+375${digits}`;
  }

  if (digits.length >= 10) {
    return `+${digits}`;
  }

  return digits;
}

function normalizeExternalUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return url;
  if (/^t\.me\//i.test(url)) return `https://${url}`;

  return url;
}

function cleanTelegramUsername(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/t\.me\//i, "")
    .replace(/^t\.me\//i, "")
    .replace(/^\/+/, "");
}

function messengerLink(type, contact) {
  const value = String(contact || "").trim();
  if (!value) return "";

  const externalUrl = normalizeExternalUrl(value);

  switch (type) {
    case "viber": {
      if (/^viber:\/\//i.test(externalUrl)) return externalUrl;

      return `viber://chat?number=${encodeURIComponent(toInternationalPhone(value))}`;
    }

    case "telegram": {
      if (/^https?:\/\/t\.me\//i.test(externalUrl)) return externalUrl;
      if (/^tg:\/\//i.test(externalUrl)) return externalUrl;

      const username = cleanTelegramUsername(value);
      if (username && !/^\+?\d+$/.test(username))
        return `https://t.me/${username}`;

      const digits = normalizePhoneDigits(value);
      if (digits) return `https://t.me/+${digits}`;

      return "";
    }

    case "whatsapp": {
      if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(externalUrl)) {
        return externalUrl;
      }

      const cleaned = normalizePhoneDigits(toInternationalPhone(value));
      return cleaned ? `https://wa.me/${cleaned}` : "";
    }

    default:
      return "";
  }
}

function getMessengerLinkProps(href) {
  const url = String(href || "").toLowerCase();

  // Для мессенджеров не ставим target="_blank" и не используем window.open.
  // Так Chrome/iOS воспринимает клик как прямой пользовательский переход.
  if (
    url.startsWith("viber://") ||
    url.startsWith("tg://") ||
    url.includes("t.me/") ||
    url.includes("wa.me/") ||
    url.includes("api.whatsapp.com/")
  ) {
    return {};
  }

  return { target: "_blank", rel: "noreferrer" };
}

function getRegionKeywords(region) {
  const slug = normalizeText(region?.slug);
  const predefined = REGION_CONTACT_KEYWORDS[slug] || [];
  const fromRegion = [region?.name, region?.title, slug]
    .map(normalizeText)
    .filter(Boolean);

  return Array.from(new Set([...predefined, ...fromRegion]));
}

function getDirectionName(region) {
  const slug = normalizeText(region?.slug);
  return (
    REGION_DISPLAY_NAMES[slug] || region?.name || region?.title || "Направление"
  );
}

function getHeaderPhoneForRegion(headerPhones, region) {
  const phones =
    Array.isArray(headerPhones) && headerPhones.length
      ? headerPhones
      : DEFAULT_HEADER_PHONES;

  const keywords = getRegionKeywords(region);

  return (
    phones.find((item) => {
      const label = normalizeText(item?.label);
      return keywords.some((keyword) => keyword && label.includes(keyword));
    }) ||
    phones[0] ||
    null
  );
}

export default function MessengerModal({
  open,
  onOpenChange,
  defaultType = "telegram",
}) {
  const [type, setType] = useState(defaultType);
  const [tours, setTours] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [missingContactSlug, setMissingContactSlug] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setType(defaultType);
    setMissingContactSlug("");
    setLoading(true);

    Promise.all([
      api
        .get("/tours")
        .then((r) => r.data)
        .catch(() => []),
      api
        .get("/settings")
        .then((r) => r.data)
        .catch(() => ({})),
    ])
      .then(([nextTours, nextSettings]) => {
        if (cancelled) return;
        setTours(Array.isArray(nextTours) ? nextTours : []);
        setSettings(nextSettings || {});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, defaultType]);

  const headerPhones = settings?.header_phones?.length
    ? settings.header_phones
    : DEFAULT_HEADER_PHONES;

  const regions = useMemo(() => {
    const map = new Map();

    tours.forEach((tour) => {
      if (!tour.region_slug) return;

      if (!map.has(tour.region_slug)) {
        const region = {
          slug: tour.region_slug,
          name: tour.region_name || tour.title,
          title: tour.title,
          short: tour.tagline || tour.short_description || "",
        };

        map.set(tour.region_slug, {
          ...region,
          name: getDirectionName(region),
        });
      }
    });

    return Array.from(map.values());
  }, [tours]);

  const meta = MESSENGER_META[type];
  const officePhone = toInternationalPhone(
    settings?.phone || headerPhones?.[0]?.link || headerPhones?.[0]?.phone,
  );

  const getMessengerHrefForRegion = (region) => {
    const directionPhone = getHeaderPhoneForRegion(headerPhones, region);
    const contact = toInternationalPhone(
      directionPhone?.link || directionPhone?.phone,
    );

    return messengerLink(type, contact);
  };

  const handleMissingContact = (region) => {
    setMissingContactSlug(region.slug);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-6 rounded-2xl max-h-[calc(100vh-24px)] overflow-y-auto"
        data-testid="messenger-modal"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl flex items-center gap-2">
            <span style={{ color: meta.color }} className="text-base">
              ●
            </span>{" "}
            Написать в {meta.name}
          </DialogTitle>
          <DialogDescription>
            Выберите направление — чат откроется сразу на номер из шапки сайта.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 grid place-items-center text-neutral-400">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {regions.map((direction) => {
                const isMissing = missingContactSlug === direction.slug;
                const directionPhone = getHeaderPhoneForRegion(
                  headerPhones,
                  direction,
                );

                const href = getMessengerHrefForRegion(direction);
                const commonClassName = `text-left rounded-xl border px-4 py-3 transition ${
                  isMissing
                    ? "border-red-200 bg-red-50"
                    : "border-neutral-200 hover:border-[#C2410C] hover:bg-orange-50/40"
                }`;
                const content = (
                  <>
                    <p className="font-medium text-sm">{direction.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                      {directionPhone?.phone || (
                        <RichInline text={direction.short} links={false} />
                      )}
                    </p>
                    {isMissing && (
                      <p className="mt-2 text-[11px] text-red-600">
                        Контакт для этого направления пока не указан в шапке.
                      </p>
                    )}
                  </>
                );

                if (!href) {
                  return (
                    <button
                      key={direction.slug}
                      type="button"
                      onClick={() => handleMissingContact(direction)}
                      className={commonClassName}
                      data-testid={`messenger-region-${direction.slug}`}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <ResponsiveLink
                    key={direction.slug}
                    href={href}
                    onClick={() => {
                      setMissingContactSlug("");
                      window.setTimeout(() => onOpenChange?.(false), 300);
                    }}
                    className={commonClassName}
                    data-testid={`messenger-region-${direction.slug}`}
                    {...getMessengerLinkProps(href)}
                  >
                    {content}
                  </ResponsiveLink>
                );
              })}
            </div>

            <div className="pt-2 border-t border-neutral-100">
              <ResponsiveLink
                href={`tel:${normalizePhoneDigits(officePhone)}`}
                className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-[#C2410C]"
              >
                <Phone className="size-4" /> Или позвоните в офис
              </ResponsiveLink>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
