import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { Loader2, ArrowLeft, Phone } from "lucide-react";

/**
 * Two-step messenger picker.
 *  Step 1: choose tour (formerly "direction").
 *  Step 2: choose specialist responsible for that tour's region → opens deep link.
 */
const MESSENGER_META = {
  viber: { name: "Viber", color: "#7360F2" },
  telegram: { name: "Telegram", color: "#0088CC" },
  whatsapp: { name: "WhatsApp", color: "#25D366" },
};

function messengerLink(type, contact) {
  if (!contact) return "#";
  switch (type) {
    case "viber":
      return `viber://chat?number=${encodeURIComponent(contact)}`;
    case "telegram":
      return contact.startsWith("@")
        ? `https://t.me/${contact.slice(1)}`
        : `https://t.me/${contact}`;
    case "whatsapp": {
      const cleaned = contact.replace(/[^\d]/g, "");
      return `https://wa.me/${cleaned}`;
    }
    default:
      return "#";
  }
}

export default function MessengerModal({
  open,
  onOpenChange,
  defaultType = "telegram",
}) {
  const [type, setType] = useState(defaultType);
  const [tours, setTours] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [picked, setPicked] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(defaultType);
    setPicked(null);
    setLoading(true);
    Promise.all([
      api.get("/tours").then((r) => r.data),
      api.get("/specialists").then((r) => r.data),
    ])
      .then(([t, s]) => {
        setTours(t);
        setSpecialists(s);
      })
      .finally(() => setLoading(false));
  }, [open, defaultType]);

  // Group tours by region_slug so the user picks a region once (one button per region).
  const regions = useMemo(() => {
    const map = new Map();
    tours.forEach((t) => {
      if (!t.region_slug) return;
      if (!map.has(t.region_slug)) {
        map.set(t.region_slug, {
          slug: t.region_slug,
          name: t.region_name || t.title,
          short: t.tagline || t.short_description || "",
        });
      }
    });
    return Array.from(map.values());
  }, [tours]);

  const meta = MESSENGER_META[type];
  const filteredSpecs = picked
    ? specialists.filter((s) => (s.regions || []).includes(picked.slug))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-6 rounded-2xl max-h-[calc(100vh-24px)] overflow-y-auto"
        data-testid="messenger-modal"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl flex items-center gap-2">
            <span style={{ color: meta.color }} className="text-base">●</span> Написать в {meta.name}
          </DialogTitle>
          <DialogDescription>
            {!picked
              ? "Выберите тур, и мы соединим вас с профильным менеджером."
              : `Менеджеры по туру «${picked.name}»:`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 -mt-2 mb-2">
          {Object.entries(MESSENGER_META).map(([t, m]) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                t === type
                  ? "border-neutral-900 text-neutral-900"
                  : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
              }`}
              data-testid={`messenger-type-${t}`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-10 grid place-items-center text-neutral-400">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : !picked ? (
          <div className="grid grid-cols-2 gap-2">
            {regions.map((d) => (
              <button
                key={d.slug}
                type="button"
                onClick={() => setPicked(d)}
                className="text-left rounded-xl border border-neutral-200 px-4 py-3 hover:border-[#C2410C] hover:bg-orange-50/40 transition"
                data-testid={`messenger-region-${d.slug}`}
              >
                <p className="font-medium text-sm">{d.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{d.short}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="text-xs text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1"
              data-testid="messenger-back"
            >
              <ArrowLeft className="size-3" /> Назад к турам
            </button>

            {filteredSpecs.map((s) => {
              const contact = s[type];
              const href = messengerLink(type, contact);
              const disabled = !contact;
              return (
                <a
                  key={s.id}
                  href={disabled ? undefined : href}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                    disabled
                      ? "opacity-50 cursor-not-allowed border-neutral-200"
                      : "border-neutral-200 hover:border-[#C2410C] hover:bg-orange-50/40"
                  }`}
                  data-testid={`messenger-specialist-${s.id}`}
                >
                  <img
                    src={s.photo}
                    alt={s.name}
                    className="size-12 rounded-full object-cover bg-neutral-100"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{s.role}</p>
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: meta.color }}
                  >
                    Написать →
                  </span>
                </a>
              );
            })}

            {filteredSpecs.length === 0 && (
              <p className="text-sm text-neutral-500 py-6 text-center">
                По этому туру менеджер не назначен. Позвоните по общему номеру.
              </p>
            )}

            <div className="pt-2 mt-2 border-t border-neutral-100">
              <a
                href="tel:+375296369911"
                className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-[#C2410C]"
              >
                <Phone className="size-4" /> Или позвоните в офис
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
