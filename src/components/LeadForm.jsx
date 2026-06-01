import { useEffect, useMemo, useState } from "react";
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
import { isValidBelarusPhone, maskBelarusPhone } from "@/lib/phoneMask";

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
  tours,
  dates,
  source_page,
  onSuccess,
  compact = false,
  ctaLabel,
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "+375 ",
    tour: tour || "",
    tour_slug: tour_slug || "",
    date: date || "",
    comment: "",
    consent: false,
    company: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
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
  const onPhone = (e) => update("phone", maskBelarusPhone(e.target.value));

  const validate = () => {
    const err = {};
    if (!isValidBelarusPhone(form.phone))
      err.phone = "Введите номер в формате +375 XX XXX-XX-XX";
    if (!form.consent) err.consent = "Необходимо ваше согласие";
    if (variant === "agency" && !form.company) {
      err.company = "Укажите название агентства";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name || null,
        phone: form.phone,
        tour: form.tour || tour || null,
        tour_slug: form.tour_slug || tour_slug || null,
        region: region || null,
        date: form.date || null,
        comment: form.comment || null,
        consent: form.consent,
        form_type: variant,
        source_page:
          source_page ||
          (typeof window !== "undefined" ? window.location.pathname : null),
        extra:
          variant === "agency"
            ? { company: form.company, email: form.email }
            : null,
      };
      await api.post("/leads", payload);
      toast.success(
        "Заявка отправлена! Менеджер свяжется с вами в ближайшее время.",
      );
      setForm({
        name: "",
        phone: "+375 ",
        tour: tour || "",
        tour_slug: tour_slug || "",
        date: date || "",
        comment: "",
        consent: false,
        company: "",
        email: "",
      });
      onSuccess?.();
    } catch (err) {
      toast.error(
        formatApiErrorDetail(err.response?.data?.detail) ||
          "Не удалось отправить заявку",
      );
    } finally {
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

    const [year, month, day] = date.split("-");
    return `${day}.${month}.${year}`;
  };
  const availableDates = useMemo(() => {
    if (dates?.length) return dates;

    return (selectedTour?.dates || [])
      .filter((d) => d && (d.status === undefined || d.status !== "hidden"))
      .map((d) =>
        typeof d === "string"
          ? formatDate(d)
          : [formatDate(d.start), formatDate(d.end)]
              .filter(Boolean)
              .join(" → "),
      )
      .filter(Boolean);
  }, [dates, selectedTour]);

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

      {availableDates.length > 0 && (variant === "tour" || form.tour_slug) && (
        <div>
          <Label>Актуальная дата</Label>
          <Select
            value={form.date || ""}
            onValueChange={(v) => update("date", v)}
          >
            <SelectTrigger className="mt-1" data-testid="lead-date-select">
              <SelectValue placeholder="Без выбора даты" />
            </SelectTrigger>
            <SelectContent>
              {availableDates.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <a href="/legal" className="underline hover:text-[#C2410C]">
            персональных данных
          </a>{" "}
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
