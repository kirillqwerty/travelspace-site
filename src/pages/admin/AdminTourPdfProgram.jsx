import { memo, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  FileText,
  GripVertical,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api, API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const EMPTY_PROGRAM = {
  intro: "",
  days: [],
  included: [],
  excluded: [],
  important_info: [],
  show_info_blocks: true,
};

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `pdf-day-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeProgram(value = {}) {
  return {
    ...EMPTY_PROGRAM,
    ...value,
    intro: value.intro || "",
    days: Array.isArray(value.days)
      ? value.days.map((day, index) => ({
          id: day?.id || uid(),
          day: day?.day ?? String(index + 1),
          title: day?.title || "",
          description: day?.description || day?.text || "",
        }))
      : [],
    included: Array.isArray(value.included) ? value.included : [],
    excluded: Array.isArray(value.excluded) ? value.excluded : [],
    important_info: Array.isArray(value.important_info)
      ? value.important_info
      : [],
    show_info_blocks: value.show_info_blocks !== false,
  };
}

const CompactStringList = memo(function CompactStringList({
  label,
  hint,
  value,
  onChange,
}) {
  const items = Array.isArray(value) ? value : [];

  const updateItem = (index, nextValue) => {
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index ? nextValue : item,
      ),
    );
  };

  const removeItem = (index) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label className="font-semibold text-neutral-900">{label}</Label>
          {hint && (
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              {hint}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, ""])}
          className="shrink-0"
        >
          <Plus className="mr-1 size-3.5" /> Добавить
        </Button>
      </div>

      <div className="mt-3 space-y-2">
        {items.length === 0 && (
          <p className="rounded-xl bg-neutral-50 px-3 py-3 text-xs text-neutral-500">
            Пункты не добавлены.
          </p>
        )}

        {items.map((item, index) => (
          <div key={`${label}-${index}`} className="flex items-center gap-2">
            <Input
              value={item || ""}
              onChange={(event) => updateItem(index, event.target.value)}
              placeholder="Короткий пункт"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeItem(index)}
              aria-label="Удалить пункт"
              className="shrink-0 text-red-600"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
});

const ProgramDay = memo(function ProgramDay({
  day,
  index,
  expanded,
  isDragging,
  isDragOver,
  onToggle,
  onUpdate,
  onRemove,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  return (
    <article
      className={`rounded-2xl border bg-white transition ${
        isDragging
          ? "border-orange-300 opacity-50"
          : isDragOver
            ? "border-[#C2410C] ring-2 ring-orange-100"
            : "border-neutral-200"
      }`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-3 p-3 sm:p-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={expanded}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#C2410C] text-xs font-bold text-white">
            {day.day || index + 1}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-neutral-900">
              {day.title || `День ${day.day || index + 1}`}
            </span>
            <span className="mt-0.5 block truncate text-xs text-neutral-500">
              {day.description || "Описание пока не заполнено"}
            </span>
          </span>
          <ChevronDown
            className={`ml-auto size-4 shrink-0 text-neutral-400 transition ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", day.id);
              onDragStart();
            }}
            onDragEnd={onDragEnd}
            onClick={(event) => event.stopPropagation()}
            className="grid size-10 cursor-grab place-items-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#C2410C] active:cursor-grabbing"
            aria-label="Перетащить день"
            title="Зажмите и перетащите, чтобы изменить порядок"
          >
            <GripVertical className="size-5" />
          </button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRemove}
            aria-label="Удалить день"
            className="text-red-600"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-neutral-100 p-4">
          <div className="grid gap-3 lg:grid-cols-[120px_minmax(0,1fr)]">
            <div>
              <Label className="text-xs">День</Label>
              <Input
                value={day.day ?? ""}
                onChange={(event) => onUpdate({ day: event.target.value })}
                placeholder="1 или 5-7"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Короткий заголовок</Label>
              <Input
                value={day.title || ""}
                onChange={(event) => onUpdate({ title: event.target.value })}
                placeholder="Прибытие и обзорная экскурсия"
                maxLength={90}
                className="mt-1"
              />
              <p className="mt-1 text-right text-[11px] text-neutral-400">
                {(day.title || "").length}/90
              </p>
            </div>
          </div>

          <div className="mt-3">
            <Label className="text-xs">Краткое описание</Label>
            <Textarea
              value={day.description || ""}
              onChange={(event) =>
                onUpdate({ description: event.target.value })
              }
              placeholder="Только ключевые события дня — без длинных деталей."
              rows={3}
              maxLength={240}
              className="mt-1"
            />
            <p className="mt-1 text-right text-[11px] text-neutral-400">
              {(day.description || "").length}/240
            </p>
          </div>
        </div>
      )}
    </article>
  );
});

export default function AdminTourPdfProgram() {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [program, setProgram] = useState(EMPTY_PROGRAM);
  const [sourceProgram, setSourceProgram] = useState(EMPTY_PROGRAM);
  const [expandedDayId, setExpandedDayId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [draggedDayId, setDraggedDayId] = useState(null);
  const [dragOverDayId, setDragOverDayId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const response = await api.get(`/admin/tours/${tourId}/pdf-program`);
        if (cancelled) return;

        const nextProgram = normalizeProgram(response.data?.pdf_program);
        const nextSourceProgram = normalizeProgram(
          response.data?.source_program || response.data?.pdf_program,
        );

        setTour({
          id: response.data?.tour_id,
          title: response.data?.title || "Тур",
          slug: response.data?.slug || "",
        });
        setProgram(nextProgram);
        setSourceProgram(nextSourceProgram);
        setExpandedDayId(nextProgram.days[0]?.id || null);
        setGenerated(response.data?.is_generated === true);
      } catch (error) {
        if (cancelled) return;
        toast.error(
          error?.response?.data?.detail ||
            "Не удалось загрузить PDF-программу",
        );
        navigate("/admin/tours", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [navigate, tourId]);

  const pdfUrl = useMemo(() => {
    if (!tour?.slug) return "";
    return `${API_BASE}/tours/${encodeURIComponent(tour.slug)}/program.pdf`;
  }, [tour?.slug]);

  const updateDay = (index, patch) => {
    setProgram((current) => ({
      ...current,
      days: current.days.map((day, dayIndex) =>
        dayIndex === index ? { ...day, ...patch } : day,
      ),
    }));
  };

  const addDay = () => {
    const id = uid();
    setProgram((current) => ({
      ...current,
      days: [
        ...current.days,
        {
          id,
          day: String(current.days.length + 1),
          title: "",
          description: "",
        },
      ],
    }));
    setExpandedDayId(id);
  };

  const removeDay = (index) => {
    setProgram((current) => {
      const removedId = current.days[index]?.id;
      const days = current.days.filter((_, dayIndex) => dayIndex !== index);

      if (removedId === expandedDayId) {
        setExpandedDayId(days[Math.min(index, days.length - 1)]?.id || null);
      }

      return { ...current, days };
    });
  };

  const reorderDays = (draggedId, targetId) => {
    if (!draggedId || !targetId || draggedId === targetId) return;

    setProgram((current) => {
      const sourceIndex = current.days.findIndex((day) => day.id === draggedId);
      const targetIndex = current.days.findIndex((day) => day.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0) return current;

      const days = [...current.days];
      const [movedDay] = days.splice(sourceIndex, 1);
      days.splice(targetIndex, 0, movedDay);

      return { ...current, days };
    });
  };

  const finishDragging = () => {
    setDraggedDayId(null);
    setDragOverDayId(null);
  };

  const restoreFromTour = () => {
    const restored = normalizeProgram(sourceProgram);
    setProgram(restored);
    setExpandedDayId(restored.days[0]?.id || null);
    setGenerated(true);
    toast.success("Черновик заполнен из полной программы тура");
  };

  const save = async () => {
    setSaving(true);

    try {
      const payload = {
        ...program,
        intro: program.intro.trim(),
        days: program.days
          .map((day, index) => ({
            id: day.id || uid(),
            day: String(day.day || index + 1).trim(),
            title: day.title.trim(),
            description: day.description.trim(),
          }))
          .filter((day) => day.title || day.description),
        included: program.included.map((item) => item.trim()).filter(Boolean),
        excluded: program.excluded.map((item) => item.trim()).filter(Boolean),
        important_info: program.important_info
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const response = await api.put(
        `/admin/tours/${tourId}/pdf-program`,
        payload,
      );
      const saved = normalizeProgram(response.data?.pdf_program || payload);
      setProgram(saved);
      setGenerated(false);
      toast.success("PDF-программа сохранена");
    } catch (error) {
      toast.error(
        error?.response?.data?.detail ||
          error?.message ||
          "Не удалось сохранить программу",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[55vh] place-items-center">
        <div className="text-center text-sm text-neutral-500">
          <Loader2 className="mx-auto mb-3 size-8 animate-spin text-[#C2410C]" />
          Загружаем программу…
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24" data-testid="admin-tour-pdf-program">
      <div className="flex flex-col gap-4 border-b border-neutral-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            to="/admin/tours"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
          >
            <ArrowLeft className="size-4" /> Назад к турам
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700">
              <FileText className="size-5" />
            </span>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl">
                PDF-программа
              </h1>
              <p className="mt-1 text-sm text-neutral-500">{tour?.title}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={restoreFromTour}>
            <RotateCcw className="mr-1 size-4" /> Заполнить из тура
          </Button>
          {pdfUrl && (
            <Button type="button" variant="outline" asChild>
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                <Download className="mr-1 size-4" /> Проверить PDF
              </a>
            </Button>
          )}
          <Button
            type="button"
            onClick={save}
            disabled={saving}
            className="bg-[#C2410C] text-white hover:bg-[#9A3412]"
          >
            {saving ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <Save className="mr-1 size-4" />
            )}
            Сохранить
          </Button>
        </div>
      </div>

      {generated && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
          Поля автоматически заполнены из полной программы тура. Сократите текст
          под одностраничный PDF и нажмите «Сохранить» — после этого документ
          будет использовать отдельную компактную версию.
        </div>
      )}

      <div className="mt-6 space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
          <Label htmlFor="pdf-program-intro" className="font-semibold">
            Короткое вступление
          </Label>
          <p className="mt-1 text-xs text-neutral-500">
            Одна-две короткие строки под заголовком. Чем короче текст, тем больше
            места останется для дней.
          </p>
          <Textarea
            id="pdf-program-intro"
            value={program.intro}
            onChange={(event) =>
              setProgram((current) => ({
                ...current,
                intro: event.target.value,
              }))
            }
            rows={3}
            maxLength={260}
            className="mt-3"
          />
          <p className="mt-1 text-right text-[11px] text-neutral-400">
            {program.intro.length}/260
          </p>
        </section>

        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Label className="text-base font-semibold">Программа по дням</Label>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                Открывается только выбранный день. Для изменения порядка
                зажмите маркер справа и перетащите день в нужное место.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={addDay}>
              <Plus className="mr-1 size-4" /> Добавить день
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {program.days.length === 0 && (
              <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                Добавьте хотя бы один день программы.
              </div>
            )}

            {program.days.map((day, index) => (
              <ProgramDay
                key={day.id || index}
                day={day}
                index={index}
                expanded={expandedDayId === day.id}
                isDragging={draggedDayId === day.id}
                isDragOver={
                  dragOverDayId === day.id && draggedDayId !== day.id
                }
                onToggle={() =>
                  setExpandedDayId((current) =>
                    current === day.id ? null : day.id,
                  )
                }
                onUpdate={(patch) => updateDay(index, patch)}
                onRemove={() => removeDay(index)}
                onDragStart={() => {
                  setDraggedDayId(day.id);
                  setDragOverDayId(day.id);
                }}
                onDragEnter={(event) => {
                  event.preventDefault();
                  if (draggedDayId && draggedDayId !== day.id) {
                    setDragOverDayId(day.id);
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  reorderDays(draggedDayId, day.id);
                  finishDragging();
                }}
                onDragEnd={finishDragging}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="font-semibold">Нижние информационные блоки</Label>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                «В стоимость входит», «Оплачивается отдельно» и «Важно знать».
                Отключите их у длинной программы, чтобы освободить место.
              </p>
            </div>
            <Switch
              checked={program.show_info_blocks !== false}
              onCheckedChange={(show_info_blocks) =>
                setProgram((current) => ({ ...current, show_info_blocks }))
              }
            />
          </div>
        </section>

        {program.show_info_blocks !== false && (
          <div className="grid gap-4 xl:grid-cols-3">
            <CompactStringList
              label="В стоимость входит"
              hint="Короткие пункты, которые попадут в левый блок PDF."
              value={program.included}
              onChange={(included) =>
                setProgram((current) => ({ ...current, included }))
              }
            />
            <CompactStringList
              label="Оплачивается отдельно"
              hint="Доплаты и услуги, которые не включены в цену."
              value={program.excluded}
              onChange={(excluded) =>
                setProgram((current) => ({ ...current, excluded }))
              }
            />
            <CompactStringList
              label="Важно знать"
              hint="Только самые важные условия поездки."
              value={program.important_info}
              onChange={(important_info) =>
                setProgram((current) => ({ ...current, important_info }))
              }
            />
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="hidden text-xs text-neutral-500 sm:block">
            После сохранения кнопки на странице тура скачивают новый PDF.
          </p>
          <Button
            type="button"
            onClick={save}
            disabled={saving}
            className="ml-auto min-w-40 bg-[#C2410C] text-white hover:bg-[#9A3412]"
          >
            {saving ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <Save className="mr-1 size-4" />
            )}
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}
