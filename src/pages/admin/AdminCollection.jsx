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
import { Plus, Edit, Trash2, Upload, X } from "lucide-react";
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
      // { key: "slug", label: "URL (slug)", type: "text" },
      { key: "tagline", label: "Подзаголовок", type: "text" },
      // {
      //   key: "region_slug",
      //   label: "Регион (slug)",
      //   type: "text",
      //   placeholder: "dagestan, georgia-kobuleti …",
      // },
      { key: "region_name", label: "Регион (название)", type: "text" },
      { key: "duration", label: "Длительность", type: "text" },
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
      // { key: "slug", label: "URL (slug)", type: "text" },
      { key: "cover", label: "URL обложки", type: "text" },
      { key: "excerpt", label: "Краткое описание", type: "textarea" },
      { key: "content", label: "Содержание", type: "textarea", rows: 10 },
      { key: "seo_title", label: "SEO Title", type: "text" },
      { key: "seo_description", label: "SEO Description", type: "textarea" },
      {
        key: "published_at",
        label: "Дата публикации",
        type: "text",
        placeholder: "2025-09-01",
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
      { key: "image", label: "URL изображения", type: "text" },
      { key: "description", label: "Описание", type: "textarea" },
      {
        key: "valid_until",
        label: "Действует до",
        type: "text",
        placeholder: "2026-03-01",
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

export default function AdminCollection({ name }) {
  const schema = SCHEMAS[name];
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () => api.get(`/admin/${name}`).then((r) => setItems(r.data));
  useEffect(() => {
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
    try {
      const payload = { ...record };

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
              <div className="h-[220px] shrink-0 bg-neutral-100">
                <img
                  src={schema.image(it)}
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
  const submit = (e) => {
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

    onSave(payload);
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
                    {f.options.map((option) => (
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

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());

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

      <DatesField
        value={form.dates || []}
        onChange={(v) => update("dates", v)}
      />

      <HotelsField
        value={form.hotels || []}
        onChange={(v) => update("hotels", v)}
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

function ImageListField({ label, value, onChange }) {
  const items = value.length ? value : [""];

  const updateItem = (index, text) => {
    const next = [...items];
    next[index] = text;
    onChange(next.filter(Boolean));
  };

  const addItem = () => onChange([...items.filter(Boolean), ""]);
  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div>
      <Label>{label}</Label>

      <div className="mt-2 space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 items-start">
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
function ImageInput({ value, onChange }) {
  const readFile = (file) => {
    if (!file?.type?.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="flex-1 rounded-xl border border-dashed border-neutral-300 p-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        readFile(e.dataTransfer.files?.[0]);
      }}
    >
      <div className="flex gap-3 items-start">
        {value ? (
          <img
            src={value}
            alt=""
            className="size-20 rounded-lg object-cover bg-neutral-100"
          />
        ) : (
          <div className="size-20 rounded-lg bg-neutral-100 flex items-center justify-center">
            <Upload className="size-5 text-neutral-400" />
          </div>
        )}

        <div className="flex-1">
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL картинки или перетащите файл сюда"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Можно вставить URL или перетащить изображение.
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
                value={item.day || index + 1}
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

function DatesField({ value, onChange }) {
  const items = value.length
    ? value
    : [
        {
          id: uid(),
          start: "",
          end: "",
          price: 0,
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
        price: 0,
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
                  value={item.price || 0}
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

function HotelsField({ value, onChange }) {
  const items = value.length
    ? value
    : [
        {
          id: uid(),
          name: "",
          description: "",
          image: "",
          meal: "",
          location: "",
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
      },
    ]);

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div>
      <Label>Отели</Label>

      <div className="mt-2 space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id || index}
            className="rounded-xl border p-3 space-y-2"
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
              placeholder="Описание"
            />

            <ImageInput
              value={item.image || ""}
              onChange={(v) => updateItem(index, { image: v })}
            />

            <div className="grid grid-cols-2 gap-2">
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
