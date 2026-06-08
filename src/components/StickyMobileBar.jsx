import { useMemo, useState } from "react";
import { Phone, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LeadDialog from "@/components/LeadDialog";
import { useSiteData } from "@/lib/useSiteData";

const DEFAULT_CALL_DIRECTIONS = [
  {
    label: "Грузия и Дагестан",
    phones: [{ phone: "636-99-11" }],
  },
  {
    label: "Питер и Карелия",
    phones: [{ phone: "636-22-99" }],
  },
];

const phoneTel = (phone) => {
  return String(phone || "").replace(/[^\d]/g, "");
};

export default function StickyMobileBar() {
  const { settings, tours } = useSiteData();
  const [leadOpen, setLeadOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState(null);

  const callDirections = useMemo(() => {
    if (settings?.call_directions?.length) return settings.call_directions;

    if (settings?.header_phones?.length) {
      return settings.header_phones
        .filter((item) => item?.phone)
        .map((item) => ({
          label: item.label || "Менеджер",
          phones: [item],
        }));
    }

    return DEFAULT_CALL_DIRECTIONS;
  }, [settings]);

  if (!settings) return null;

  return (
    <>
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-3 py-2.5 grid grid-cols-3 gap-2"
        data-testid="sticky-mobile-bar"
      >
        <button
          type="button"
          onClick={() => {
            setSelectedDirection(null);
            setCallOpen(true);
          }}
          className="rounded-full bg-neutral-900 text-white text-xs font-semibold py-3 flex items-center justify-center gap-1.5"
          data-testid="sticky-call-btn"
        >
          <Phone className="size-3.5" /> Звонок
        </button>
        <Button
          onClick={() => setChatOpen(true)}
          variant="outline"
          className="rounded-full text-xs font-semibold py-3 h-auto border-neutral-300"
          data-testid="sticky-messenger-btn"
        >
          <MessageCircle className="size-3.5" /> Чат
        </Button>
        <Button
          onClick={() => setLeadOpen(true)}
          className="rounded-full text-xs font-semibold py-3 h-auto bg-[#C2410C] hover:bg-[#9A3412] text-white"
          data-testid="sticky-cta-btn"
        >
          Заявка
        </Button>
      </div>

      <Dialog open={callOpen} onOpenChange={setCallOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDirection
                ? selectedDirection.label
                : "Выберите направление"}
            </DialogTitle>
          </DialogHeader>

          {!selectedDirection ? (
            <div className="grid gap-2">
              {callDirections.map((direction) => (
                <button
                  key={direction.label}
                  type="button"
                  onClick={() => setSelectedDirection(direction)}
                  className="rounded-2xl border border-neutral-200 px-4 py-3 text-left font-medium hover:border-[#C2410C] hover:bg-orange-50"
                >
                  {direction.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSelectedDirection(null)}
                className="text-sm font-medium text-[#C2410C]"
              >
                ← выбрать другое направление
              </button>
              <div className="grid gap-2">
                {(selectedDirection.phones || []).map((item) => (
                  <a
                    key={`${item.operator}-${item.link}`}
                    href={`tel:${phoneTel(item.link || item.phone)}`}
                    className="rounded-2xl border border-neutral-200 px-4 py-3 hover:border-[#C2410C]"
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                        МТС
                      </span>
                      <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-red-600">
                        A1
                      </span>
                    </div>
                    <span className="block text-lg font-bold text-neutral-900">
                      {item.phone}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Онлайн-чат</DialogTitle>
          </DialogHeader>
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-600">
            Здесь будет виджет чата AmoCRM. Кнопка больше не открывает Telegram.
          </div>
          <Button
            onClick={() => setChatOpen(false)}
            variant="outline"
            className="rounded-full"
          >
            <X className="mr-2 size-4" /> Закрыть
          </Button>
        </DialogContent>
      </Dialog>

      <LeadDialog
        open={leadOpen}
        onOpenChange={setLeadOpen}
        tours={tours}
        title="Подобрать тур"
      />
    </>
  );
}
