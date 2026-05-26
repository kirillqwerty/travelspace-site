import { useEffect, useState } from "react";
import { api } from "@/lib/api";
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
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const TITLES = {
  tours: "Туры",
  specialists: "Специалисты",
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
      { key: "slug", label: "URL (slug)", type: "text" },
      { key: "tagline", label: "Подзаголовок", type: "text" },
      { key: "region_slug", label: "Регион (slug)", type: "text", placeholder: "dagestan, georgia-kobuleti …" },
      { key: "region_name", label: "Регион (название)", type: "text" },
      { key: "duration", label: "Длительность", type: "text" },
      { key: "departure_city", label: "Город отправления", type: "text" },
      { key: "price_from", label: "Цена от", type: "number" },
      { key: "price_type", label: "Тип цены", type: "text", placeholder: "от / фиксированная" },
      { key: "currency", label: "Валюта", type: "text" },
      { key: "short_description", label: "Краткое описание", type: "textarea" },
      { key: "description", label: "Полное описание тура", type: "textarea", rows: 6 },
      { key: "hero_image", label: "URL главного фото", type: "text" },
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
      { key: "photo", label: "URL фото", type: "text" },
      { key: "order", label: "Порядок", type: "number" },
      { key: "active", label: "Активен", type: "switch" },
    ],
  },
  reviews: {
    label: (r) => r.name,
    description: (r) => r.tour_name || r.direction,
    image: (r) => r.photo,
    fields: [
      { key: "name", label: "Имя", type: "text" },
      { key: "tour_name", label: "Тур (название)", type: "text" },
      { key: "text", label: "Текст отзыва", type: "textarea" },
      { key: "rating", label: "Рейтинг (1-5)", type: "number" },
      { key: "photo", label: "URL фото", type: "text" },
      { key: "external_link", label: "Ссылка на внешний отзыв", type: "text" },
      { key: "date", label: "Дата", type: "text", placeholder: "2025-09-01" },
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
      { key: "slug", label: "URL (slug)", type: "text" },
      { key: "cover", label: "URL обложки", type: "text" },
      { key: "excerpt", label: "Краткое описание", type: "textarea" },
      { key: "content", label: "Содержание", type: "textarea", rows: 10 },
      { key: "seo_title", label: "SEO Title", type: "text" },
      { key: "seo_description", label: "SEO Description", type: "textarea" },
      { key: "published_at", label: "Дата публикации", type: "text", placeholder: "2025-09-01" },
      { key: "active", label: "Опубликовано", type: "switch" },
    ],
  },
  promotions: {
    label: (p) => p.title,
    description: (p) => p.valid_until && `до ${p.valid_until}`,
    image: (p) => p.image,
    fields: [
      { key: "title", label: "Название акции", type: "text" },
      { key: "image", label: "URL изображения", type: "text" },
      { key: "description", label: "Описание", type: "textarea" },
      { key: "valid_until", label: "Действует до", type: "text", placeholder: "2026-03-01" },
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

export default function AdminCollection({ name }) {
  const schema = SCHEMAS[name];
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () => api.get(`/admin/${name}`).then((r) => setItems(r.data));
  useEffect(() => {
    load();
  }, [name]);

  const onSave = async (record, extraJson) => {
    try {
      let extra = {};
      if (extraJson && extraJson.trim()) {
        extra = JSON.parse(extraJson);
      }
      const payload = { ...extra, ...record };
      if (record.id) {
        await api.put(`/admin/${name}/${record.id}`, payload);
        toast.success("Сохранено");
      } else {
        await api.post(`/admin/${name}`, payload);
        toast.success("Создано");
      }
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e.message || "Ошибка");
    }
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
          onClick={() => setEditing({})}
          className="rounded-full bg-[#C2410C] hover:bg-[#9A3412] text-white"
          data-testid="admin-add-btn"
        >
          <Plus className="size-4 mr-1" /> Добавить
        </Button>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-neutral-400">
            Пока пусто. Добавьте первую запись.
          </div>
        )}
        {items.map((it) => (
          <div
            key={it.id}
            className="rounded-2xl bg-white border border-neutral-200 overflow-hidden flex flex-col"
          >
            {schema.image?.(it) && (
              <div className="aspect-[16/9] bg-neutral-100">
                <img
                  src={schema.image(it)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div className="p-4 flex-1 flex flex-col">
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
                    onClick={() => setEditing(it)}
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

  useEffect(() => {
    if (!open) return;
    if (!record) return;
    const knownKeys = new Set(schema.fields.map((f) => f.key));
    knownKeys.add("id");
    const known = {};
    const extra = {};
    Object.entries(record).forEach(([k, v]) => {
      if (knownKeys.has(k)) known[k] = v;
      else extra[k] = v;
    });
    schema.fields.forEach((f) => {
      if (known[f.key] === undefined) {
        known[f.key] =
          f.type === "switch" ? true : f.type === "number" ? 0 : "";
      }
    });
    setForm(known);
    setExtraJson(
      Object.keys(extra).length ? JSON.stringify(extra, null, 2) : "",
    );
    setJsonError("");
  }, [open, record, schema]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (extraJson && extraJson.trim()) {
      try {
        JSON.parse(extraJson);
        setJsonError("");
      } catch (err) {
        setJsonError("JSON не валиден: " + err.message);
        return;
      }
    }
    onSave(form, extraJson);
  };

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-testid="admin-edit-dialog"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {record?.id ? "Редактировать запись" : "Новая запись"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
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
                  value={form[f.key] ?? 0}
                  onChange={(e) => update(f.key, Number(e.target.value))}
                  className="mt-1"
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

          <details className="rounded-lg border border-neutral-200 p-3">
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
          </details>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="rounded-full bg-[#C2410C] hover:bg-[#9A3412]"
            >
              Сохранить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
