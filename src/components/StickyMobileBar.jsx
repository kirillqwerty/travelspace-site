import { useState } from "react";
import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeadDialog from "@/components/LeadDialog";
import MessengerModal from "@/components/MessengerModal";
import { useSiteData } from "@/lib/useSiteData";

export default function StickyMobileBar() {
  const { settings, tours } = useSiteData();
  const [leadOpen, setLeadOpen] = useState(false);
  const [messengerOpen, setMessengerOpen] = useState(false);

  if (!settings) return null;

  return (
    <>
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-3 py-2.5 grid grid-cols-3 gap-2"
        data-testid="sticky-mobile-bar"
      >
        <a
          href={`tel:${settings.phone_link}`}
          className="rounded-full bg-neutral-900 text-white text-xs font-semibold py-3 flex items-center justify-center gap-1.5"
          data-testid="sticky-call-btn"
        >
          <Phone className="size-3.5" /> Звонок
        </a>
        <Button
          onClick={() => setMessengerOpen(true)}
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
      <LeadDialog
        open={leadOpen}
        onOpenChange={setLeadOpen}
        tours={tours}
        title="Подобрать тур"
      />
      <MessengerModal open={messengerOpen} onOpenChange={setMessengerOpen} />
    </>
  );
}
