import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { api, formatApiErrorDetail } from "@/lib/api";
import {
  createEventId,
  getAttribution,
  savePendingLeadConversion,
} from "@/lib/analytics";
import { isValidPhone, maskPhone } from "@/lib/phoneMask";
import { getSpecialDateLabel } from "@/lib/tourSpecialDates";

function parseDateTime(value) {
  if (!value) return Number.MAX_SAFE_INTEGER;

  const time = Date.parse(value);

  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}

function isDepartureDateActual(date) {
  if (!date || typeof date === "string") return true;

  const sourceTime = parseDateTime(date.start || date.date_start || date.end);
  if (sourceTime === Number.MAX_SAFE_INTEGER) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return sourceTime >= today.getTime();
}

function hasDatePriceValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function isPromotionDepartureDate(date) {
  return (
    date &&
    typeof date !== "string" &&
    date.promotion_active === true &&
    (hasDatePriceValue(date.promotion_price) ||
      hasDatePriceValue(date.promotion_additional_price))
  );
}

function collectTourDates(tour) {
  if (!tour) return [];

  const mainDates = Array.isArray(tour.dates) ? tour.dates : [];
  const chainDates = Array.isArray(tour.chains)
    ? tour.chains.filter((chain) => chain?.active !== false).flatMap((chain) => Array.isArray(chain?.dates) ? chain.dates : [])
    : [];
  if (tour.show_chain_dates === false) return mainDates.length ? mainDates : chainDates;
  return tour.use_hotel_chains ? (chainDates.length ? chainDates : mainDates) : (mainDates.length ? mainDates : chainDates);
}

/**
 * Reusable lead form.
 *
 * props:
 *  - variant: 'consultation' | 'tour' | 'agency'
 *  - tour, tour_slug, region, date: pre-fill values
 *  - tours: optional list (for tour picker on consultation form)
 *  - dates: optional array of strings (for tour-page date picker)
 *  - source_page: text marker
 *  - onSuccess: callback
 *  - compact: render in a tighter layout
 */
export default function LeadForm({
  variant = "consultation",
  tour,
  tour_slug,
  region,
  date,
  selectedDate,
  selectedHotel,
  selectedRoom,
  selectedMealPlan,
  selectedFinalPrice,
  tours,
  dates,
  source_page,
  onSuccess,
  compact = false,
  ctaLabel,
}) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    tour: tour || "",
    tour_slug: tour_slug || "",
    date: date || "",
    travelers_count: "",
    comment: "",
    consent: true,
    company: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (selectedDate) {
      setForm((prev) => ({
        ...prev,
        date: selectedDate,
      }));
    }
  }, [selectedDate]);
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const onPhone = (e) => {
    update("phone", maskPhone(e.target.value));
  };

  const onPhoneFocus = () => {
    if (!form.phone) {
      update("phone", "+375 ");
    }
  };

  const validate = () => {
    const err = {};
    if (!isValidPhone(form.phone))
      err.phone = "Введите корректный номер телефона";
    if (!form.consent) err.consent = "Необходимо ваше согласие";
    if (variant === "agency" && !form.company) {
      err.company = "Укажите название агентства";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submittingRef.current || submitting) return;
    if (!validate()) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const eventId = createEventId("lead");
      const attribution = getAttribution();
      const currentPage =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search + window.location.hash
          : null;
      const pageUrl =
        typeof window !== "undefined" ? window.location.href : null;
      const selectedTourTitle = form.tour || tour || null;
      const selectedTourSlug = form.tour_slug || tour_slug || null;

      const payload = {
        name: form.name || null,
        phone: form.phone,
        tour: selectedTourTitle,
        tour_slug: selectedTourSlug,
        region: region || null,
        date: form.date || null,
        travelers_count: form.travelers_count ? Number(form.travelers_count) : null,
        comment: form.comment || null,
        consent: form.consent,
        form_type: variant,
        source_page: source_page || currentPage,
        event_id: eventId,
        page_url: pageUrl,
        landing_page: attribution.landing_page,
        referrer: attribution.referrer,
        utm: attribution.utm,
        click_ids: attribution.click_ids,
        extra:
          variant === "agency"
            ? {
                company: form.company,
                email: form.email,
              }
            : selectedHotel
              ? {
                  hotel: selectedHotel,
                  room: selectedRoom,
                  meal_plan: selectedMealPlan || null,
                  final_price: selectedFinalPrice || null,
                }
              : null,
      };
      await api.post("/leads", payload);
      savePendingLeadConversion({
        eventId,
        tourTitle: selectedTourTitle,
        tourSlug: selectedTourSlug,
        formType: variant,
      });
      toast.success(
        "Заявка отправлена! Менеджер свяжется с вами в ближайшее время.",
      );
      setForm({
        name: "",
        phone: "",
        tour: tour || "",
        tour_slug: tour_slug || "",
        date: date || "",
        travelers_count: "",
        comment: "",
        consent: true,
        company: "",
        email: "",
      });
      onSuccess?.();
      navigate("/thanks");
    } catch (err) {
      toast.error(
        formatApiErrorDetail(err.response?.data?.detail) ||
          "Не удалось отправить заявку",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const tourOptions = tours && tours.length ? tours : null;
  // When a tour is picked on the consultation form, its own dates feed the date picker.
  const selectedTour = tourOptions?.find(
    (t) => t.title === form.tour || t.slug === form.tour_slug,
  );
  const formatDate = (date) => {
    if (!date) return "";

    const [year, month, day] = String(date).split("-");
    return `${day}.${month}.${year}`;
  };
  const availableDateOptions = useMemo(() => {
    const sourceDates = dates?.length ? dates : collectTourDates(selectedTour);
    const seen = new Map();

    sourceDates
      .filter((d) => {
        if (!d) return false;
        if (typeof d === "string") return true;
        return d.status !== "hidden" && isDepartureDateActual(d);
      })
      .sort((a, b) => {
        if (typeof a === "string" || typeof b === "string") return 0;
        return (
          parseDateTime(a.start || a.end) - parseDateTime(b.start || b.end)
        );
      })
      .forEach((d) => {
        const label =
          typeof d === "string"
            ? d
            : [formatDate(d.start), formatDate(d.end)]
                .filter(Boolean)
                .join(" → ");

        if (!label) return;

        const isPromotion = isPromotionDepartureDate(d);
        const specialLabel =
          typeof d === "string" ? "" : getSpecialDateLabel(d);
        const existing = seen.get(label);

        if (existing) {
          existing.isPromotion = existing.isPromotion || isPromotion;
          existing.specialLabel = existing.specialLabel || specialLabel;
          return;
        }

        seen.set(label, {
          label,
          isPromotion,
          specialLabel,
        });
      });

    return Array.from(seen.values());
  }, [dates, selectedTour]);

  const selectedDateOption = availableDateOptions.find(
    (option) => option.label === form.date,
  );

  return (
    <form
      onSubmit={submit}
      className={compact ? "space-y-3" : "space-y-4"}
      data-testid="lead-form"
    >
      {variant === "agency" && (
        <div>
          <Label htmlFor="lf-company">Название агентства *</Label>
          <Input
            id="lf-company"
            data-testid="lead-company-input"
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Туристическое агентство Альфа"
            className="mt-1"
          />
          {errors.company && (
            <p className="text-xs text-red-600 mt-1">{errors.company}</p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="lf-name">Имя</Label>
        <Input
          id="lf-name"
          data-testid="lead-name-input"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Как к вам обращаться"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="lf-phone">Телефон *</Label>
        <Input
          id="lf-phone"
          data-testid="lead-phone-input"
          value={form.phone}
          onChange={onPhone}
          onFocus={onPhoneFocus}
          inputMode="tel"
          placeholder="+375 XX XXX-XX-XX"
          className="mt-1"
        />
        {errors.phone && (
          <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
        )}
      </div>

      {variant === "agency" && (
        <div>
          <Label htmlFor="lf-email">Email</Label>
          <Input
            id="lf-email"
            data-testid="lead-email-input"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="company@example.com"
            className="mt-1"
          />
        </div>
      )}

      {tourOptions && variant === "consultation" && (
        <div>
          <Label>Интересующий тур</Label>
          <Select
            value={form.tour_slug || ""}
            onValueChange={(slug) => {
              const picked = tourOptions.find((t) => t.slug === slug);
              setForm((f) => ({
                ...f,
                tour_slug: slug,
                tour: picked?.title || "",
                date: "",
              }));
            }}
          >
            {/* <SelectTrigger className="mt-1" data-testid="lead-tour-select">
              <SelectValue placeholder="Любой — менеджер подберёт" />
            </SelectTrigger> */}
            <SelectTrigger
              className="mt-1 w-full max-w-full overflow-hidden"
              data-testid="lead-tour-select"
            >
              <SelectValue placeholder="Выберите тур" className="truncate" />
            </SelectTrigger>
            <SelectContent>
              {tourOptions.map((t) => (
                // <SelectItem key={t.slug} value={t.slug}>
                //   {t.region_name ? `${t.region_name} · ` : ""}
                //   {t.title}
                // </SelectItem>
                <SelectItem
                  key={t.slug || t.id}
                  value={t.slug || t.id}
                  className="max-w-[calc(100vw-64px)]"
                >
                  <span className="block max-w-[320px] truncate">
                    {t.region ? `${t.region} · ` : ""}
                    {t.title || t.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {availableDateOptions.length > 0 &&
        (variant === "tour" || form.tour_slug) && (
          <div>
            <Label>Актуальная дата</Label>
            <Select
              value={form.date || ""}
              onValueChange={(v) => update("date", v)}
            >
              <SelectTrigger className="mt-1" data-testid="lead-date-select">
                {form.date ? (
                  <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <span className="truncate">{form.date}</span>
                    {selectedDateOption?.isPromotion && (
                      <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600">
                        акция
                      </span>
                    )}
                    {selectedDateOption?.specialLabel && (
                      <span className="max-w-[8rem] shrink-0 truncate rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                        {selectedDateOption.specialLabel}
                      </span>
                    )}
                  </span>
                ) : (
                  <SelectValue placeholder="Без выбора даты" />
                )}
              </SelectTrigger>
              <SelectContent className="max-h-[240px] overflow-y-auto">
                {availableDateOptions.map((option) => (
                  <SelectItem
                    key={option.label}
                    value={option.label}
                    className="py-2"
                  >
                    <span className="flex min-w-0 items-center gap-2 pr-2">
                      <span className="truncate">{option.label}</span>
                      {option.isPromotion && (
                        <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-600">
                          акция
                        </span>
                      )}
                      {option.specialLabel && (
                        <span className="max-w-[9rem] shrink-0 truncate rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                          {option.specialLabel}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      {variant !== "agency" && (
        <div>
          <Label htmlFor="lf-travelers-count">Количество человек</Label>
          <Input id="lf-travelers-count" type="number" min="1" max="100" inputMode="numeric" value={form.travelers_count} onChange={(e) => update("travelers_count", e.target.value)} placeholder="Например, 2" className="mt-1" />
        </div>
      )}
      {selectedHotel && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-sm">
            <span className="font-medium">Отель:</span> {selectedHotel}
          </p>

          <p className="text-sm mt-1">
            <span className="font-medium">Номер:</span> {selectedRoom}
          </p>

          {selectedMealPlan && (
            <p className="text-sm mt-1">
              <span className="font-medium">Питание:</span> {selectedMealPlan}
            </p>
          )}

          {selectedFinalPrice && (
            <p className="text-sm mt-1">
              <span className="font-medium">Стоимость:</span>{" "}
              {selectedFinalPrice}
            </p>
          )}
        </div>
      )}
      <div>
        <Label htmlFor="lf-comment">Комментарий</Label>
        <Textarea
          id="lf-comment"
          data-testid="lead-comment-input"
          value={form.comment}
          onChange={(e) => update("comment", e.target.value)}
          placeholder="Сколько человек, какие пожелания…"
          className="mt-1 min-h-[80px]"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-neutral-600">
        <Checkbox
          checked={form.consent}
          onCheckedChange={(v) => update("consent", !!v)}
          className="mt-1"
          data-testid="lead-consent-checkbox"
        />
        <span>
          Я согласен на обработку{" "}
          <Link to="/legal" className="underline hover:text-[#C2410C]">
            персональных данных
          </Link>{" "}
          и принимаю условия публичного договора.
        </span>
      </label>
      {errors.consent && (
        <p className="text-xs text-red-600">{errors.consent}</p>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[#C2410C] hover:bg-[#9A3412] text-white py-6 text-base"
        data-testid="lead-submit-button"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" /> Отправляем…
          </>
        ) : (
          <>
            <Send className="size-4 mr-2" /> {ctaLabel || "Оставить заявку"}
          </>
        )}
      </Button>
    </form>
  );
}
