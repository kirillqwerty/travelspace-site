import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import LeadForm from "@/components/LeadForm";

export default function LeadDialog({
  open,
  onOpenChange,
  tour,
  tour_slug,
  region,
  dates,
  selectedDate,
  tours,
  title,
  description,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
    w-[calc(100vw-24px)]
    max-w-md
    max-h-[calc(100vh-24px)]
    overflow-y-auto
    overflow-x-hidden
    p-6
    sm:p-8
    rounded-2xl
  "
        data-testid="lead-dialog"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {title || "Оставить заявку"}
          </DialogTitle>
          <DialogDescription>
            {description ||
              "Менеджер свяжется с вами в течение часа в рабочее время."}
          </DialogDescription>
        </DialogHeader>
        <LeadForm
          variant={tour ? "tour" : "consultation"}
          tour={tour}
          tour_slug={tour_slug}
          region={region}
          tours={tours}
          dates={dates}
          selectedDate={selectedDate}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function useLeadDialog(defaults = {}) {
  const [open, setOpen] = useState(false);
  return {
    open,
    setOpen,
    dialog: <LeadDialog open={open} onOpenChange={setOpen} {...defaults} />,
  };
}
