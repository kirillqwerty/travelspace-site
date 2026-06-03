import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { mediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/formatDate";

const TITLES = {
  tours: "Туры",
  specialists: "Специалисты",
  // reviews: "Отзывы",
  articles: "Статьи блога",
  promotions: "Акции",
  faq: "FAQ",
};

// Per-collection editor schema. Each field has a key and a render hint.
// Anything not listed will be edited inside the "Дополнительно (JSON)" textarea.
const SCHEMAS = {
  tours: {
    label: (t) => t.title || t.slug,
    description: (t) => `${t.region_name || ""} · ${t.duration || ""}`,
    image: (t) => t.hero_image,
    fields: [
      { key: "title", label: "Название тура", type: "text" },
      // { key: "slug", label: "URL (slug)", type: "text" },
      { key: "tagline", label: "Подзаголовок", type: "text" },
      // {
      //   key: "region_slug",
      //   label: "Регион (slug)",
      //   type: "text",
      //   placeholder: "dagestan, georgia-kobuleti …",
      // },
      { key: "region_name", label: "Регион (название)", type: "text" },
      {
        key: "duration",
        label: "Длительность",
        type: "text",
        placeholder: "например 7 дней / 6 ночей",
      },
      {
        key: "departure_city",
        label: "Город отправления",
        type: "city-select",
      },
      { key: "price_from", label: "Цена", type: "number" },
      {
        key: "price_type",
        label: "Тип цены",
        type: "select",
        options: ["от", "фиксированная", "за человека", "за тур"],
      },
      {
        key: "currency",
        label: "Валюта",
        type: "select",
        options: ["BYN", "RUB", "USD", "EUR"],
      },
      { key: "short_description", label: "Краткое описание", type: "textarea" },
      {
        key: "description",
        label: "Полное описание тура",
        type: "textarea",
        rows: 6,
      },
      { key: "hero_image", label: "Главное фото", type: "image" },
      { key: "seo_title", label: "SEO Title", type: "text" },
      { key: "seo_description", label: "SEO Description", type: "textarea" },
      { key: "order", label: "Порядок", type: "number" },
      { key: "active", label: "Активен", type: "switch" },
    ],
  },
  specialists: {
    label: (s) => s.name,
    description: (s) => s.role,
    image: (s) => s.photo,
    fields: [
      { key: "name", label: "Имя", type: "text" },
      { key: "role", label: "Должность", type: "text" },
      { key: "phone", label: "Телефон (форматированный)", type: "text" },
      { key: "phone_link", label: "Телефон (для tel:)", type: "text" },
      { key: "viber", label: "Viber номер", type: "text" },
      { key: "telegram", label: "Telegram (без @)", type: "text" },
      { key: "whatsapp", label: "WhatsApp номер", type: "text" },
      { key: "photo", label: "Фото", type: "image" },
      { key: "order", label: "Порядок", type: "number" },
      { key: "active", label: "Активен", type: "switch" },
    ],
  },
  // reviews: {
  //   label: (r) => r.name,
  //   description: (r) => r.tour_name || r.direction,
  //   image: (r) => r.photo,
  //   fields: [
  //     { key: "name", label: "Имя", type: "text" },
  //     { key: "tour_name", label: "Тур (название)", type: "text" },
  //     { key: "text", label: "Текст отзыва", type: "textarea" },
  //     { key: "rating", label: "Рейтинг (1-5)", type: "number" },
  //     { key: "photo", label: "Фото", type: "image" },
  //     { key: "external_link", label: "Ссылка на внешний отзыв", type: "text" },
  //     { key: "date", label: "Дата", type: "date", placeholder: "01.09.2025" },
  //     { key: "order", label: "Порядок", type: "number" },
  //     { key: "active", label: "Активен", type: "switch" },
  //   ],
  // },
  articles: {
    label: (a) => a.title,
    description: (a) => a.published_at,
    image: (a) => a.cover,
    fields: [
      { key: "title", label: "Заголовок", type: "text" },
      // { key: "slug", label: "URL (slug)", type: "text" },
      { key: "cover", label: "Обложка", type: "image" },
      { key: "excerpt", label: "Краткое описание", type: "textarea" },
      { key: "content", label: "Содержание", type: "textarea", rows: 10 },
      { key: "seo_title", label: "SEO Title", type: "text" },
      { key: "seo_description", label: "SEO Description", type: "textarea" },
      {
        key: "published_at",
        label: "Дата публикации",
        type: "date",
        placeholder: "01.09.2025",
      },
      { key: "active", label: "Опубликовано", type: "switch" },
    ],
  },
  promotions: {
    label: (p) => p.title,
    description: (p) => p.valid_until && `до ${p.valid_until}`,
    image: (p) => p.image,
    fields: [
      { key: "title", label: "Название акции", type: "text" },
      { key: "image", label: "Изображение", type: "image" },
      { key: "description", label: "Описание", type: "textarea" },
      {
        key: "valid_until",
        label: "Действует до",
        type: "text",
        placeholder: "01.03.2026",
      },
      { key: "related_tour_slug", label: "Slug связанного тура", type: "text" },
      { key: "active", label: "Активна", type: "switch" },
    ],
  },
  faq: {
    label: (f) => f.question,
    description: (f) => f.category,
    fields: [
      { key: "category", label: "Категория", type: "text" },
      { key: "question", label: "Вопрос", type: "text" },
      { key: "answer", label: "Ответ", type: "textarea" },
      { key: "order", label: "Порядок", type: "number" },
      { key: "active", label: "Активен", type: "switch" },
    ],
  },
};

const TOUR_JSON_HINT =
  "Для тура можно добавить поля: highlights (массив строк) — главные впечатления; what_to_see (массив строк) — что посмотреть; gallery (массив URL) — галерея; program (массив дней) — программа по дням; included / excluded — что входит и что нет; important_info — важно знать; hotels — отели; dates — массив дат; faq — массив вопросов.";

const normalizeDateRecord = (d = {}, record = {}) => ({
  id: d.id || uid(),
  start: d.start || "",
  end: d.end || "",
  price: d.price === "" ? "" : Number(d.price ?? record.price_from ?? 0),
  currency: d.currency || record.currency || "BYN",
  status: d.status || "active",
  comment: d.comment || "",
});

const normalizeRoomRecord = (room = {}) => ({
  id: room.id || uid(),
  number: room.number || "",
  title: room.title || "",
  description: room.description || "",
  gallery: Array.isArray(room.gallery) ? room.gallery.filter(Boolean) : [],
  video_url: room.video_url || room.videoUrl || "",
  unavailable_dates: Array.isArray(room.unavailable_dates)
    ? room.unavailable_dates
    : Array.isArray(room.unavailableDates)
      ? room.unavailableDates
      : [],
  order: room.order ?? "",
  active: room.active !== false,
});

const normalizeHotelRecord = (h = {}) => ({
  id: h.id || uid(),
  name: h.name || "",
  description: h.description || "",
  images: Array.isArray(h.images)
    ? h.images.filter(Boolean)
    : h.image
      ? [h.image]
      : [],
  image: h.image || h.images?.[0] || "",
  meal: h.meal || "",
  location: h.location || "",
  order: h.order ?? "",
  active: h.active !== false,
  rooms: Array.isArray(h.rooms) ? h.rooms.map(normalizeRoomRecord) : [],
});

const normalizeChains = (record = {}) => {
  if (Array.isArray(record.chains) && record.chains.length) {
    return record.chains.map((chain, index) => ({
      id: chain.id || uid(),
      title: chain.title || chain.name || `Цепочка ${index + 1}`,
      description: chain.description || "",
      order: chain.order ?? index + 1,
      active: chain.active !== false,
      dates: Array.isArray(chain.dates)
        ? chain.dates.map((d) => normalizeDateRecord(d, record))
        : [],
      hotels: Array.isArray(chain.hotels)
        ? chain.hotels.map(normalizeHotelRecord)
        : [],
    }));
  }

  if (Array.isArray(record.dates) || Array.isArray(record.hotels)) {
    return [
      {
        id: uid(),
        title: "Основная цепочка",
        description: "",
        order: 1,
        active: true,
        dates: Array.isArray(record.dates)
          ? record.dates.map((d) => normalizeDateRecord(d, record))
          : [],
        hotels: Array.isArray(record.hotels)
          ? record.hotels.map(normalizeHotelRecord)
          : [],
      },
    ];
  }

  return [];
};

const normalizeRecord = (record = {}, collectionName) => {
  if (collectionName !== "tours") return record;

  const isNew = !record.id;

  return {
    ...(isNew ? {} : { id: record.id }),

    title: record.title || "",
    tagline: record.tagline || "",
    region_name: record.region_name || "",
    region_slug: record.region_slug || slugify(record.region_name || ""),
    duration: record.duration || "",
    departure_city: record.departure_city || "Минск",
    price_from: record.price_from ?? "",
    price_type: record.price_type || "от",
    currency: record.currency || "BYN",
    short_description: record.short_description || "",
    description: record.description || "",
    hero_image: record.hero_image || "",
    seo_title: record.seo_title || "",
    seo_description: record.seo_description || "",
    order: record.order ?? "",
    active: record.active !== false,

    badges: Array.isArray(record.badges) ? record.badges.filter(Boolean) : [],
    gallery: Array.isArray(record.gallery)
      ? record.gallery.filter(Boolean)
      : [],
    highlights: Array.isArray(record.highlights)
      ? record.highlights.filter(Boolean)
      : [],
    what_to_see: Array.isArray(record.what_to_see)
      ? record.what_to_see.filter(Boolean)
      : [],
    included: Array.isArray(record.included)
      ? record.included.filter(Boolean)
      : [],
    excluded: Array.isArray(record.excluded)
      ? record.excluded.filter(Boolean)
      : [],
    important_info: Array.isArray(record.important_info)
      ? record.important_info.filter(Boolean)
      : [],

    program: Array.isArray(record.program)
      ? record.program.map((d, index) => ({
          day: Number(d.day || index + 1),
          title: d.title || "",
          description: d.description || "",
          image: d.image || "",
          notes: d.notes || "",
        }))
      : [],

    // New tour structure: chain -> hotels -> rooms.
    // Old dates/hotels are converted into one default chain for compatibility.
    chains: normalizeChains(record),

    // Keep old fields only for compatibility with old public components/data.
    dates: Array.isArray(record.dates)
      ? record.dates.map((d) => normalizeDateRecord(d, record))
      : [],
    hotels: Array.isArray(record.hotels)
      ? record.hotels.map(normalizeHotelRecord)
      : [],

    faq: Array.isArray(record.faq)
      ? record.faq.map((f) => ({
          question: f.question || "",
          answer: f.answer || "",
        }))
      : [],

    map_embed: record.map_embed || "",
  };
};

export default function AdminCollection({ name }) {
  const schema = SCHEMAS[name];
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);

  const load = async () => {
    console.log("AdminCollection load started:", `/admin/${name}`);

    setLoading(true);
    setRendering(false);

    try {
      const r = await api.get(`/admin/${name}`);

      console.log("AdminCollection load success:", r.data);

      setRendering(true);

      requestAnimationFrame(() => {
        setItems(r.data);
        setLoading(false);

        requestAnimationFrame(() => {
          setRendering(false);
        });
      });
    } catch (e) {
      console.error("AdminCollection load error:", e);
      toast.error("Ошибка загрузки данных");
      setLoading(false);
      setRendering(false);
    }
  };

  useEffect(() => {
    console.log("AdminCollection mounted / name changed:", name);
    load();
  }, [name]);

  // const onSave = async (record, extraJson) => {
  //   try {
  //     let extra = {};
  //     if (extraJson && extraJson.trim()) {
  //       extra = JSON.parse(extraJson);
  //     }
  //     const payload = { ...extra, ...record };
  //     if (record.id) {
  //       await api.put(`/admin/${name}/${record.id}`, payload);
  //       toast.success("Сохранено");
  //     } else {
  //       await api.post(`/admin/${name}`, payload);
  //       toast.success("Создано");
  //     }
  //     setEditing(null);
  //     load();
  //   } catch (e) {
  //     toast.error(e.message || "Ошибка");
  //   }
  // };

  const onSave = async (record) => {
    const payload = { ...record };

    if (record.id) {
      await api.put(`/admin/${name}/${record.id}`, payload);
      toast.success("Сохранено");
    } else {
      await api.post(`/admin/${name}`, payload);
      toast.success("Создано");
    }

    setEditing(null);
    await load();
  };

  const onDelete = async (id) => {
    if (!confirm("Удалить запись?")) return;
    await api.delete(`/admin/${name}/${id}`);
    setItems((p) => p.filter((x) => x.id !== id));
    toast.success("Удалено");
  };

  return (
    <div data-testid={`admin-collection-${name}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl">{TITLES[name]}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Управление содержимым раздела «{TITLES[name]}».
          </p>
        </div>
        <Button
          onClick={() => setEditing(normalizeRecord({}, name))}
          className="rounded-full bg-[#C2410C] hover:bg-[#9A3412] text-white"
          data-testid="admin-add-btn"
        >
          <Plus className="size-4 mr-1" /> Добавить
        </Button>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(loading || rendering) && (
          <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-neutral-400">
            <Loader2 className="mx-auto size-8 animate-spin text-[#C2410C]" />
            <p className="mt-3 text-sm">
              {loading ? "Загружаем данные…" : "Отрисовываем карточки…"}
            </p>
          </div>
        )}

        {!loading && !rendering && items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-neutral-400">
            Пока пусто. Добавьте первую запись.
          </div>
        )}

        {!loading &&
          !rendering &&
          items.map((it) => (
            <div
              key={it.id}
              className="rounded-2xl bg-white border border-neutral-200 overflow-hidden flex flex-col"
            >
              {schema.image?.(it) && (
                <div className="h-[220px] shrink-0 bg-neutral-100">
                  <img
                    src={mediaUrl(schema.image(it))}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="p-4 flex flex-col">
                <h3 className="font-medium text-sm line-clamp-2">
                  {schema.label(it)}
                </h3>

                {schema.description?.(it) && (
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                    {schema.description(it)}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                  <span className="text-xs">
                    {it.active === false ? (
                      <span className="text-red-600">Скрыто</span>
                    ) : (
                      <span className="text-green-700">Активно</span>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing(normalizeRecord(it, name))}
                      className="text-xs text-[#C2410C] hover:underline inline-flex items-center gap-1"
                      data-testid={`admin-edit-${it.id}`}
                    >
                      <Edit className="size-3.5" /> Изменить
                    </button>

                    <button
                      onClick={() => onDelete(it.id)}
                      className="text-neutral-400 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* <EditDialog
        open={!!editing}
        record={editing}
        schema={schema}
        collectionName={name}
        onClose={() => setEditing(null)}
        onSave={onSave}
      /> */}

      <EditDialog
        open={!!editing}
        record={editing}
        schema={schema}
        collectionName={name}
        onClose={() => setEditing(null)}
        onSave={onSave}
      />
    </div>
  );
}

function EditDialog({ open, record, schema, collectionName, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [extraJson, setExtraJson] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [saving, setSaving] = useState(false);
  const TOUR_EXTRA_KEYS = [
    "badges",
    "gallery",
    "highlights",
    "what_to_see",
    "included",
    "excluded",
    "important_info",
    "program",
    "chains",
    "dates",
    "hotels",
    "faq",
    "map_embed",
  ];
  useEffect(() => {
    if (!open) return;
    if (!record) return;

    const knownKeys = new Set(schema.fields.map((f) => f.key));
    knownKeys.add("id");

    if (collectionName === "tours") {
      TOUR_EXTRA_KEYS.forEach((key) => knownKeys.add(key));
    }

    const known = {};
    const extra = {};

    Object.entries(record).forEach(([k, v]) => {
      if (knownKeys.has(k)) known[k] = v;
      else extra[k] = v;
    });

    schema.fields.forEach((f) => {
      if (known[f.key] === undefined) {
        known[f.key] = f.type === "switch" ? true : "";
      }
    });

    setForm(known);
    setExtraJson(
      Object.keys(extra).length ? JSON.stringify(extra, null, 2) : "",
    );
    setJsonError("");
  }, [open, record, schema, collectionName]);
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // const submit = (e) => {
  //   e.preventDefault();
  //   if (extraJson && extraJson.trim()) {
  //     try {
  //       JSON.parse(extraJson);
  //       setJsonError("");
  //     } catch (err) {
  //       setJsonError("JSON не валиден: " + err.message);
  //       return;
  //     }
  //   }
  //   onSave(form, extraJson);
  // };
  const submit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
    };

    if (collectionName === "tours") {
      payload.slug = slugify(form.title);
      payload.region_slug = slugify(form.region_name);
    }

    if (collectionName === "articles") {
      payload.slug = slugify(form.title);
    }

    try {
      setSaving(true);
      await onSave(payload);
    } catch (e) {
      console.error("Save error:", e);
      toast.error(e?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !saving && !v && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col"
        data-testid="admin-edit-dialog"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-white shrink-0">
          <DialogTitle className="font-heading text-2xl">
            {record?.id ? "Редактировать запись" : "Новая запись"}
          </DialogTitle>
        </DialogHeader>

        {saving && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-10 animate-spin text-[#C2410C]" />
              <span className="text-sm text-neutral-600">
                Сохраняем изменения...
              </span>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {schema.fields.map((f) => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                {f.type === "switch" ? (
                  <div className="mt-1 flex items-center gap-2">
                    <Switch
                      checked={!!form[f.key]}
                      onCheckedChange={(v) => update(f.key, v)}
                    />
                    <span className="text-sm text-neutral-500">
                      {form[f.key] ? "Да" : "Нет"}
                    </span>
                  </div>
                ) : f.type === "select" ? (
                  <Select
                    value={form[f.key] || ""}
                    onValueChange={(v) => update(f.key, v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue
                        placeholder={f.placeholder || "Выберите значение"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options.filter(Boolean).map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === "city-select" ? (
                  <CitySelect
                    value={form[f.key]}
                    onChange={(v) => update(f.key, v)}
                  />
                ) : f.type === "date" ? (
                  <DateInput
                    value={form[f.key] ?? ""}
                    onChange={(v) => update(f.key, v)}
                    placeholder={f.placeholder}
                  />
                ) : f.type === "textarea" ? (
                  <Textarea
                    value={form[f.key] ?? ""}
                    onChange={(e) => update(f.key, e.target.value)}
                    rows={f.rows || 3}
                    placeholder={f.placeholder}
                    className="mt-1"
                  />
                ) : f.type === "number" ? (
                  <Input
                    type="number"
                    value={form[f.key] ?? ""}
                    placeholder="Введите число"
                    onChange={(e) =>
                      update(
                        f.key,
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="mt-1"
                  />
                ) : f.type === "image" ? (
                  <ImageInput
                    value={form[f.key] || ""}
                    onChange={(v) => update(f.key, v)}
                  />
                ) : (
                  <Input
                    value={form[f.key] ?? ""}
                    onChange={(e) => update(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="mt-1"
                  />
                )}
              </div>
            ))}

            {/* <details className="rounded-lg border border-neutral-200 p-3">
            <summary className="text-sm font-medium cursor-pointer">
              Дополнительно (JSON)
            </summary>
            <p className="text-xs text-neutral-500 mt-2">
              {collectionName === "tours"
                ? TOUR_JSON_HINT
                : "Сюда сохраняются сложные поля: программа, отели, даты, галереи, теги и т.д."}
            </p>
            <Textarea
              value={extraJson}
              onChange={(e) => setExtraJson(e.target.value)}
              rows={12}
              className="mt-3 font-mono text-xs"
              spellCheck={false}
            />
            {jsonError && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="size-3" /> {jsonError}
              </p>
            )}
          </details> */}

            {collectionName === "tours" && (
              <TourExtraFields form={form} setForm={setForm} />
            )}
          </div>

          <div className="border-t px-6 py-4 bg-white flex justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="rounded-full"
            >
              Отмена
            </Button>

            <Button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#C2410C] hover:bg-[#9A3412] min-w-[140px]"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Сохраняем...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
const formatDateInput = (value = "") => {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;

  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
};

function DateInput({ value, onChange, placeholder = "дд.мм.гггг" }) {
  return (
    <Input
      value={value || ""}
      placeholder={placeholder}
      inputMode="numeric"
      onChange={(e) => onChange(formatDateInput(e.target.value))}
    />
  );
}
const slugify = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/[а-яё]/g, (char) => {
      const map = {
        а: "a",
        б: "b",
        в: "v",
        г: "g",
        д: "d",
        е: "e",
        ё: "e",
        ж: "zh",
        з: "z",
        и: "i",
        й: "y",
        к: "k",
        л: "l",
        м: "m",
        н: "n",
        о: "o",
        п: "p",
        р: "r",
        с: "s",
        т: "t",
        у: "u",
        ф: "f",
        х: "h",
        ц: "ts",
        ч: "ch",
        ш: "sh",
        щ: "sch",
        ъ: "",
        ы: "y",
        ь: "",
        э: "e",
        ю: "yu",
        я: "ya",
      };

      return map[char] || char;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function TourExtraFields({ form, setForm }) {
  const update = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  return (
    <div className="space-y-6 rounded-xl border border-neutral-200 p-4">
      <h3 className="font-medium">Дополнительная информация</h3>

      <BadgesField
        value={form.badges || []}
        onChange={(v) => update("badges", v)}
      />

      <ImageListField
        label="Галерея"
        value={form.gallery || []}
        onChange={(v) => update("gallery", v)}
      />

      <StringListField
        label="Главные впечатления"
        value={form.highlights || []}
        onChange={(v) => update("highlights", v)}
        placeholder="Сулакский каньон — самый глубокий в Европе"
      />

      <StringListField
        label="Что посмотреть"
        value={form.what_to_see || []}
        onChange={(v) => update("what_to_see", v)}
        placeholder="Дербент и крепость Нарын-Кала"
      />

      <StringListField
        label="Что входит"
        value={form.included || []}
        onChange={(v) => update("included", v)}
        placeholder="Проезд автобусом"
      />

      <StringListField
        label="Что не входит"
        value={form.excluded || []}
        onChange={(v) => update("excluded", v)}
        placeholder="Личные расходы"
      />

      <StringListField
        label="Важная информация"
        value={form.important_info || []}
        onChange={(v) => update("important_info", v)}
        placeholder="Документ: внутренний или загранпаспорт"
      />

      <ProgramField
        value={form.program || []}
        onChange={(v) => update("program", v)}
      />

      <ChainsField
        value={form.chains || []}
        onChange={(v) => update("chains", v)}
        tourCurrency={form.currency || "BYN"}
        tourPrice={form.price_from || ""}
      />

      <FaqField value={form.faq || []} onChange={(v) => update("faq", v)} />

      {/* <div>
        <Label>Карта / embed</Label>
        <Textarea
          value={form.map_embed || ""}
          onChange={(e) => update("map_embed", e.target.value)}
          className="mt-1"
          rows={3}
        />
      </div> */}
    </div>
  );
}

function StringListField({ label, value, onChange, placeholder }) {
  const items = value.length ? value : [""];

  const updateItem = (index, text) => {
    const next = [...items];
    next[index] = text;
    onChange(next.filter((x) => x.trim()));
  };

  const addItem = () => onChange([...items.filter(Boolean), ""]);
  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div>
      <Label>{label}</Label>

      <div className="mt-2 space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              placeholder={placeholder}
              onChange={(e) => updateItem(index, e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => removeItem(index)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-2"
        onClick={addItem}
      >
        <Plus className="size-4 mr-1" /> Добавить
      </Button>
    </div>
  );
}

const reorderArray = (list, fromIndex, toIndex) => {
  if (fromIndex === toIndex) return list;

  const next = [...list];
  const [movedItem] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, movedItem);

  return next;
};

function ImageListField({ label, value, onChange }) {
  const items = value.length ? value : [""];
  const [draggedIndex, setDraggedIndex] = useState(null);

  const updateItem = (index, text) => {
    const next = [...items];
    next[index] = text;
    onChange(next.filter(Boolean));
  };

  const addItem = () => onChange([...items.filter(Boolean), ""]);
  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  const moveItem = (fromIndex, toIndex) => {
    const cleanItems = items.filter(Boolean);
    onChange(reorderArray(cleanItems, fromIndex, toIndex));
  };

  return (
    <div>
      <Label>{label}</Label>

      <div className="mt-2 space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            draggable={!!item}
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();

              if (draggedIndex === null) return;
              if (!items[draggedIndex]) return;
              if (!item) return;

              moveItem(draggedIndex, index);
              setDraggedIndex(null);
            }}
            onDragEnd={() => setDraggedIndex(null)}
            className={`flex flex-col sm:flex-row gap-2 items-start rounded-xl transition ${
              draggedIndex === index ? "opacity-50 ring-2 ring-[#C2410C]" : ""
            }`}
          >
            <div className="flex w-full sm:w-auto items-center gap-2">
              <button
                type="button"
                className="cursor-grab rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500 active:cursor-grabbing"
                title="Перетащить фото"
              >
                ☰
              </button>

              <span className="w-6 shrink-0 text-xs text-neutral-400">
                {index + 1}
              </span>
            </div>

            <ImageInput value={item} onChange={(v) => updateItem(index, v)} />

            <Button
              type="button"
              variant="outline"
              onClick={() => removeItem(index)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-2"
        onClick={addItem}
      >
        <Plus className="size-4 mr-1" /> Добавить фото
      </Button>

      <p className="mt-2 text-xs text-neutral-500">
        Порядок фото можно менять перетягиванием. Первое фото будет главным.
      </p>
    </div>
  );
}

function CitySelect({ value, onChange }) {
  const cities = ["Минск", "Гомель", "Жлобин", "Бобруйск", "Москва"];

  const [customCity, setCustomCity] = useState("");

  return (
    <div className="space-y-2">
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Выберите город" />
        </SelectTrigger>

        <SelectContent>
          {cities.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Input
          value={customCity}
          placeholder="Свой город"
          onChange={(e) => setCustomCity(e.target.value)}
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!customCity.trim()) return;

            onChange(customCity.trim());
            setCustomCity("");
          }}
        >
          Добавить
        </Button>
      </div>
    </div>
  );
}

async function compressImage(file, maxWidth = 1200, quality = 0.72) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Можно загружать только изображения");
  }

  const imageUrl = URL.createObjectURL(file);

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = imageUrl;
  });

  const scale = Math.min(1, maxWidth / img.width);
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(imageUrl);

  return await new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(
          new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
          }),
        );
      },
      "image/jpeg",
      quality,
    );
  });
}

async function uploadImage(file) {
  const compressed = await compressImage(file);

  const formData = new FormData();
  formData.append("file", compressed);

  const response = await api.post("/admin/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.url;
}

function ImageInput({ value, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadImage(file);
      onChange(url);
      toast.success("Изображение загружено");
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.detail || e.message || "Ошибка загрузки изображения",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="flex-1 rounded-xl border border-dashed border-neutral-300 p-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files?.[0]);
      }}
    >
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        {value ? (
          <img
            src={mediaUrl(value)}
            alt=""
            className="size-20 rounded-lg object-cover bg-neutral-100"
          />
        ) : (
          <div className="size-20 rounded-lg bg-neutral-100 flex items-center justify-center">
            {uploading ? (
              <Loader2 className="size-5 animate-spin text-neutral-400" />
            ) : (
              <Upload className="size-5 text-neutral-400" />
            )}
          </div>
        )}

        <div className="flex-1 w-full space-y-2">
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL картинки"
          />

          <label className="inline-flex w-full sm:w-auto justify-center items-center rounded-md border border-neutral-300 px-4 py-2 text-sm cursor-pointer hover:bg-neutral-50">
            {uploading ? "Загрузка..." : "Выбрать изображение"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>

          <p className="text-xs text-neutral-500">
            Можно перетащить фото или выбрать через проводник. Фото сжимается и
            сохраняется на сервер, в тур записывается только URL.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgramField({ value, onChange }) {
  const items = value.length
    ? value
    : [{ day: 1, title: "", description: "", image: "", notes: "" }];

  const updateItem = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const addItem = () =>
    onChange([
      ...items,
      {
        day: items.length + 1,
        title: "",
        description: "",
        image: "",
        notes: "",
      },
    ]);

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div>
      <Label>Программа по дням</Label>

      <div className="mt-2 space-y-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-xl border p-3 space-y-2">
            <div className="flex gap-2">
              <Input
                type="number"
                value={item.day ?? ""}
                placeholder="День"
                onChange={(e) =>
                  updateItem(index, { day: Number(e.target.value) })
                }
                className="w-24"
              />
              <Input
                value={item.title || ""}
                onChange={(e) => updateItem(index, { title: e.target.value })}
                placeholder="Название дня"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => removeItem(index)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <Textarea
              value={item.description || ""}
              onChange={(e) =>
                updateItem(index, { description: e.target.value })
              }
              placeholder="Описание дня"
            />

            <ImageInput
              value={item.image || ""}
              onChange={(v) => updateItem(index, { image: v })}
            />

            <Input
              value={item.notes || ""}
              onChange={(e) => updateItem(index, { notes: e.target.value })}
              placeholder="Заметки"
            />
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-2"
        onClick={addItem}
      >
        <Plus className="size-4 mr-1" /> Добавить день
      </Button>
    </div>
  );
}

function DatesField({
  value,
  onChange,
  defaultCurrency = "BYN",
  defaultPrice = "",
}) {
  const items = value.length
    ? value
    : [
        {
          id: uid(),
          start: "",
          end: "",
          price: defaultPrice || "",
          currency: defaultCurrency,
          status: "active",
          comment: "",
        },
      ];

  const updateItem = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const addItem = () =>
    onChange([
      ...items,
      {
        id: uid(),
        start: "",
        end: "",
        price: defaultPrice || "",
        currency: defaultCurrency,
        status: "active",
        comment: "",
      },
    ]);

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div>
      <Label>Даты заездов</Label>

      <div className="mt-2 space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id || index}
            className="rounded-xl border p-3 space-y-2"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Дата начала</Label>
                <Input
                  type="date"
                  value={item.start || ""}
                  onChange={(e) => updateItem(index, { start: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Дата окончания</Label>
                <Input
                  type="date"
                  value={item.end || ""}
                  onChange={(e) => updateItem(index, { end: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Цена</Label>
                <Input
                  type="number"
                  value={item.price ?? ""}
                  placeholder="Цена"
                  onChange={(e) =>
                    updateItem(index, { price: Number(e.target.value) })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Валюта</Label>
                <Select
                  value={item.currency || "BYN"}
                  onValueChange={(v) => updateItem(index, { currency: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BYN">BYN</SelectItem>
                    <SelectItem value="RUB">RUB</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Статус</Label>
                <Select
                  value={item.status || "active"}
                  onValueChange={(v) => updateItem(index, { status: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Активна</SelectItem>
                    <SelectItem value="hidden">Скрыта</SelectItem>
                    <SelectItem value="sold_out">Нет мест</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-2"
        onClick={addItem}
      >
        <Plus className="size-4 mr-1" /> Добавить дату
      </Button>
    </div>
  );
}

function ChainsField({ value, onChange, tourCurrency, tourPrice }) {
  const items = value.length
    ? value
    : [
        {
          id: uid(),
          title: "Цепочка 1",
          description: "",
          order: 1,
          active: true,
          dates: [],
          hotels: [],
        },
      ];

  const updateItem = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const addItem = () =>
    onChange([
      ...items,
      {
        id: uid(),
        title: `Цепочка ${items.length + 1}`,
        description: "",
        order: items.length + 1,
        active: true,
        dates: [],
        hotels: [],
      },
    ]);

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div>
      <Label>Цепочки / расписания автобусов</Label>
      <p className="mt-1 text-xs text-neutral-500">
        У каждой цепочки свои даты, свои отели и свои номера. Номер можно
        отметить выкупленным на конкретную дату цепочки.
      </p>

      <div className="mt-3 space-y-4">
        {items.map((chain, index) => (
          <div
            key={chain.id || index}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-4"
          >
            <div className="flex items-start gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_120px]">
                <Input
                  value={chain.title || ""}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                  placeholder="Например: Цепочка 1 / Автобус 1"
                />
                <Input
                  type="number"
                  value={chain.order ?? ""}
                  onChange={(e) =>
                    updateItem(index, {
                      order:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  placeholder="Порядок"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => removeItem(index)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <Textarea
              value={chain.description || ""}
              onChange={(e) =>
                updateItem(index, { description: e.target.value })
              }
              placeholder="Комментарий к цепочке, если нужен"
              rows={2}
            />

            <DatesField
              value={chain.dates || []}
              onChange={(dates) => updateItem(index, { dates })}
              defaultCurrency={tourCurrency}
              defaultPrice={tourPrice}
            />

            <ChainHotelsField
              value={chain.hotels || []}
              dates={chain.dates || []}
              onChange={(hotels) => updateItem(index, { hotels })}
            />
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-3"
        onClick={addItem}
      >
        <Plus className="size-4 mr-1" /> Добавить цепочку
      </Button>
    </div>
  );
}

function ChainHotelsField({ value, dates, onChange }) {
  const items = value.length
    ? value
    : [
        {
          id: uid(),
          name: "",
          description: "",
          images: [],
          image: "",
          meal: "",
          location: "",
          rooms: [],
          active: true,
        },
      ];

  const updateItem = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const addItem = () =>
    onChange([
      ...items,
      {
        id: uid(),
        name: "",
        description: "",
        image: "",
        meal: "",
        location: "",
        rooms: [],
        active: true,
      },
    ]);

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <Label>Отели этой цепочки</Label>

      <div className="mt-2 space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id || index}
            className="rounded-xl border border-neutral-200 p-3 space-y-3"
          >
            <div className="flex gap-2">
              <Input
                value={item.name || ""}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                placeholder="Название отеля"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => removeItem(index)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <Textarea
              value={item.description || ""}
              onChange={(e) =>
                updateItem(index, { description: e.target.value })
              }
              placeholder="Описание отеля"
            />

            <ImageListField
              label="Фото отеля"
              value={item.images || (item.image ? [item.image] : [])}
              onChange={(images) =>
                updateItem(index, {
                  images,
                  image: images[0] || "",
                })
              }
            />

            <div className="grid sm:grid-cols-2 gap-2">
              <Input
                value={item.meal || ""}
                onChange={(e) => updateItem(index, { meal: e.target.value })}
                placeholder="Питание"
              />
              <Input
                value={item.location || ""}
                onChange={(e) =>
                  updateItem(index, { location: e.target.value })
                }
                placeholder="Расположение"
              />
            </div>

            <RoomsField
              value={item.rooms || []}
              dates={dates}
              onChange={(rooms) => updateItem(index, { rooms })}
            />
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-2"
        onClick={addItem}
      >
        <Plus className="size-4 mr-1" /> Добавить отель
      </Button>
    </div>
  );
}

function RoomsField({ value, dates, onChange }) {
  const items = value.length
    ? value
    : [
        {
          id: uid(),
          number: "",
          title: "",
          description: "",
          gallery: [],
          video_url: "",
          unavailable_dates: [],
          active: true,
        },
      ];

  const updateItem = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const addItem = () =>
    onChange([
      ...items,
      {
        id: uid(),
        number: "",
        title: "",
        description: "",
        gallery: [],
        video_url: "",
        unavailable_dates: [],
        active: true,
      },
    ]);

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="rounded-xl border border-dashed border-neutral-300 p-3">
      <Label>Номера отеля</Label>

      <div className="mt-2 space-y-3">
        {items.map((room, index) => (
          <div
            key={room.id || index}
            className="rounded-xl border p-3 space-y-3"
          >
            <div className="grid sm:grid-cols-[120px_1fr_auto] gap-2">
              <Input
                value={room.number || ""}
                onChange={(e) => updateItem(index, { number: e.target.value })}
                placeholder="№ 201"
              />
              <Input
                value={room.title || ""}
                onChange={(e) => updateItem(index, { title: e.target.value })}
                placeholder="Название номера"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => removeItem(index)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <Textarea
              value={room.description || ""}
              onChange={(e) =>
                updateItem(index, { description: e.target.value })
              }
              placeholder="Описание номера"
            />

            <ImageListField
              label="Галерея номера"
              value={room.gallery || []}
              onChange={(gallery) => updateItem(index, { gallery })}
            />

            <Input
              value={room.video_url || ""}
              onChange={(e) => updateItem(index, { video_url: e.target.value })}
              placeholder="Ссылка на YouTube / видеообзор"
            />

            <RoomUnavailableDatesField
              value={room.unavailable_dates || []}
              dates={dates}
              onChange={(unavailable_dates) =>
                updateItem(index, { unavailable_dates })
              }
            />
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-2"
        onClick={addItem}
      >
        <Plus className="size-4 mr-1" /> Добавить номер
      </Button>
    </div>
  );
}

function RoomUnavailableDatesField({ value, dates, onChange }) {
  const toggleDate = (date) => {
    const key = date.id || date.start;
    if (!key) return;

    if (value.includes(key)) {
      onChange(value.filter((x) => x !== key));
    } else {
      onChange([...value, key]);
    }
  };

  return (
    <div>
      <Label className="text-xs">Недоступные / выкупленные даты номера</Label>

      {!dates.length && (
        <p className="mt-1 text-xs text-neutral-500">
          Сначала добавьте даты в цепочку.
        </p>
      )}

      <div className="mt-2 grid sm:grid-cols-2 gap-2">
        {dates.map((date) => {
          const key = date.id || date.start;
          const checked = value.includes(key);

          return (
            <label
              key={key}
              className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${
                checked
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-neutral-200 bg-white text-neutral-700"
              }`}
            >
              <span>{formatDateLabel(date)}</span>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleDate(date)}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function formatDateLabel(date) {
  if (!date?.start) return "";

  return date.end
    ? `${formatDate(date.start)} → ${formatDate(date.end)}`
    : formatDate(date.start);
}

function FaqField({ value, onChange }) {
  const items = value.length ? value : [{ question: "", answer: "" }];

  const updateItem = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const addItem = () => onChange([...items, { question: "", answer: "" }]);
  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div>
      <Label>FAQ по туру</Label>

      <div className="mt-2 space-y-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-xl border p-3 space-y-2">
            <div className="flex gap-2">
              <Input
                value={item.question || ""}
                onChange={(e) =>
                  updateItem(index, { question: e.target.value })
                }
                placeholder="Вопрос"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => removeItem(index)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <Textarea
              value={item.answer || ""}
              onChange={(e) => updateItem(index, { answer: e.target.value })}
              placeholder="Ответ"
            />
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-2"
        onClick={addItem}
      >
        <Plus className="size-4 mr-1" /> Добавить вопрос
      </Button>
    </div>
  );
}
function BadgesField({ value, onChange }) {
  const presetBadges = [
    "Хит",
    "Бестселлер",
    "Скидка",
    "Новинка",
    "Без виз",
    "Море",
  ];

  const addBadge = (badge) => {
    if (!badge || value.includes(badge)) return;
    onChange([...value, badge]);
  };

  const removeBadge = (badge) => {
    onChange(value.filter((x) => x !== badge));
  };

  const [customBadge, setCustomBadge] = useState("");

  return (
    <div>
      <Label>Бейджи</Label>

      <div className="mt-2 flex gap-2">
        <Select onValueChange={addBadge}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите бейдж" />
          </SelectTrigger>
          <SelectContent>
            {presetBadges.map((badge) => (
              <SelectItem key={badge} value={badge}>
                {badge}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={customBadge}
          onChange={(e) => setCustomBadge(e.target.value)}
          placeholder="Свой бейдж"
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            addBadge(customBadge.trim());
            setCustomBadge("");
          }}
        >
          Добавить
        </Button>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {value.map((badge) => (
          <button
            key={badge}
            type="button"
            onClick={() => removeBadge(badge)}
            className="rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-xs"
          >
            {badge} ×
          </button>
        ))}
      </div>
    </div>
  );
}
