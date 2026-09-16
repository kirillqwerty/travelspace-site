import { lazy, Suspense, useMemo, useState } from "react";
import { Phone } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSiteData } from "@/lib/useSiteData";
import {
  getCurrentTourFromPath,
  getPhoneForTour,
} from "@/lib/tourContact";

const LeadDialog = lazy(() => import("@/components/LeadDialog"));
const MobileCallDialog = lazy(() => import("@/components/MobileCallDialog"));

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

export default function StickyMobileBar() {
  const { settings, tours } = useSiteData();
  const { pathname } = useLocation();
  const [leadOpen, setLeadOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);

  const callDirections = useMemo(() => {
    if (settings?.call_directions?.length) return settings.call_directions;

    if (settings?.header_phones?.length) {
      return settings.header_phones
        .filter((item) => item?.phone)
        .map((item) => ({
          label: item.label || "Направление",
          phones: [item],
        }));
    }

    return DEFAULT_CALL_DIRECTIONS;
  }, [settings]);

  const currentTour = useMemo(
    () => getCurrentTourFromPath(tours, pathname),
    [pathname, tours],
  );
  const currentTourPhone = useMemo(
    () => getPhoneForTour(currentTour, settings?.header_phones),
    [currentTour, settings?.header_phones],
  );

  if (!settings) return null;

  return (
    <>
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-3 py-2.5 grid grid-cols-2 gap-2"
        data-testid="sticky-mobile-bar"
      >
        {currentTourPhone ? (
          <a
            href={`tel:${currentTourPhone.tel}`}
            aria-label={`Позвонить по туру «${currentTour.title}»`}
            data-analytics-placement="sticky-tour-call"
            className="flex items-center justify-center gap-1.5 rounded-full bg-neutral-900 py-3 text-xs font-semibold text-white"
            data-testid="sticky-call-btn"
          >
            <Phone className="size-3.5" /> Звонок
          </a>
        ) : (
          <button
            type="button"
            onClick={() => {
              setCallOpen(true);
            }}
            className="rounded-full bg-neutral-900 text-white text-xs font-semibold py-3 flex items-center justify-center gap-1.5"
            data-testid="sticky-call-btn"
          >
            <Phone className="size-3.5" /> Звонок
          </button>
        )}

        <Button
          onClick={() => setLeadOpen(true)}
          className="rounded-full text-xs font-semibold py-3 h-auto bg-[#C2410C] hover:bg-[#9A3412] text-white"
          data-testid="sticky-cta-btn"
        >
          Заявка
        </Button>
      </div>

      {callOpen && (
        <Suspense fallback={null}>
          <MobileCallDialog
            open={callOpen}
            onOpenChange={setCallOpen}
            directions={callDirections}
          />
        </Suspense>
      )}

      {leadOpen && (
        <Suspense fallback={null}>
          <LeadDialog
            open={leadOpen}
            onOpenChange={setLeadOpen}
            tours={tours}
            tour={currentTour?.title}
            tour_slug={currentTour?.slug}
            region={currentTour?.region_slug}
            title={currentTour ? "Заявка на тур" : "Подобрать тур"}
          />
        </Suspense>
      )}
    </>
  );
}
