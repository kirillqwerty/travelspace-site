import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  X,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { mediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/formatDate";
import { RICH_TEXT_ICONS } from "@/lib/richText";

const TITLES = {
  tours: "Туры",
  reviews: "Отзывы",
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
      {
        key: "slug",
        label: "URL (slug)",
        type: "text",
        placeholder:
          "Можно указать вручную. Если оставить пустым, создастся из названия.",
      },
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
        key: "departure_cities",
        label: "Города отправления",
        type: "city-multi-select",
      },
      { key: "price_from", label: "Основная цена", type: "number" },
      {
        key: "price_type",
        label: "Тип цены",
        type: "select",
        options: ["от", "фиксированная", "за человека", "за тур"],
      },
      {
        key: "currency",
        label: "Валюта основной цены",
        type: "select",
        options: ["BYN", "RUB", "USD", "EUR"],
      },
      {
        key: "additional_price",
        label: "Придаточная цена (опционально)",
        type: "number",
        placeholder: "Например 150",
      },
      {
        key: "additional_currency",
        label: "Валюта придаточной цены",
        type: "select",
        options: ["BYN", "RUB", "USD", "EUR"],
      },
      { key: "short_description", label: "Краткое описание", type: "textarea" },
      {
        key: "description",
        label: "Полное описание тура",
        type: "textarea",
        rows: 6,
        placeholder:
          "Можно использовать **жирный**, _курсив_, __подчеркнутый__",
      },
      { key: "hero_image", label: "Главное фото для десктопа", type: "image" },
      {
        key: "hero_mobile_image",
        label: "Главное фото для мобильной версии",
        type: "image",
      },
      { key: "seo_title", label: "SEO Title", type: "text" },
      { key: "seo_description", label: "SEO Description", type: "textarea" },
      {
        key: "seo_image",
        label: "SEO / Open Graph фото для ссылки",
        type: "image",
      },
      { key: "order", label: "Порядок", type: "number" },
      {
        key: "active",
        label:
          "Включён полностью (если выключить — страница тура не открывается)",
        type: "switch",
      },
      {
        key: "hidden",
        label:
          "Скрыть из каталога и меню (прямая ссылка на тур останется рабочей)",
        type: "switch",
        defaultValue: false,
      },
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
  reviews: {
    label: (r) => r.name || r.tour_name || r.id,
    description: (r) => r.text || r.tour_name || "",
    image: (r) => r.photo,
    fields: [
      { key: "name", label: "Имя", type: "text" },
      { key: "tour_name", label: "Тур / направление", type: "text" },
      { key: "text", label: "Текст отзыва", type: "textarea" },
      { key: "photo", label: "Скрин/фото отзыва", type: "image" },
      { key: "external_link", label: "Ссылка на оригинал", type: "text" },
      { key: "rating", label: "Рейтинг", type: "number" },
      { key: "date", label: "Дата", type: "text" },
      { key: "order", label: "Порядок", type: "number" },
      { key: "active", label: "Активен", type: "switch" },
    ],
  },
  articles: {
    label: (a) => a.title,
    description: (a) => a.published_at,
    image: (a) => a.cover,
    fields: [
      { key: "title", label: "Заголовок", type: "text" },
      {
        key: "slug",
        label: "URL (slug)",
        type: "text",
        placeholder:
          "Можно указать вручную. Если оставить пустым, создастся из заголовка.",
      },
      { key: "cover", label: "Обложка", type: "image" },
      {
        key: "gallery",
        label: "Дополнительные фото внутри статьи",
        type: "image-list",
      },
      { key: "excerpt", label: "Краткое описание", type: "textarea" },
      {
        key: "content",
        label: "Содержание",
        type: "textarea",
        rows: 14,
        placeholder:
          "Разбивайте текст на короткие абзацы. Можно использовать **жирный**, _курсив_, __подчеркнутый__, [ссылку](https://example.com).",
        hint: "Для акцентов используйте: **жирный**, _курсив_, __подчеркнутый__. Дополнительные фото будут автоматически вставляться между абзацами.",
      },
      { key: "seo_title", label: "SEO Title", type: "text" },
      { key: "seo_description", label: "SEO Description", type: "textarea" },
      {
        key: "seo_image",
        label: "SEO / Open Graph фото для ссылки",
        type: "image",
      },
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
      {
        key: "related_tour_slugs",
        label: "Slug туров, к которым применяется акция",
        type: "string-list",
        placeholder: "dagestan-7-dney",
      },
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

const normalizeDateRecord = (d = {}, record = {}) => ({
  id: d.id || uid(),
  start: d.start || "",
  end: d.end || "",
  price: d.price === "" ? "" : Number(d.price ?? record.price_from ?? 0),
  currency: d.currency || record.currency || "BYN",
  price_type: d.price_type || d.priceType || "from",
  status: d.status || "active",
  comment: d.comment || "",
});

const ROOM_MEAL_PLANS = [
  { key: "breakfast", label: "Завтрак" },
  { key: "breakfast_lunch", label: "Завтрак + обед" },
  { key: "breakfast_dinner", label: "Завтрак + ужин" },
  { key: "breakfast_full", label: "Завтрак + обед + ужин" },
];

const DEFAULT_TOUR_BADGES = [
  "Хит продаж",
  "На скидке",
  "Новинка",
  "Без виз",
  "Отдых на море",
  "Морской тур",
  "Автобусный тур",
  "Авиа тур",
  "Горящие даты",
  "Акционные даты",
  "Летний тур",
  "Зимний тур",
  "Осенний тур",
  "Весенний тур",
  "Корпоративный тур",
  "Тур для детей",
];

const normalizeMealPriceRecord = (meal = {}, fallback = {}) => ({
  price: meal.price ?? fallback.price ?? "",
  currency: meal.currency || fallback.currency || "BYN",
});

const hasMealPriceValue = (meal = {}) =>
  [meal.price].some(
    (value) =>
      value !== undefined && value !== null && String(value).trim() !== "",
  );

const normalizeRoomDatePriceRecord = (price = {}, room = {}) => {
  const fallback = {
    price: price.price ?? price.main_price ?? price.base_price ?? "",
    currency:
      price.currency ||
      price.main_currency ||
      price.base_currency ||
      room.currency ||
      "BYN",
    additional_price:
      price.additional_price ??
      price.additionalPrice ??
      price.extra_price ??
      price.extraPrice ??
      "",
    additional_currency:
      price.additional_currency ||
      price.additionalCurrency ||
      price.extra_currency ||
      price.extraCurrency ||
      price.currency ||
      room.currency ||
      "BYN",
  };

  const rawMealPrices = price.meal_prices || price.mealPrices || {};
  const meal_prices = ROOM_MEAL_PLANS.reduce((acc, plan, index) => {
    const rawMeal = rawMealPrices[plan.key] || rawMealPrices[plan.label] || {};
    acc[plan.key] = normalizeMealPriceRecord(
      rawMeal,
      index === 0 ? fallback : { currency: fallback.currency },
    );
    return acc;
  }, {});

  return {
    id: price.id || uid(),
    date_id: price.date_id || price.dateId || "",
    date_start: price.date_start || price.dateStart || "",
    date_label: price.date_label || price.dateLabel || "",
    meal_prices,
    price: fallback.price,
    currency: fallback.currency,
    additional_price: fallback.additional_price,
    additional_currency: fallback.additional_currency,
  };
};

const normalizeRoomRecord = (room = {}) => ({
  id: room.id || uid(),
  number: room.number || "",
  title: room.title || "",
  description: room.description || "",
  gallery: Array.isArray(room.gallery) ? room.gallery.filter(Boolean) : [],
  video_url: room.video_url || room.videoUrl || "",
  // CHANGE: цена номера теперь может задаваться отдельно для каждой даты цепочки.
  date_prices: Array.isArray(room.date_prices)
    ? room.date_prices.map((price) => normalizeRoomDatePriceRecord(price, room))
    : Array.isArray(room.datePrices)
      ? room.datePrices.map((price) =>
          normalizeRoomDatePriceRecord(price, room),
        )
      : [],
  // legacy fallback, чтобы старые данные с общей ценой номера не потерялись
  price: room.price ?? "",
  currency: room.currency || "BYN",
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
  anchor_slug: h.anchor_slug || h.anchor || h.slug || "",
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
    slug: record.slug || slugify(record.title || ""),
    tagline: record.tagline || "",
    region_name: record.region_name || "",
    region_slug: record.region_slug || slugify(record.region_name || ""),
    duration: record.duration || "",
    departure_city: record.departure_city || "Минск",
    departure_cities: Array.isArray(record.departure_cities)
      ? record.departure_cities.filter(Boolean)
      : Array.isArray(record.departureCities)
        ? record.departureCities.filter(Boolean)
        : record.departure_city
          ? [record.departure_city]
          : ["Минск"],
    price_from: record.price_from ?? "",
    price_type: record.price_type || "от",
    currency: record.currency || "BYN",
    additional_price: record.additional_price ?? "",
    additional_currency: record.additional_currency || "BYN",
    short_description: record.short_description || "",
    description: record.description || "",
    hero_image: record.hero_image || "",
    hero_mobile_image:
      record.hero_mobile_image ||
      record.mobile_hero_image ||
      record.hero_mobile ||
      "",
    seo_title: record.seo_title || "",
    seo_description: record.seo_description || "",
    seo_image: record.seo_image || record.og_image || record.hero_image || "",
    order: record.order ?? "",
    active: record.active !== false,
    hidden:
      record.hidden === true ||
      record.hide_from_catalog === true ||
      record.catalog_hidden === true ||
      record.show_in_catalog === false ||
      record.visible === false,

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
      ? record.program.map((d, index) => {
          const images = Array.isArray(d.images)
            ? d.images.filter(Boolean)
            : d.image
              ? [d.image]
              : [];

          return {
            day: String(d.day || index + 1),
            title: d.title || "",
            description: d.description || "",
            image: d.image || images[0] || "",
            images,
            notes: d.notes || "",
          };
        })
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
                      <span className="text-red-600">Выключено</span>
                    ) : it.hidden === true ||
                      it.hide_from_catalog === true ||
                      it.catalog_hidden === true ||
                      it.show_in_catalog === false ||
                      it.visible === false ? (
                      <span className="text-amber-600">Скрыто из каталога</span>
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
        if (f.defaultValue !== undefined) {
          known[f.key] = f.defaultValue;
        } else {
          known[f.key] = f.type === "switch" ? true : "";
        }
      }
    });

    setForm(known);
    setExtraJson(
      Object.keys(extra).length ? JSON.stringify(extra, null, 2) : "",
    );
    setJsonError("");
  }, [open, record, schema, collectionName]);
  const update = useCallback((k, v) => setForm((p) => ({ ...p, [k]: v })), []);

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
      payload.slug = form.slug?.trim() || slugify(form.title);
      payload.region_slug =
        form.region_slug?.trim() || slugify(form.region_name);
      payload.departure_cities = Array.isArray(form.departure_cities)
        ? form.departure_cities.filter(Boolean)
        : form.departure_city
          ? [form.departure_city]
          : [];
      payload.departure_city =
        payload.departure_cities[0] || form.departure_city || "";

      payload.program = Array.isArray(form.program)
        ? form.program.map((day, index) => {
            const images = Array.isArray(day.images)
              ? day.images.filter(Boolean)
              : day.image
                ? [day.image]
                : [];

            return {
              ...day,
              day: String(day.day || index + 1),
              images,
              image: images[0] || "",
            };
          })
        : [];
    }

    if (collectionName === "articles") {
      payload.slug = form.slug?.trim() || slugify(form.title);
    }

    if (collectionName === "promotions") {
      payload.related_tour_slugs = Array.isArray(form.related_tour_slugs)
        ? form.related_tour_slugs
            .map((slug) => String(slug || "").trim())
            .filter(Boolean)
        : [];
      payload.related_tour_slug = payload.related_tour_slugs[0] || "";
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
        className="max-w-2xl max-w-[1500px]
  h-[95vh]
  max-h-[95vh] p-0 overflow-hidden flex flex-col"
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
                ) : f.type === "city-multi-select" ? (
                  <CityMultiSelect
                    value={form[f.key] || []}
                    legacyValue={form.departure_city}
                    onChange={(v) => update(f.key, v)}
                  />
                ) : f.type === "date" ? (
                  <DateInput
                    value={form[f.key] ?? ""}
                    onChange={(v) => update(f.key, v)}
                    placeholder={f.placeholder}
                  />
                ) : f.type === "textarea" ? (
                  f.key.startsWith("seo_") ? (
                    <Textarea
                      value={form[f.key] ?? ""}
                      onChange={(e) => update(f.key, e.target.value)}
                      rows={f.rows || 3}
                      placeholder={f.placeholder}
                      className="mt-1"
                    />
                  ) : (
                    <RichTextarea
                      value={form[f.key] ?? ""}
                      onChange={(v) => update(f.key, v)}
                      rows={f.rows || 3}
                      placeholder={f.placeholder}
                    />
                  )
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
                ) : f.type === "image-list" ? (
                  <ImageListField
                    label=""
                    value={Array.isArray(form[f.key]) ? form[f.key] : []}
                    onChange={(v) => update(f.key, v)}
                  />
                ) : f.type === "image" ? (
                  <ImageInput
                    value={form[f.key] || ""}
                    onChange={(v) => update(f.key, v)}
                  />
                ) : f.type === "string-list" ? (
                  <StringListField
                    label=""
                    value={form[f.key] || []}
                    onChange={(v) => update(f.key, v)}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <Input
                    value={form[f.key] ?? ""}
                    onChange={(e) => update(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="mt-1"
                  />
                )}
                {f.hint && (
                  <p className="mt-1 text-xs text-neutral-500">{f.hint}</p>
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
              <MemoTourExtraFields form={form} setForm={setForm} />
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

function RichTextarea({
  value = "",
  onChange,
  rows = 3,
  placeholder = "",
  className = "",
}) {
  const textareaRef = useRef(null);

  const insertToken = (token) => {
    const textarea = textareaRef.current;
    const currentValue = String(value ?? "");
    const start = textarea?.selectionStart ?? currentValue.length;
    const end = textarea?.selectionEnd ?? currentValue.length;
    const before = currentValue.slice(0, start);
    const after = currentValue.slice(end);
    const prefix = before && !/\s$/.test(before) ? " " : "";
    const suffix = after && !/^\s/.test(after) ? " " : "";
    const inserted = `${prefix}${token}${suffix}`;
    const nextValue = `${before}${inserted}${after}`;
    const nextCursor = start + inserted.length;

    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  return (
    <div className="mt-1 space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
        <span className="px-2 text-[11px] font-medium text-neutral-500">
          Смайлы:
        </span>

        {RICH_TEXT_ICONS.map((item) => (
          <button
            key={item.token}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => insertToken(item.token)}
            className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-1 text-xs text-neutral-700 transition hover:border-orange-200 hover:bg-white hover:text-[#C2410C]"
            title={`Вставить ${item.label}`}
          >
            <img
              src={item.icon}
              alt=""
              aria-hidden="true"
              className="size-4 shrink-0 object-contain"
            />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>

      <Textarea
        ref={textareaRef}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`leading-6 ${className}`}
      />

      <p className="text-xs text-neutral-500">
        Enter — новая строка, пустая строка — отдельный абзац. Для акцентов:
        <b> **жирный**</b>, _курсив_, __подчёркнутый__, [ссылка](https://...).
      </p>
    </div>
  );
}
const slugify = (text = "") =>
  String(text || "")
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

const cleanHotelAnchorSlug = (value = "") => {
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

  const rawValue = String(value || "");

  const hashValue = rawValue.includes("#")
    ? rawValue.split("#").pop()
    : rawValue;

  return String(hashValue || "")
    .replace(/^hotel-/i, "")
    .toLowerCase()
    .replace(/[а-яё]/g, (char) => map[char] || char)
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]+/g, "")
    .replace(/-{2,}/g, "-");
};

const getHotelAnchorHash = (hotel = {}) => {
  const slug = cleanHotelAnchorSlug(
    hotel.anchor_slug || hotel.anchor || hotel.slug || hotel.name || hotel.id,
  );

  return slug ? `#${slug}` : "";
};

const getHotelAnchorPath = (tourSlug, hotel = {}) => {
  const hash = getHotelAnchorHash(hotel);
  return hash ? `/tours/${tourSlug || "slug-tura"}${hash}` : "";
};

const buildHotelAnchorUrl = (tourSlug, hotel = {}) => {
  const path = getHotelAnchorPath(tourSlug, hotel);
  if (!path) return "";

  return typeof window !== "undefined"
    ? `${window.location.origin}${path}`
    : path;
};

const copyToClipboard = (value) => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(value);
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";

  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);

  return Promise.resolve();
};

function TourExtraFields({ form, setForm }) {
  const update = useCallback(
    (key, value) => {
      setForm((prev) => {
        if (prev[key] === value) return prev;
        return { ...prev, [key]: value };
      });
    },
    [setForm],
  );

  const tourSlug = useMemo(
    () => form.slug || slugify(form.title || ""),
    [form.slug, form.title],
  );

  const updateBadges = useCallback((v) => update("badges", v), [update]);
  const updateGallery = useCallback((v) => update("gallery", v), [update]);
  const updateHighlights = useCallback(
    (v) => update("highlights", v),
    [update],
  );
  const updateWhatToSee = useCallback(
    (v) => update("what_to_see", v),
    [update],
  );
  const updateIncluded = useCallback((v) => update("included", v), [update]);
  const updateExcluded = useCallback((v) => update("excluded", v), [update]);
  const updateImportantInfo = useCallback(
    (v) => update("important_info", v),
    [update],
  );
  const updateProgram = useCallback((v) => update("program", v), [update]);
  const updateChains = useCallback((v) => update("chains", v), [update]);
  const updateFaq = useCallback((v) => update("faq", v), [update]);

  return (
    <div className="space-y-6 rounded-xl border border-neutral-200 p-4">
      <h3 className="font-medium">Дополнительная информация</h3>

      <MemoBadgesField value={form.badges || []} onChange={updateBadges} />

      <MemoImageListField
        label="Галерея"
        value={form.gallery || []}
        onChange={updateGallery}
      />

      <MemoStringListField
        label="Главные впечатления"
        value={form.highlights || []}
        onChange={updateHighlights}
        placeholder="Сулакский каньон — самый глубокий в Европе"
      />

      <MemoStringListField
        label="Что посмотреть"
        value={form.what_to_see || []}
        onChange={updateWhatToSee}
        placeholder="Дербент и крепость Нарын-Кала"
      />

      <MemoStringListField
        label="Что входит"
        value={form.included || []}
        onChange={updateIncluded}
        placeholder="Проезд автобусом"
      />

      <MemoStringListField
        label="Что не входит"
        value={form.excluded || []}
        onChange={updateExcluded}
        placeholder="Личные расходы"
      />

      <MemoStringListField
        label="Важная информация"
        value={form.important_info || []}
        onChange={updateImportantInfo}
        placeholder="Документ: внутренний или загранпаспорт"
      />

      <MemoProgramField value={form.program || []} onChange={updateProgram} />

      <MemoChainsField
        value={form.chains || []}
        onChange={updateChains}
        tourSlug={tourSlug}
        tourCurrency={form.currency || "BYN"}
        tourPrice={form.price_from || ""}
      />

      <MemoFaqField value={form.faq || []} onChange={updateFaq} />

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
  const items = Array.isArray(value) ? value : [];

  const updateItem = (index, text) => {
    const next = [...items];
    next[index] = text;
    onChange(next);
  };

  const addItem = () => onChange([...items, ""]);
  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div>
      {label && <Label>{label}</Label>}

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
              aria-label="Удалить строку"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}

        {!items.length && (
          <p className="rounded-lg border border-dashed border-neutral-200 px-3 py-2 text-xs text-neutral-500">
            Значения не добавлены. Нажмите «Добавить», чтобы создать строку.
          </p>
        )}
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
  const sourceItems = Array.isArray(value) ? value : [];
  const items = sourceItems.length ? sourceItems : [""];
  const [draggedIndex, setDraggedIndex] = useState(null);

  const updateItem = (index, text) => {
    const next = [...items];
    next[index] = text;
    onChange(next);
  };

  const addItem = () => {
    onChange([...items, ""]);
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index).filter(Boolean));
  };

  const moveItem = (fromIndex, toIndex) => {
    const filledItems = items.filter(Boolean);
    onChange(reorderArray(filledItems, fromIndex, toIndex));
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
              aria-label="Удалить фото"
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
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          addItem();
        }}
      >
        <Plus className="size-4 mr-1" /> Добавить фото
      </Button>

      <p className="mt-2 text-xs text-neutral-500">
        Порядок фото можно менять перетягиванием. Первое фото будет главным.
      </p>
    </div>
  );
}

const DEFAULT_DEPARTURE_CITIES = [
  "Минск",
  "Гомель",
  "Жлобин",
  "Бобруйск",
  "Москва",
  "Витебск",
  "Могилев",
  "Новополоцк",
  "Брест",
  "Гродно",
  "Барановичи",
  "Орша",
  "Жодино",
  "Полоцк",
];

function CitySelect({ value, onChange }) {
  const cities = DEFAULT_DEPARTURE_CITIES;

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

function CityMultiSelect({ value = [], legacyValue, onChange }) {
  const cities = DEFAULT_DEPARTURE_CITIES;
  const selected = Array.isArray(value)
    ? value
    : value
      ? [value]
      : legacyValue
        ? [legacyValue]
        : [];
  const [customCity, setCustomCity] = useState("");

  const toggleCity = (city) => {
    onChange(
      selected.includes(city)
        ? selected.filter((item) => item !== city)
        : [...selected, city],
    );
  };

  const addCustomCity = () => {
    const city = customCity.trim();
    if (!city) return;

    if (!selected.includes(city)) {
      onChange([...selected, city]);
    }

    setCustomCity("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {cities.map((city) => {
          const active = selected.includes(city);

          return (
            <button
              key={city}
              type="button"
              onClick={() => toggleCity(city)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                active
                  ? "border-[#C2410C] bg-orange-50 text-[#C2410C]"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              {city}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => onChange(selected.filter((item) => item !== city))}
              className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-700"
            >
              {city} ×
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={customCity}
          placeholder="Свой город в родительном падеже"
          onChange={(e) => setCustomCity(e.target.value)}
        />

        <Button type="button" variant="outline" onClick={addCustomCity}>
          Добавить
        </Button>
      </div>

      <p className="text-xs text-neutral-500">
        Для городов из списка падеж подставится в карточке автоматически. Свой
        город вводите сразу в родительном падеже: «Вильнюса», «Тбилиси».
        Выбранные города сохраняются и не сбрасываются при повторном
        редактировании.
      </p>
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

function getProgramItemImages(item) {
  // В редакторе нельзя фильтровать пустые строки:
  // кнопка "Добавить фото" добавляет пустой слот, куда потом загружается картинка.
  // Если отфильтровать Boolean здесь, новый слот сразу исчезает и кнопка выглядит "некликабельной".
  if (Array.isArray(item?.images)) {
    if (item.images.length) return item.images;
    return item?.image ? [item.image] : [];
  }

  return item?.image ? [item.image] : [];
}

function ProgramField({ value, onChange }) {
  const items = value.length
    ? value
    : [
        {
          day: "1",
          title: "",
          description: "",
          image: "",
          images: [],
          notes: "",
        },
      ];

  const updateItem = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const updateImages = (index, images) => {
    const nextImages = Array.isArray(images) ? images : [];

    updateItem(index, {
      images: nextImages,
      image: nextImages.find(Boolean) || "",
    });
  };

  const addItem = () =>
    onChange([
      ...items,
      {
        day: String(items.length + 1),
        title: "",
        description: "",
        image: "",
        images: [],
        notes: "",
      },
    ]);

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div>
      <Label>Программа по дням</Label>
      <p className="mt-1 text-xs text-neutral-500">
        В поле дня можно указать не только номер, но и промежуток: например
        «5-13» или «5–13». Фото дня можно загрузить несколько — на странице тура
        они отобразятся каруселью.
      </p>

      <div className="mt-2 space-y-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-xl border p-3 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={item.day ?? ""}
                placeholder="День / дни, напр. 5-13"
                onChange={(e) => updateItem(index, { day: e.target.value })}
                className="sm:w-44"
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

            <div>
              <RichTextarea
                value={item.description || ""}
                onChange={(value) => updateItem(index, { description: value })}
                rows={5}
                placeholder="Описание дня. Абзацы, переносы строк и смайлы поддерживаются."
              />
            </div>

            <ImageListField
              label="Фото дня"
              value={getProgramItemImages(item)}
              onChange={(images) => updateImages(index, images)}
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
          price_type: "from",
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
        price_type: "from",
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
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-neutral-500">
                Дата {index + 1}
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!confirm("Удалить эту дату?")) return;
                  removeItem(index);
                }}
                className="h-9 px-3 text-red-600 hover:text-red-700"
                aria-label="Удалить дату"
              >
                <X className="size-4" />
              </Button>
            </div>

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

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
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
                <Label className="text-xs">Ценник</Label>
                <Select
                  value={item.price_type || "from"}
                  onValueChange={(v) => updateItem(index, { price_type: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="from">От цены</SelectItem>
                    <SelectItem value="fixed">Фиксированная</SelectItem>
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

function ChainsField({ value, onChange, tourSlug, tourCurrency, tourPrice }) {
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

            <RichTextarea
              value={chain.description || ""}
              onChange={(value) => updateItem(index, { description: value })}
              placeholder="Комментарий к цепочке, если нужен"
              rows={2}
            />

            <MemoDatesField
              value={chain.dates || []}
              onChange={(dates) => updateItem(index, { dates })}
              defaultCurrency={tourCurrency}
              defaultPrice={tourPrice}
            />

            <MemoChainHotelsField
              value={chain.hotels || []}
              dates={chain.dates || []}
              tourSlug={tourSlug}
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

function ChainHotelsField({ value, dates, tourSlug, onChange }) {
  const [copiedHotelId, setCopiedHotelId] = useState("");
  const items = value.length
    ? value
    : [
        {
          id: uid(),
          name: "",
          anchor_slug: "",
          description: "",
          images: [],
          image: "",
          meal: "",
          location: "",
          rooms: [],
          active: true,
        },
      ];

  const copyHotelLink = useCallback(
    async (hotel, fallbackId) => {
      const link = buildHotelAnchorUrl(tourSlug, hotel);
      if (!link) return;

      try {
        await copyToClipboard(link);
        setCopiedHotelId(fallbackId);
        window.setTimeout(() => {
          setCopiedHotelId((current) =>
            current === fallbackId ? "" : current,
          );
        }, 1800);
      } catch (error) {
        console.error("Hotel admin link copy failed", error);
        toast.error("Не удалось скопировать ссылку");
      }
    },
    [tourSlug],
  );

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
        anchor_slug: "",
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

            <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-3">
              <Label className="text-xs">
                Якорь для прямой ссылки на отель
              </Label>
              <Input
                value={item.anchor_slug || ""}
                onChange={(e) =>
                  updateItem(index, {
                    anchor_slug: cleanHotelAnchorSlug(e.target.value),
                  })
                }
                placeholder="Например: sweet-house"
                className="mt-1 bg-white"
              />
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="min-w-0 text-xs text-neutral-500">
                  Ссылку можно отправить клиенту:{" "}
                  <span className="break-all font-mono text-[#C2410C]">
                    {getHotelAnchorPath(tourSlug, item) ||
                      `/tours/${tourSlug || "slug-tura"}#hotel-sweet-house`}
                  </span>
                </p>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyHotelLink(item, item.id || String(index))}
                  className={`h-9 shrink-0 rounded-full px-3 text-xs ${
                    copiedHotelId === (item.id || String(index))
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-orange-200 text-[#C2410C] hover:bg-orange-50"
                  }`}
                >
                  {copiedHotelId === (item.id || String(index)) ? (
                    <Check className="mr-1 size-3.5" />
                  ) : (
                    <Copy className="mr-1 size-3.5" />
                  )}
                  {copiedHotelId === (item.id || String(index))
                    ? "Скопировано"
                    : "Копировать"}
                </Button>
              </div>
            </div>

            <RichTextarea
              value={item.description || ""}
              onChange={(value) => updateItem(index, { description: value })}
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

            <MemoRoomsField
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
          date_prices: [],
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
        date_prices: [],
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

            <RichTextarea
              value={room.description || ""}
              onChange={(value) => updateItem(index, { description: value })}
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

            {/* CHANGE: цены номера по конкретным датам цепочки */}
            <MemoRoomDatePricesField
              value={room.date_prices || []}
              dates={dates}
              defaultCurrency={room.currency || "BYN"}
              onChange={(date_prices) => updateItem(index, { date_prices })}
            />

            <MemoRoomUnavailableDatesField
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

function RoomDatePricesField({
  value = [],
  dates,
  defaultCurrency = "BYN",
  onChange,
}) {
  const currencies = ["BYN", "RUB", "USD", "EUR"];
  const getKey = (date) => date.id || date.start;

  const getPriceRecord = (date) => {
    const key = getKey(date);

    return (value || []).find(
      (item) =>
        item.date_id === key ||
        item.date_start === date.start ||
        item.date_label === formatDateLabel(date),
    );
  };

  const getMealRecord = (date, planKey) => {
    const priceRecord = getPriceRecord(date);
    const meal = priceRecord?.meal_prices?.[planKey] || {};

    if (planKey === "breakfast") {
      return {
        price: meal.price ?? priceRecord?.price ?? "",
        currency: meal.currency || priceRecord?.currency || defaultCurrency,
      };
    }

    return {
      price: meal.price ?? "",
      currency: meal.currency || defaultCurrency,
    };
  };

  const getDateAdditionalRecord = (date) => {
    const priceRecord = getPriceRecord(date);

    return {
      additional_price: priceRecord?.additional_price ?? "",
      additional_currency:
        priceRecord?.additional_currency ||
        priceRecord?.currency ||
        defaultCurrency,
    };
  };

  const updateDateAdditionalPrice = (date, patch) => {
    const key = getKey(date);
    if (!key) return;

    const date_label = formatDateLabel(date);
    const current = getPriceRecord(date);
    const nextRecord = {
      id: current?.id || uid(),
      date_id: key,
      date_start: date.start || "",
      date_label,
      meal_prices: current?.meal_prices || {},
      price: current?.price ?? "",
      currency: current?.currency || defaultCurrency,
      additional_price: current?.additional_price ?? "",
      additional_currency:
        current?.additional_currency || current?.currency || defaultCurrency,
      ...patch,
    };

    const otherRecords = (value || []).filter(
      (item) =>
        item.date_id !== key &&
        item.date_start !== date.start &&
        item.date_label !== date_label,
    );

    const hasAnyPrice =
      ROOM_MEAL_PLANS.some((plan) =>
        hasMealPriceValue(nextRecord.meal_prices?.[plan.key]),
      ) || hasMealPriceValue({ price: nextRecord.additional_price });

    onChange(hasAnyPrice ? [...otherRecords, nextRecord] : otherRecords);
  };

  const updateMealPrice = (date, planKey, patch) => {
    const key = getKey(date);
    if (!key) return;

    const date_label = formatDateLabel(date);
    const current = getPriceRecord(date);
    const currentMealPrices = current?.meal_prices || {};
    const nextMeal = {
      ...getMealRecord(date, planKey),
      ...patch,
    };

    const nextMealPrices = {
      ...currentMealPrices,
      [planKey]: nextMeal,
    };

    const breakfast = nextMealPrices.breakfast || {};
    const nextRecord = {
      id: current?.id || uid(),
      date_id: key,
      date_start: date.start || "",
      date_label,
      meal_prices: nextMealPrices,
      price: breakfast.price ?? "",
      currency: breakfast.currency || defaultCurrency,
      additional_price: current?.additional_price ?? "",
      additional_currency:
        current?.additional_currency || current?.currency || defaultCurrency,
    };

    const otherRecords = (value || []).filter(
      (item) =>
        item.date_id !== key &&
        item.date_start !== date.start &&
        item.date_label !== date_label,
    );

    const hasAnyPrice =
      ROOM_MEAL_PLANS.some((plan) =>
        hasMealPriceValue(nextRecord.meal_prices?.[plan.key]),
      ) || hasMealPriceValue({ price: nextRecord.additional_price });

    onChange(hasAnyPrice ? [...otherRecords, nextRecord] : otherRecords);
  };

  return (
    <div className="rounded-xl border border-orange-100 bg-orange-50/30 p-3">
      <Label className="text-sm font-semibold">
        Прайслист номера по датам и питанию
      </Label>
      <p className="mt-1 text-xs text-neutral-500">
        Для каждой даты заезда заполните доплату один раз и стоимость номера по
        каждому плану питания.
      </p>

      {!dates.length && (
        <p className="mt-2 text-xs text-neutral-500">
          Сначала добавьте даты в цепочку.
        </p>
      )}

      {dates.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="min-w-[1080px] w-full text-xs">
            <thead className="bg-neutral-50 text-neutral-700">
              <tr>
                <th className="border-b border-neutral-200 px-3 py-2 text-left">
                  Дата заезда
                </th>
                <th className="border-b border-l border-neutral-200 px-3 py-2 text-left">
                  Доплата за заезд
                </th>
                {ROOM_MEAL_PLANS.map((plan) => (
                  <th
                    key={plan.key}
                    className="border-b border-l border-neutral-200 px-3 py-2 text-left"
                  >
                    {plan.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {dates.map((date) => {
                const key = getKey(date);

                return (
                  <tr key={key} className="align-top">
                    <td className="border-b border-neutral-100 px-3 py-3 font-medium text-neutral-700">
                      {formatDateLabel(date)}
                    </td>

                    <td className="border-b border-l border-neutral-100 px-3 py-3">
                      {(() => {
                        const additional = getDateAdditionalRecord(date);

                        return (
                          <div className="grid grid-cols-[minmax(90px,1fr)_82px] gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={additional.additional_price ?? ""}
                              onChange={(e) =>
                                updateDateAdditionalPrice(date, {
                                  additional_price:
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value),
                                })
                              }
                              placeholder="+ доп."
                            />

                            <Select
                              value={
                                additional.additional_currency ||
                                defaultCurrency
                              }
                              onValueChange={(additional_currency) =>
                                updateDateAdditionalPrice(date, {
                                  additional_currency,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {currencies.map((currency) => (
                                  <SelectItem key={currency} value={currency}>
                                    {currency}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })()}
                    </td>

                    {ROOM_MEAL_PLANS.map((plan) => {
                      const meal = getMealRecord(date, plan.key);

                      return (
                        <td
                          key={plan.key}
                          className="border-b border-l border-neutral-100 px-3 py-3"
                        >
                          <div className="grid grid-cols-[minmax(90px,1fr)_82px] gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={meal.price ?? ""}
                              onChange={(e) =>
                                updateMealPrice(date, plan.key, {
                                  price:
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value),
                                })
                              }
                              placeholder="Цена"
                            />

                            <Select
                              value={meal.currency || defaultCurrency}
                              onValueChange={(currency) =>
                                updateMealPrice(date, plan.key, { currency })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {currencies.map((currency) => (
                                  <SelectItem key={currency} value={currency}>
                                    {currency}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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

            <RichTextarea
              value={item.answer || ""}
              onChange={(value) => updateItem(index, { answer: value })}
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
  const presetBadges = DEFAULT_TOUR_BADGES;

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

function areTourExtraFieldsEqual(prevProps, nextProps) {
  const prev = prevProps.form || {};
  const next = nextProps.form || {};
  const prevSlug = prev.slug || slugify(prev.title || "");
  const nextSlug = next.slug || slugify(next.title || "");

  return (
    prevSlug === nextSlug &&
    prev.currency === next.currency &&
    prev.price_from === next.price_from &&
    TOUR_EXTRA_KEYS.every((key) => prev[key] === next[key])
  );
}

const MemoTourExtraFields = memo(TourExtraFields, areTourExtraFieldsEqual);
const MemoBadgesField = memo(BadgesField);
const MemoImageListField = memo(ImageListField);
const MemoStringListField = memo(StringListField);
const MemoProgramField = memo(ProgramField);
const MemoChainsField = memo(ChainsField);
const MemoDatesField = memo(DatesField);
const MemoChainHotelsField = memo(ChainHotelsField);
const MemoRoomsField = memo(RoomsField);
const MemoRoomDatePricesField = memo(RoomDatePricesField);
const MemoRoomUnavailableDatesField = memo(RoomUnavailableDatesField);
const MemoFaqField = memo(FaqField);
