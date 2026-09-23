import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Bus, GripVertical, Loader2, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mediaUrl } from "@/lib/media";
import { getTourTransportType, TOUR_TRANSPORT_TYPES } from "@/lib/tourTransport";

const GROUPS = [
  { value: TOUR_TRANSPORT_TYPES.BUS, label: "Автобусные туры", icon: Bus },
  { value: TOUR_TRANSPORT_TYPES.AIR, label: "Авиа туры", icon: Plane },
];

const tourOrderValue = (tour) => {
  const value = Number(tour?.order);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
};

export const buildTourOrderGroups = (tours = []) =>
  GROUPS.reduce((result, group) => {
    result[group.value] = [...tours]
      .filter((tour) => tour?.id && getTourTransportType(tour) === group.value)
      .sort(
        (left, right) =>
          tourOrderValue(left) - tourOrderValue(right) ||
          String(left.title || "").localeCompare(String(right.title || ""), "ru"),
      )
      .map((tour) => String(tour.id));
    return result;
  }, {});

export const moveTourOrderItem = (ids, fromIndex, toIndex) => {
  if (
    fromIndex < 0 ||
    fromIndex >= ids.length ||
    toIndex < 0 ||
    toIndex >= ids.length ||
    fromIndex === toIndex
  ) {
    return ids;
  }
  const next = [...ids];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
};

const orderSignature = (groups) =>
  GROUPS.map(({ value }) => (groups[value] || []).join("|")).join("::");

const tourStatus = (tour) => {
  if (tour?.active === false) return { label: "выключен", className: "bg-red-50 text-red-700" };
  if (
    tour?.hidden === true ||
    tour?.hide_from_catalog === true ||
    tour?.catalog_hidden === true ||
    tour?.show_in_catalog === false ||
    tour?.visible === false
  ) {
    return { label: "скрыт", className: "bg-amber-50 text-amber-800" };
  }
  return { label: "на сайте", className: "bg-emerald-50 text-emerald-700" };
};

export default function TourOrderDialog({ open, tours = [], onOpenChange, onSave }) {
  const sourceGroups = useMemo(() => buildTourOrderGroups(tours), [tours]);
  const [groups, setGroups] = useState(sourceGroups);
  const [activeGroup, setActiveGroup] = useState(TOUR_TRANSPORT_TYPES.BUS);
  const [saving, setSaving] = useState(false);
  const [draggedTourId, setDraggedTourId] = useState("");
  const [dropTargetTourId, setDropTargetTourId] = useState("");

  useEffect(() => {
    if (!open) return;
    setGroups(sourceGroups);
    setActiveGroup(TOUR_TRANSPORT_TYPES.BUS);
    setDraggedTourId("");
    setDropTargetTourId("");
  }, [open, sourceGroups]);

  const toursById = useMemo(
    () => new Map(tours.filter((tour) => tour?.id).map((tour) => [String(tour.id), tour])),
    [tours],
  );
  const dirty = orderSignature(groups) !== orderSignature(sourceGroups);

  const move = (group, fromIndex, toIndex) => {
    setGroups((previous) => ({
      ...previous,
      [group]: moveTourOrderItem(previous[group] || [], fromIndex, toIndex),
    }));
  };

  const drop = (event, group, targetIndex) => {
    event.preventDefault();
    const tourId = event.dataTransfer.getData("text/plain") || draggedTourId;
    const ids = groups[group] || [];
    const fromIndex = ids.indexOf(tourId);
    if (fromIndex < 0) return;
    move(group, fromIndex, targetIndex);
    setDraggedTourId("");
    setDropTargetTourId("");
  };

  const save = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      await onSave(groups);
      onOpenChange(false);
    } catch {
      // The parent reports the API error and keeps the dialog open for retry.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent
        className="flex h-[min(88vh,820px)] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0"
        data-testid="tour-order-dialog"
      >
        <DialogHeader className="shrink-0 border-b bg-white px-5 pb-4 pt-5 pr-12 sm:px-6 sm:pt-6">
          <DialogTitle className="font-heading text-2xl">Порядок туров</DialogTitle>
          <DialogDescription>
            Расставьте карточки отдельно для каждого раздела. На сайте они появятся в том же порядке после сохранения.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeGroup} onValueChange={setActiveGroup} className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b bg-neutral-50 px-4 py-3 sm:px-6">
            <TabsList className="grid h-auto w-full grid-cols-2">
              {GROUPS.map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value} className="gap-2 py-2">
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{value === TOUR_TRANSPORT_TYPES.BUS ? "Автобусные" : "Авиа"}</span>
                  <span className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-600">
                    {(groups[value] || []).length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {GROUPS.map(({ value }) => {
            const ids = groups[value] || [];
            return (
              <TabsContent key={value} value={value} className="m-0 min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                <p className="mb-3 text-xs leading-5 text-neutral-500">
                  Перетащите строку за маркер. На телефоне используйте стрелки. Скрытые и выключенные туры остаются в списке, чтобы их место можно было подготовить заранее.
                </p>

                {ids.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center text-sm text-neutral-500">В этом разделе пока нет туров.</div>
                ) : (
                  <div className="space-y-2">
                    {ids.map((id, index) => {
                      const tour = toursById.get(id);
                      if (!tour) return null;
                      const status = tourStatus(tour);
                      const isDragging = draggedTourId === id;
                      const isDropTarget =
                        !!draggedTourId &&
                        dropTargetTourId === id &&
                        !isDragging;
                      return (
                        <div
                          key={id}
                          aria-grabbed={isDragging}
                          onDragEnter={() => {
                            if (draggedTourId && draggedTourId !== id) {
                              setDropTargetTourId(id);
                            }
                          }}
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                            if (draggedTourId && draggedTourId !== id) {
                              setDropTargetTourId(id);
                            }
                          }}
                          onDragLeave={(event) => {
                            if (
                              !event.currentTarget.contains(event.relatedTarget) &&
                              dropTargetTourId === id
                            ) {
                              setDropTargetTourId("");
                            }
                          }}
                          onDrop={(event) => drop(event, value, index)}
                          className={`relative grid transform-gpu grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border bg-white p-2 shadow-sm transition-[transform,border-color,background-color,box-shadow,opacity] duration-200 ease-out sm:gap-3 sm:p-3 ${
                            isDragging
                              ? "z-10 scale-[1.015] border-orange-400 bg-orange-50/80 opacity-75 shadow-xl ring-2 ring-orange-200"
                              : isDropTarget
                                ? "-translate-y-0.5 border-orange-400 bg-orange-50/60 shadow-md ring-2 ring-orange-100"
                                : "border-neutral-200 hover:border-neutral-300"
                          }`}
                          data-testid={`tour-order-item-${id}`}
                        >
                          <span draggable={!saving} onDragStart={(event) => {
                            setDraggedTourId(id);
                            setDropTargetTourId("");
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", id);
                          }} onDragEnd={() => {
                            setDraggedTourId("");
                            setDropTargetTourId("");
                          }} className="cursor-grab active:cursor-grabbing" aria-label={`Перетащить тур «${tour.title || tour.slug}»`}>
                            <GripVertical className={`size-5 transition-colors ${isDragging ? "animate-pulse text-orange-600" : "text-neutral-400"}`} aria-hidden="true" />
                          </span>
                          <span className="grid size-7 place-items-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">{index + 1}</span>
                          <div className="flex min-w-0 items-center gap-3">
                            {tour.hero_image && <img src={mediaUrl(tour.hero_image)} alt="" className="hidden size-11 shrink-0 rounded-lg object-cover sm:block" loading="lazy" />}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-neutral-900">{tour.title || tour.slug}</p>
                              <div className="mt-1 flex min-w-0 items-center gap-2">
                                <span className="truncate text-xs text-neutral-500">{tour.region_name || tour.slug || "Без направления"}</span>
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}>{status.label}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center">
                            <Button type="button" size="icon" variant="ghost" className="size-8" disabled={saving || index === 0} onClick={() => move(value, index, index - 1)} aria-label={`Поднять тур «${tour.title || tour.slug}»`}>
                              <ArrowUp className="size-4" />
                            </Button>
                            <Button type="button" size="icon" variant="ghost" className="size-8" disabled={saving || index === ids.length - 1} onClick={() => move(value, index, index + 1)} aria-label={`Опустить тур «${tour.title || tour.slug}»`}>
                              <ArrowDown className="size-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button type="button" disabled={!dirty || saving} onClick={save} className="bg-[#C2410C] text-white hover:bg-[#9A3412]" data-testid="save-tour-order">
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? "Сохраняем…" : "Сохранить порядок"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
