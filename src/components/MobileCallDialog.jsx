import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { normalizePhoneForTel } from "@/lib/tourContact";

export default function MobileCallDialog({ open, onOpenChange, directions }) {
  const [selectedDirection, setSelectedDirection] = useState(null);

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) setSelectedDirection(null);
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle>
            {selectedDirection?.label || "Выберите направление"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Выберите направление и номер телефона для звонка.
          </DialogDescription>
        </DialogHeader>

        {!selectedDirection ? (
          <div className="grid gap-2">
            {directions.map((direction) => (
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
              {(selectedDirection.phones || []).map((item, index) => {
                const phone = item.link || item.phone;
                return (
                  <a
                    key={`${selectedDirection.label}-${phone}-${index}`}
                    href={`tel:${normalizePhoneForTel(phone)}`}
                    data-analytics-placement="sticky-call-dialog"
                    className="rounded-2xl border border-neutral-200 px-4 py-3 hover:border-[#C2410C]"
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">МТС</span>
                      <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-red-600">A1</span>
                    </div>
                    <span className="block text-lg font-bold text-neutral-900">
                      {item.phone}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
