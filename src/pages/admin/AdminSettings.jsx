import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { mediaUrl } from "@/lib/media";

const STATIC_SEO_PAGES = [
  { key: "home", path: "/", label: "Главная" },
  { key: "tours", path: "/tours", label: "Каталог туров" },
  { key: "about", path: "/about", label: "О компании" },
  { key: "contacts", path: "/contacts", label: "Контакты" },
  { key: "faq", path: "/faq", label: "FAQ" },
  { key: "promotions", path: "/promotions", label: "Акции" },
  { key: "reviews", path: "/reviews", label: "Отзывы" },
  { key: "blog", path: "/blog", label: "Блог" },
  { key: "agencies", path: "/agencies", label: "Агентствам" },
  { key: "payment", path: "/payment", label: "Оплата" },
  { key: "legal", path: "/legal", label: "Юридическая информация" },
];

const BENEFIT_ICON_OPTIONS = [
  { value: "badge", label: "Знак качества" },
  { value: "bus", label: "Автобус" },
  { value: "plane", label: "Самолёт" },
  { value: "users", label: "Люди" },
  { value: "map", label: "Карта" },
  { value: "shield", label: "Щит" },
  { value: "wallet", label: "Кошелёк" },
  { value: "seat", label: "Комфортное место" },
];

const DEFAULT_HOME_BENEFITS = {
  overline: "Почему едут именно с нами",
  title: "Заботимся о каждой детали поездки",
  items: [
    {
      icon: "badge",
      title: "Сами туроператоры",
      desc: "Не посредник: формируем туры под себя и отвечаем за качество.",
    },
    {
      icon: "bus",
      title: "Удобное отправление",
      desc: "Подбираем комфортный вариант дороги автобусом или самолётом.",
    },
    {
      icon: "users",
      title: "Поддержка менеджера",
      desc: "С момента заявки и до возвращения — всегда на связи.",
    },
    {
      icon: "map",
      title: "Понятные программы",
      desc: "Без скрытых трансферов и сюрпризов: всё показано в маршруте.",
    },
    {
      icon: "shield",
      title: "Проверенные маршруты",
      desc: "Каждый тур мы прошли сами, прежде чем пустить группу.",
    },
    {
      icon: "wallet",
      title: "Оплата через ЕРИП",
      desc: "Удобно и безопасно: оплата после общения с менеджером.",
    },
    {
      icon: "seat",
      title: "Комфорт в дороге",
      desc: "Менеджер заранее расскажет о транспорте и доступных местах.",
    },
  ],
};

const FIXED_FOOTER_SOCIAL_LINKS = [
  {
    type: "telegram",
    label: "Telegram",
    short: "TG",
    defaultUrl: "https://t.me/travelspaceby",
  },
  {
    type: "viber",
    label: "Viber",
    short: "VB",
    defaultUrl: "viber://chat?number=%2B375636999111",
  },
  {
    type: "whatsapp",
    label: "WhatsApp",
    short: "WA",
    defaultUrl: "https://wa.me/375636999111",
  },
  {
    type: "instagram",
    label: "Instagram",
    short: "IG",
    defaultUrl: "https://www.instagram.com/travelspace.by",
  },
  {
    type: "vk",
    label: "VK",
    short: "VK",
    defaultUrl: "https://vk.com/travelspace_by",
  },
  {
    type: "pinterest",
    label: "Pinterest",
    short: "P",
    defaultUrl: "https://www.pinterest.com/Travel_Space/",
  },
  {
    type: "youtube",
    label: "YouTube",
    short: "YT",
    defaultUrl: "https://www.youtube.com/@TravelSpace_Minsk",
  },
  {
    type: "tiktok",
    label: "TikTok",
    short: "TT",
    defaultUrl: "https://www.tiktok.com/@travelspace.by",
  },
];

export default function AdminSettings() {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/settings").then((r) => setData(r.data));
  }, []);

  if (!data) return <p>Загрузка…</p>;

  const update = (k, v) => setData((p) => ({ ...p, [k]: v }));
  const updateNested = (parent, k, v) =>
    setData((p) => ({ ...p, [parent]: { ...(p[parent] || {}), [k]: v } }));
  const updateSeoPage = (pageKey, patch) =>
    setData((p) => ({
      ...p,
      seo_pages: {
        ...(p.seo_pages || {}),
        [pageKey]: {
          ...(p.seo_pages?.[pageKey] || {}),
          ...patch,
        },
      },
    }));
  const updateHomeBenefits = (patch) =>
    setData((p) => ({
      ...p,
      home_benefits: {
        ...DEFAULT_HOME_BENEFITS,
        ...(p.home_benefits || {}),
        ...patch,
      },
    }));

  const save = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      await api.put("/admin/settings", data);
      toast.success("Настройки сохранены");
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.detail ||
          error?.message ||
          "Ошибка сохранения настроек",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="admin-settings">
      <h1 className="font-heading text-3xl">Настройки сайта</h1>
      <p className="text-sm text-neutral-500 mt-1">
        Контактные данные, реквизиты, мессенджеры.
      </p>

      <form
        id="admin-settings-form"
        onSubmit={save}
        className="mt-8 rounded-2xl bg-white border border-neutral-200 p-6 pb-28 sm:p-8 sm:pb-28 max-w-6xl space-y-5"
      >
        <Group title="Основное">
          <Field
            label="Название компании"
            value={data.company_name}
            onChange={(v) => update("company_name", v)}
          />
          <Field
            label="Короткое имя"
            value={data.company_short}
            onChange={(v) => update("company_short", v)}
          />
          <Field
            label="Юридическое название"
            value={data.legal_name}
            onChange={(v) => update("legal_name", v)}
          />
          <Field
            label="УНП"
            value={data.unp}
            onChange={(v) => update("unp", v)}
          />
        </Group>

        <Group title="Блок на главной “Почему едут именно с нами”">
          <div className="sm:col-span-2">
            <HomeBenefitsField
              value={data.home_benefits || DEFAULT_HOME_BENEFITS}
              onChange={updateHomeBenefits}
            />
          </div>
        </Group>

        <Group title="Контакты">
          <Field
            label="Телефон (формат)"
            value={data.phone}
            onChange={(v) => update("phone", v)}
          />
          <Field
            label="Телефон (для tel:)"
            value={data.phone_link}
            onChange={(v) => update("phone_link", v)}
          />
          <Field
            label="Email"
            value={data.email}
            onChange={(v) => update("email", v)}
          />
          <Field
            label="Email для заявок"
            value={data.lead_email}
            onChange={(v) => update("lead_email", v)}
          />
          <Field
            label="Адрес"
            value={data.address}
            onChange={(v) => update("address", v)}
          />
          <Field
            label="Ссылка на карту / точку"
            value={data.map_url || ""}
            onChange={(v) => update("map_url", v)}
            placeholder="https://yandex.ru/maps/..."
          />
          <Field
            label="Ссылка для iframe карты"
            value={data.map_embed_url || ""}
            onChange={(v) => update("map_embed_url", v)}
            placeholder="Можно оставить пустым — карта построится по адресу"
          />
          <Field
            label="Ссылка построить маршрут"
            value={data.map_route_url || ""}
            onChange={(v) => update("map_route_url", v)}
            placeholder="Можно оставить пустым"
          />
          <Field
            label="Часы работы"
            value={data.work_hours}
            onChange={(v) => update("work_hours", v)}
          />
        </Group>

        <Group title="Телефоны в шапке и футере">
          <div className="sm:col-span-2 space-y-3">
            <HeaderPhonesField
              value={data.header_phones || []}
              onChange={(v) => update("header_phones", v)}
            />
          </div>
        </Group>

        <Group title="Мессенджеры в шапке">
          <div className="sm:col-span-2 rounded-xl border border-orange-100 bg-orange-50/60 p-3 text-xs text-neutral-600">
            В шапке всегда отображаются только Viber, Telegram и WhatsApp. Здесь
            редактируются только номера/ссылки для этих трёх мессенджеров.
          </div>
          <Field
            label="Viber: номер или ссылка"
            value={data.messengers?.viber}
            onChange={(v) => updateNested("messengers", "viber", v)}
            placeholder="+375296369911 или viber://chat?..."
          />
          <Field
            label="Telegram: username или ссылка"
            value={data.messengers?.telegram}
            onChange={(v) => updateNested("messengers", "telegram", v)}
            placeholder="travelspaceby или https://t.me/travelspaceby"
          />
          <Field
            label="WhatsApp: номер или ссылка"
            value={data.messengers?.whatsapp}
            onChange={(v) => updateNested("messengers", "whatsapp", v)}
            placeholder="+375296369911 или https://wa.me/..."
          />
        </Group>

        <Group title="Соцсети в футере">
          <div className="sm:col-span-2">
            <FixedFooterSocialLinksField
              value={data.social_buttons || []}
              onChange={(v) => update("social_buttons", v)}
            />
          </div>
        </Group>

        <Group title="SEO и превью ссылок">
          <div className="sm:col-span-2 space-y-6">
            <p className="text-xs text-neutral-500">
              Здесь задаются title, description и картинка, которая будет
              отображаться при отправке ссылки в Telegram, Viber, WhatsApp,
              соцсетях и поисковой выдаче. Для отдельных туров и статей эти поля
              редактируются в их карточке.
            </p>

            <ImageUploadField
              label="Картинка по умолчанию для всех страниц"
              value={data.seo_default_image || ""}
              onChange={(v) => update("seo_default_image", v)}
            />

            <SeoPagesField
              value={data.seo_pages || {}}
              onChange={updateSeoPage}
            />
          </div>
        </Group>
        <Group title="Аналитика и рекламные пиксели">
          <Field
            label="Google Tag Manager ID"
            value={data.gtm_id || ""}
            onChange={(v) => update("gtm_id", v)}
            placeholder="GTM-XXXXXXX"
          />
          <Field
            label="Google Analytics 4 ID"
            value={data.google_analytics_id || ""}
            onChange={(v) => update("google_analytics_id", v)}
            placeholder="G-XXXXXXXXXX"
          />
          <Field
            label="Яндекс.Метрика ID"
            value={data.yandex_metrika_id || ""}
            onChange={(v) => update("yandex_metrika_id", v)}
            placeholder="12345678"
          />
          <Field
            label="Meta / Facebook Pixel ID"
            value={data.facebook_pixel_id || ""}
            onChange={(v) => update("facebook_pixel_id", v)}
            placeholder="1234567890"
          />
          <Field
            label="TikTok Pixel ID"
            value={data.tiktok_pixel_id || ""}
            onChange={(v) => update("tiktok_pixel_id", v)}
            placeholder="CXXXXXXXXXXXX"
          />
          {/* <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            Токены server-side conversions сюда не добавляй: META_ACCESS_TOKEN и
            TIKTOK_ACCESS_TOKEN должны лежать только в backend/.env.
          </div> */}
        </Group>
      </form>
      <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-50 flex justify-end md:left-[280px]">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
          <span className="hidden text-sm text-neutral-500 sm:inline">
            Не забудьте сохранить изменения
          </span>

          <Button
            type="submit"
            form="admin-settings-form"
            disabled={saving}
            className="rounded-full bg-[#C2410C] px-6 hover:bg-[#9A3412]"
            data-testid="admin-settings-save"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Сохраняем...
              </>
            ) : (
              "Сохранить"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function adminImagePreviewUrl(value = "") {
  if (!value) return "";
  if (value.startsWith("/uploads")) return mediaUrl(value);
  return value;
}

function Group({ title, children }) {
  return (
    <div>
      <p className="overline text-neutral-500 mb-3">{title}</p>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function HomeBenefitsField({ value = DEFAULT_HOME_BENEFITS, onChange }) {
  const section = { ...DEFAULT_HOME_BENEFITS, ...(value || {}) };
  const items = Array.isArray(section.items) ? section.items : [];

  const updateItem = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange({ items: next });
  };

  const addItem = () =>
    onChange({
      items: [...items, { icon: "badge", title: "", desc: "" }],
    });

  const removeItem = (index) =>
    onChange({
      items: items.filter((_, itemIndex) => itemIndex !== index),
    });

  const resetDefaults = () => onChange(DEFAULT_HOME_BENEFITS);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Маленький заголовок"
          value={section.overline}
          onChange={(v) => onChange({ overline: v })}
        />
        <Field
          label="Большой заголовок"
          value={section.title}
          onChange={(v) => onChange({ title: v })}
        />
      </div>

      <div className="space-y-3">
        <div>
          <Label>Карточки преимуществ</Label>
          <p className="mt-1 text-xs text-neutral-500">
            Эти карточки отображаются на главной странице в блоке “Заботимся о
            каждой детали поездки”.
          </p>
        </div>

        {items.map((item, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-xl border border-neutral-200 p-3 lg:grid-cols-[180px_1fr_1.5fr_auto]"
          >
            <div>
              <Label className="text-xs">Иконка</Label>
              <select
                value={item.icon || "badge"}
                onChange={(e) => updateItem(index, { icon: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {BENEFIT_ICON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Field
              label="Заголовок карточки"
              value={item.title}
              onChange={(v) => updateItem(index, { title: v })}
            />

            <TextareaField
              label="Описание карточки"
              value={item.desc}
              onChange={(v) => updateItem(index, { desc: v })}
              rows={2}
            />

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => removeItem(index)}
                className="w-full"
              >
                Удалить
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={addItem}>
          Добавить карточку
        </Button>
        <Button type="button" variant="outline" onClick={resetDefaults}>
          Вернуть стандартный блок
        </Button>
      </div>
    </div>
  );
}

function HeaderPhonesField({ value = [], onChange }) {
  const items = value.length
      ? value
      : [
        {
          label: "Автобусные туры",
          phone: "636-99-11",
          link: "+375296369911",
        },
        { label: "Авиа туры", phone: "636-22-99", link: "+375296362299" },
      ];

  const updateItem = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const addItem = () =>
    onChange([...items, { label: "", phone: "", link: "" }]);

  const removeItem = (index) =>
    onChange(items.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="grid gap-2 rounded-xl border border-neutral-200 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <Field
            label="Подпись"
            value={item.label}
            onChange={(v) => updateItem(index, { label: v })}
          />
          <Field
            label="Номер на сайте"
            value={item.phone}
            onChange={(v) => updateItem(index, { phone: v })}
          />
          <Field
            label="Номер для tel:"
            value={item.link}
            onChange={(v) => updateItem(index, { link: v })}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => removeItem(index)}
              className="w-full"
            >
              Удалить
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addItem}>
        Добавить телефон
      </Button>
    </div>
  );
}

function normalizeSocialKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function getFixedSocialUrl(value = [], fixedItem) {
  if (!Array.isArray(value)) return fixedItem.defaultUrl;

  const fixedKeys = [fixedItem.type, fixedItem.label, fixedItem.short]
    .map(normalizeSocialKey)
    .filter(Boolean);

  const configured = value.find((item) => {
    if (!item) return false;

    const itemKeys = [item.type, item.label, item.short]
      .map(normalizeSocialKey)
      .filter(Boolean);

    return itemKeys.some((key) => fixedKeys.includes(key));
  });

  return configured?.href || configured?.url || configured?.link || fixedItem.defaultUrl;
}

function buildFixedFooterSocialLinks(value = [], changedType, changedUrl) {
  return FIXED_FOOTER_SOCIAL_LINKS.map((item) => ({
    type: item.type,
    label: item.label,
    short: item.short,
    url: item.type === changedType ? changedUrl : getFixedSocialUrl(value, item),
    active: true,
  }));
}

function FixedFooterSocialLinksField({ value = [], onChange }) {
  const updateLink = (type, url) => {
    onChange(buildFixedFooterSocialLinks(value, type, url));
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Ссылки соцсетей в футере</Label>
        <p className="mt-1 text-xs text-neutral-500">
          Набор иконок зашит в коде: Telegram, Viber, WhatsApp, Instagram, VK,
          Pinterest, YouTube и TikTok. Добавлять/удалять соцсети, менять иконки
          и цвета больше не нужно — здесь редактируются только ссылки.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {FIXED_FOOTER_SOCIAL_LINKS.map((item) => (
          <Field
            key={item.type}
            label={`${item.label}: ссылка`}
            value={getFixedSocialUrl(value, item)}
            onChange={(url) => updateLink(item.type, url)}
            placeholder={item.defaultUrl}
          />
        ))}
      </div>
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 3, placeholder }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="mt-1"
      />
    </div>
  );
}

function SeoPagesField({ value = {}, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>SEO для статичных страниц</Label>
        <p className="mt-1 text-xs text-neutral-500">
          Если поле оставить пустым, страница использует стандартный текст из
          кода и картинку по умолчанию.
        </p>
      </div>

      {STATIC_SEO_PAGES.map((page) => {
        const item = value[page.key] || {};

        return (
          <div
            key={page.key}
            className="rounded-xl border border-neutral-200 p-4"
          >
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-sm">{page.label}</p>
                <p className="text-xs text-neutral-500">{page.path}</p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <Field
                label="SEO Title"
                value={item.title}
                onChange={(v) =>
                  onChange(page.key, { title: v, path: page.path })
                }
              />
              <TextareaField
                label="SEO Description"
                value={item.description}
                onChange={(v) =>
                  onChange(page.key, { description: v, path: page.path })
                }
              />
              <div className="lg:col-span-2">
                <ImageUploadField
                  label="Фото для превью ссылки"
                  value={item.image || ""}
                  onChange={(v) =>
                    onChange(page.key, { image: v, path: page.path })
                  }
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ImageUploadField({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file) => {
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/admin/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(response.data.url);
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
    <div>
      <Label className="text-xs">{label}</Label>
      <div
        className="mt-1 rounded-xl border border-dashed border-neutral-300 p-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          uploadImage(e.dataTransfer.files?.[0]);
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {value ? (
            <img
              src={adminImagePreviewUrl(value)}
              alt=""
              className="h-24 w-36 rounded-lg object-cover bg-neutral-100"
            />
          ) : (
            <div className="h-24 w-36 rounded-lg bg-neutral-100 flex items-center justify-center">
              {uploading ? (
                <Loader2 className="size-5 animate-spin text-neutral-400" />
              ) : (
                <Upload className="size-5 text-neutral-400" />
              )}
            </div>
          )}

          <div className="flex-1 space-y-2">
            <Input
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder="URL картинки"
            />

            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50">
                {uploading ? "Загрузка..." : "Выбрать изображение"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    uploadImage(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>

              {value && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onChange("")}
                  className="gap-1"
                >
                  <X className="size-4" /> Очистить
                </Button>
              )}
            </div>

            <p className="text-xs text-neutral-500">
              Рекомендуемый размер для превью ссылки: 1200×630 px.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1"
      />
    </div>
  );
}
