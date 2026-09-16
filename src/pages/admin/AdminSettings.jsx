import HomeFaqEditor from "@/components/admin/HomeFaqEditor";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Italic,
  Loader2,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { uploadImage as uploadPreparedImage, usePendingUploads, hasPendingUploads } from "@/lib/imageUpload";
import { invalidateSiteData } from "@/lib/useSiteData";
import { mediaUrl } from "@/lib/media";
import { formatMinskDateTime } from "@/lib/formatDate";
import { getYoutubeVideoId } from "@/lib/youtube";
import { DEFAULT_HOME_PAGE } from "@/lib/homeContent";
import LazyYoutubeEmbed from "@/components/LazyYoutubeEmbed";
import MarkdownLinkButton from "@/components/admin/MarkdownLinkButton";
import MarkdownBoldButton, { useMarkdownBold } from "@/components/admin/MarkdownBoldButton";
import {
  filterToursForLanding,
  getTourLandingDefaults,
  TOUR_LANDING_LINKS,
} from "@/lib/seoLandings";

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

const SEO_HUBS = TOUR_LANDING_LINKS.map(({ slug, label, path }) => ({
  slug,
  label,
  path,
  defaults: getTourLandingDefaults(slug),
}));

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

function getEditableHomePageContent(settings) {
  const configured = settings?.home_page || {};
  return {
    ...DEFAULT_HOME_PAGE,
    ...configured,
    directions_sections: Array.isArray(configured.directions_sections)
      ? configured.directions_sections
      : DEFAULT_HOME_PAGE.directions_sections,
  };
}

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
  const [tours, setTours] = useState([]);
  const [saving, setSaving] = useState(false);
  const uploading = usePendingUploads();

  useEffect(() => {
    Promise.all([
      api.get("/admin/settings"),
      api.get("/admin/tours").catch(() => ({ data: [] })),
    ]).then(([settingsResponse, toursResponse]) => {
      setData(settingsResponse.data);
      setTours(Array.isArray(toursResponse.data) ? toursResponse.data : []);
    });
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
  const updateHomePage = (patch) =>
    setData((p) => ({
      ...p,
      home_page: {
        ...getEditableHomePageContent(p),
        ...patch,
      },
    }));
  const updateSeoHub = (slug, patch) =>
    setData((p) => ({
      ...p,
      seo_hubs: {
        ...(p.seo_hubs || {}),
        [slug]: {
          ...(p.seo_hubs?.[slug] || {}),
          ...patch,
        },
      },
    }));
  const deleteSeoHub = (slug) =>
    setData((previous) => {
      const seoHubs = { ...(previous.seo_hubs || {}) };
      delete seoHubs[slug];
      return { ...previous, seo_hubs: seoHubs };
    });

  const save = async (e) => {
    e.preventDefault();
    if (hasPendingUploads()) { toast.error("Дождитесь загрузки фото"); return; }
    if (e.target !== e.currentTarget) return;

    try {
      setSaving(true);
      await api.put("/admin/settings", data);
      invalidateSiteData();
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
        <fieldset disabled={uploading} className="min-w-0">
        {uploading && <p role="status" className="mb-3 text-sm">Загружаем фото…</p>}
        <Tabs defaultValue="home" className="w-full">
          <div className="min-w-0 border-b border-neutral-200 pb-2">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 gap-1 rounded-none bg-transparent p-0">
              {[
                ["home", "Главная"],
                ["pages", "Статичные страницы"],
                ["hubs", "SEO-хабы"],
                ["links", "Туры для соцсетей"],
                ["company", "Компания и контакты"],
                ["social", "Связь и соцсети"],
                ["analytics", "Аналитика"],
              ].map(([value, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-b-none border border-transparent border-b-0 px-4 py-3 data-[state=active]:border-neutral-200 data-[state=active]:bg-white data-[state=active]:shadow-none"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="home" className="mt-7 space-y-8">
            <Group title="Заголовки и SEO-тексты главной">
              <div className="sm:col-span-2">
                <HomePageContentField
                  value={getEditableHomePageContent(data)}
                  onChange={updateHomePage}
                />
              </div>
            </Group>
            <Group title="Блок “Почему едут именно с нами”">
              <div className="sm:col-span-2">
                <HomeBenefitsField
                  value={data.home_benefits || DEFAULT_HOME_BENEFITS}
                  onChange={updateHomeBenefits}
                />
              </div>
            </Group>
          </TabsContent>

          <TabsContent value="pages" className="mt-7 space-y-7">
            <p className="text-sm text-neutral-600">
              Выберите страницу во вкладках ниже. Здесь редактируются данные
              для поисковой выдачи и превью ссылок.
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
          </TabsContent>

          <TabsContent value="hubs" className="mt-7">
            <SeoHubsField
              value={data.seo_hubs || {}}
              onChange={updateSeoHub}
              onDelete={deleteSeoHub}
              tours={tours}
            />
          </TabsContent>

          <TabsContent value="links" className="mt-7">
            <TravelLinksSettings value={data.links_page || {}} tours={tours} onChange={(patch) => setData((previous) => ({ ...previous, links_page: { ...previous.links_page, ...patch } }))} />
          </TabsContent>
          <TabsContent value="company" className="mt-7 space-y-8">
            <Group title="Основное">
              <Field label="Название компании" value={data.company_name} onChange={(v) => update("company_name", v)} />
              <Field label="Короткое имя" value={data.company_short} onChange={(v) => update("company_short", v)} />
              <Field label="Юридическое название" value={data.legal_name} onChange={(v) => update("legal_name", v)} />
              <Field label="УНП" value={data.unp} onChange={(v) => update("unp", v)} />
            </Group>
            <Group title="Контакты">
              <Field label="Телефон (формат)" value={data.phone} onChange={(v) => update("phone", v)} />
              <Field label="Телефон (для tel:)" value={data.phone_link} onChange={(v) => update("phone_link", v)} />
              <Field label="Email" value={data.email} onChange={(v) => update("email", v)} />
              <Field label="Email для заявок" value={data.lead_email} onChange={(v) => update("lead_email", v)} />
              <Field label="Адрес" value={data.address} onChange={(v) => update("address", v)} />
              <Field label="Ссылка на карту / точку" value={data.map_url || ""} onChange={(v) => update("map_url", v)} placeholder="https://yandex.ru/maps/..." />
              <Field label="Ссылка для iframe карты" value={data.map_embed_url || ""} onChange={(v) => update("map_embed_url", v)} placeholder="Можно оставить пустым — карта построится по адресу" />
              <Field label="Ссылка построить маршрут" value={data.map_route_url || ""} onChange={(v) => update("map_route_url", v)} placeholder="Можно оставить пустым" />
              <Field label="Часы работы" value={data.work_hours} onChange={(v) => update("work_hours", v)} />
            </Group>
            <Group title="Телефоны в шапке и футере">
              <div className="sm:col-span-2 space-y-3">
                <HeaderPhonesField value={data.header_phones || []} onChange={(v) => update("header_phones", v)} />
              </div>
            </Group>
          </TabsContent>

          <TabsContent value="social" className="mt-7 space-y-8">
            <Group title="Мессенджеры в шапке">
              <div className="sm:col-span-2 rounded-xl border border-orange-100 bg-orange-50/60 p-3 text-xs text-neutral-600">
                В шапке отображаются Viber, Telegram и WhatsApp. Здесь
                редактируются номера и ссылки.
              </div>
              <Field label="Viber: номер или ссылка" value={data.messengers?.viber} onChange={(v) => updateNested("messengers", "viber", v)} />
              <Field label="Telegram: username или ссылка" value={data.messengers?.telegram} onChange={(v) => updateNested("messengers", "telegram", v)} />
              <Field label="WhatsApp: номер или ссылка" value={data.messengers?.whatsapp} onChange={(v) => updateNested("messengers", "whatsapp", v)} />
            </Group>
            <Group title="Соцсети в футере">
              <div className="sm:col-span-2">
                <FixedFooterSocialLinksField value={data.social_buttons || []} onChange={(v) => update("social_buttons", v)} />
              </div>
            </Group>
          </TabsContent>

          <TabsContent value="analytics" className="mt-7">
            <Group title="Аналитика и рекламные пиксели">
              <Field label="Google Tag Manager ID" value={data.gtm_id || ""} onChange={(v) => update("gtm_id", v)} placeholder="GTM-XXXXXXX" />
              <Field label="Google Analytics 4 ID" value={data.google_analytics_id || ""} onChange={(v) => update("google_analytics_id", v)} placeholder="G-XXXXXXXXXX" />
              <Field label="Яндекс.Метрика ID" value={data.yandex_metrika_id || ""} onChange={(v) => update("yandex_metrika_id", v)} placeholder="12345678" />
              <Field label="Meta / Facebook Pixel ID" value={data.facebook_pixel_id || ""} onChange={(v) => update("facebook_pixel_id", v)} placeholder="1234567890" />
              <Field label="TikTok Pixel ID" value={data.tiktok_pixel_id || ""} onChange={(v) => update("tiktok_pixel_id", v)} placeholder="CXXXXXXXXXXXX" />
            </Group>
          </TabsContent>
        </Tabs>
        </fieldset>
      </form>
      <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-50 flex justify-end md:left-[280px]">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
          <span className="hidden text-sm text-neutral-500 sm:inline">
            Не забудьте сохранить изменения
          </span>

          <Button
            type="submit"
            form="admin-settings-form"
            disabled={saving || uploading}
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

function HomePageContentField({ value = DEFAULT_HOME_PAGE, onChange }) {
  const content = { ...DEFAULT_HOME_PAGE, ...(value || {}) };
  const sections = Array.isArray(content.directions_sections)
    ? content.directions_sections
    : [];

  const updateSection = (index, patch) => {
    const next = [...sections];
    next[index] = { ...next[index], ...patch };
    onChange({ directions_sections: next });
  };

  const addSection = () =>
    onChange({
      directions_sections: [
        ...sections,
        {
          title: "Новый подраздел",
          text: "",
          link_label: "",
          link_url: "",
        },
      ],
    });

  const removeSection = (index) =>
    onChange({
      directions_sections: sections.filter(
        (_, sectionIndex) => sectionIndex !== index,
      ),
    });

  return (
    <div className="space-y-7">
      <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 text-sm text-neutral-700">
        На главной будет только один H1. Маркетинговая фраза в интро останется
        обычным текстом. Изменения этих полей автоматически обновят дату
        главной в sitemap.
      </div>

      <Field
        label="H1 главной страницы"
        value={content.h1}
        onChange={(h1) => onChange({ h1 })}
        placeholder="Автобусные туры из Минска"
      />

      <div className="space-y-3 rounded-xl border border-neutral-200 p-4">
        <p className="font-medium">Первый экран — текст поверх видео</p>
        <RichTextareaField
          label="Подзаголовок под главным заголовком"
          value={content.hero_tagline}
          onChange={(hero_tagline) => onChange({ hero_tagline })}
          rows={2}
          hint="Фраза под H1. Оставьте пустым, чтобы скрыть."
        />
        <RichTextareaField
          label="Описание под подзаголовком"
          value={content.hero_description}
          onChange={(hero_description) => onChange({ hero_description })}
          rows={3}
          hint="Короткий текст над кнопками «Выбрать тур» и «Получить консультацию». Оставьте пустым, чтобы скрыть."
        />
      </div>

      <div className="space-y-3 rounded-xl border border-neutral-200 p-4">
        <Field
          label="H2 первого SEO-блока"
          value={content.intro_title}
          onChange={(intro_title) => onChange({ intro_title })}
        />
        <RichTextareaField
          label="Текст первого SEO-блока"
          value={content.intro_text}
          onChange={(intro_text) => onChange({ intro_text })}
          rows={7}
          hint="Рекомендуется 2–4 абзаца. Выделите понятный анкор и добавьте внутреннюю ссылку на тур или направление."
        />
      </div>

      <Field
        label="H2 над карточками автобусных туров"
        value={content.tours_title}
        onChange={(tours_title) => onChange({ tours_title })}
      />

      <div className="grid gap-3 rounded-xl border border-neutral-200 p-4 sm:grid-cols-2">
        <Field
          label="H2 блока отзывов"
          value={content.reviews_title}
          onChange={(reviews_title) => onChange({ reviews_title })}
        />
        <Field
          label="Подпись блока отзывов"
          value={content.reviews_subtitle}
          onChange={(reviews_subtitle) => onChange({ reviews_subtitle })}
        />
      </div>

      <div className="grid gap-3 rounded-xl border border-neutral-200 p-4 sm:grid-cols-2">
        <Field
          label="Маленький заголовок блока акций"
          value={content.promotions_overline}
          onChange={(promotions_overline) => onChange({ promotions_overline })}
        />
        <Field
          label="H2 блока акций"
          value={content.promotions_title}
          onChange={(promotions_title) => onChange({ promotions_title })}
        />
      </div>

      <div className="space-y-4 rounded-xl border border-neutral-200 p-4">
        <Field
          label="H2 блока направлений"
          value={content.directions_title}
          onChange={(directions_title) => onChange({ directions_title })}
        />

        <div>
          <Label>Подразделы направлений</Label>
          <p className="mt-1 text-xs text-neutral-500">
            Заголовок каждого подраздела выводится как H3. Ссылка под текстом
            необязательна; ссылки также можно добавлять прямо в тексте.
          </p>
        </div>

        {sections.map((section, index) => (
          <div
            key={index}
            className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4"
          >
            <div className="grid gap-3 lg:grid-cols-2">
              <Field
                label="H3 подраздела"
                value={section.title}
                onChange={(title) => updateSection(index, { title })}
              />
              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeSection(index)}
                >
                  Удалить подраздел
                </Button>
              </div>
            </div>
            <RichTextareaField
              label="Текст подраздела"
              value={section.text}
              onChange={(text) => updateSection(index, { text })}
              rows={5}
            />
            <div className="grid gap-3 lg:grid-cols-2">
              <Field
                label="Подпись отдельной ссылки (необязательно)"
                value={section.link_label}
                onChange={(link_label) =>
                  updateSection(index, { link_label })
                }
              />
              <Field
                label="Адрес отдельной ссылки"
                value={section.link_url}
                onChange={(link_url) => updateSection(index, { link_url })}
                placeholder="/tours/sankt-peterburg"
              />
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addSection}>
          Добавить подраздел
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-neutral-200 p-4">
        <Field
          label="H2 блока частых вопросов"
          value={content.faq_title}
          onChange={(faq_title) => onChange({ faq_title })}
        />
        <p className="text-xs text-neutral-500">
          Ниже — текущие вопросы главной страницы.
        </p>
      </div>

      <HomeFaqEditor />

      <Button
        type="button"
        variant="outline"
        onClick={() => onChange(DEFAULT_HOME_PAGE)}
      >
        Вернуть стандартную структуру главной
      </Button>
    </div>
  );
}

function RichTextareaField({
  label,
  value = "",
  onChange,
  rows = 5,
  hint = "",
}) {
  const textareaRef = useRef(null);
  const bold = useMarkdownBold({ textareaRef, value, onChange });

  const wrapSelection = (prefix, suffix, placeholder) => {
    const textarea = textareaRef.current;
    const current = String(value || "");
    const start = textarea?.selectionStart ?? current.length;
    const end = textarea?.selectionEnd ?? current.length;
    const selected = current.slice(start, end) || placeholder;
    const inserted = `${prefix}${selected}${suffix}`;
    onChange(`${current.slice(0, start)}${inserted}${current.slice(end)}`);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  };

  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1 overflow-hidden rounded-md border border-input bg-background">
        <div className="flex flex-wrap gap-1 border-b border-neutral-200 bg-neutral-50 p-1.5">
          <MarkdownBoldButton onClick={bold.toggle} />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 gap-1 px-2"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => wrapSelection("_", "_", "курсив")}
          >
            <Italic className="size-4" /> Курсив
          </Button>
          <MarkdownLinkButton
            textareaRef={textareaRef}
            value={value}
            onChange={onChange}
          />
        </div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={bold.onKeyDown}
          rows={rows}
          className="resize-y rounded-none border-0 leading-6 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Жирный текст: выделите слова и нажмите «Жирный» или Ctrl+B. Повторное нажатие убирает выделение. Пустая строка создаёт новый абзац. {hint}
      </p>
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

            <RichTextareaField
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

      <Tabs defaultValue={STATIC_SEO_PAGES[0].key}>
        <div className="min-w-0 border-b border-neutral-200 pb-2">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-none bg-transparent p-0">
            {STATIC_SEO_PAGES.map((page) => (
              <TabsTrigger
                key={page.key}
                value={page.key}
                className="max-w-full whitespace-normal break-words text-left px-3 py-2.5 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-800"
              >
                {page.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {STATIC_SEO_PAGES.map((page) => {
          const item = value[page.key] || {};
          return (
            <TabsContent key={page.key} value={page.key} className="mt-5">
              <div className="rounded-xl border border-neutral-200 p-4 sm:p-5">
                <div className="mb-4">
                  <p className="font-medium">{page.label}</p>
                  <p className="text-xs text-neutral-500">{page.path}</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Field
                    label="Маленький заголовок на странице"
                    value={item.visible_overline}
                    onChange={(v) =>
                      onChange(page.key, {
                        visible_overline: v,
                        path: page.path,
                      })
                    }
                  />
                  <Field
                    label="Главный заголовок H1 на странице"
                    value={item.visible_heading}
                    onChange={(v) =>
                      onChange(page.key, {
                        visible_heading: v,
                        path: page.path,
                      })
                    }
                  />
                  <div className="lg:col-span-2">
                    <RichTextareaField
                      label="Описание под H1"
                      value={item.visible_description}
                      onChange={(v) =>
                        onChange(page.key, {
                          visible_description: v,
                          path: page.path,
                        })
                      }
                      rows={4}
                      hint="Оставьте пустым, если вводный текст на этой странице не нужен."
                    />
                  </div>
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
                      onChange(page.key, {
                        description: v,
                        path: page.path,
                      })
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
                {page.key === "home" && (
                  <p className="mt-6 border-t pt-4 text-sm text-neutral-600">
                    FAQ главной редактируется во вкладке «Главная». Источник вопросов — общая коллекция FAQ с включённым показом на главной; дополнительный FAQ статической страницы здесь не используется.
                  </p>
                )}
                {page.key !== "home" && <div className="mt-6 space-y-3 border-t pt-4">
                  <p className="text-sm text-neutral-600">Дополнительный блок FAQ этой страницы. Он не изменяет общую коллекцию вопросов.</p>
                  <Field label="Заголовок дополнительного FAQ" value={item.faq_title || ""} placeholder="Частые вопросы" onChange={(faq_title) => onChange(page.key, { faq_title, path: page.path })} />
                  {(item.faq_items || []).map((faq, index) => {
                    const change = (patch) => onChange(page.key, { path: page.path, faq_items: item.faq_items.map((entry, i) => i === index ? { ...entry, ...patch } : entry) });
                    return <div key={index} className="space-y-2 rounded-xl border p-3">
                      <Field label={`Вопрос ${index + 1}`} value={faq.question} onChange={(question) => change({ question })} />
                      <RichTextareaField label="Ответ" value={faq.answer} onChange={(answer) => change({ answer })} rows={3} />
                      <Button type="button" variant="outline" onClick={() => onChange(page.key, { path: page.path, faq_items: item.faq_items.filter((_, i) => i !== index) })}>Удалить вопрос</Button>
                    </div>;
                  })}
                  <Button type="button" variant="outline" onClick={() => onChange(page.key, { path: page.path, faq_items: [...(item.faq_items || []), { question: "", answer: "" }] })}>Добавить вопрос</Button>
                </div>}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function SeoHubsField({ value = {}, onChange, onDelete, tours = [] }) {
  const [activeHub, setActiveHub] = useState(SEO_HUBS[0].slug);
  const [hubSearch, setHubSearch] = useState("");
  const [newHubLabel, setNewHubLabel] = useState("");
  const [newHubSlug, setNewHubSlug] = useState("");
  const fixedSlugs = new Set(SEO_HUBS.map((hub) => hub.slug));
  const customHubs = Object.entries(value)
    .filter(([slug, item]) => !fixedSlugs.has(slug) && item?.custom === true)
    .map(([slug, item]) => ({
      slug,
      label: item.label || item.heading || slug,
      path: `/tours/${slug}`,
      custom: true,
      defaults: {
        title: item.title || `${item.label || item.heading || slug} | TRAVELSPACE`,
        description: item.description || "",
        heading: item.heading || item.label || slug,
        intro: item.intro || "",
        catalog_title: "Выберите подходящий тур",
        content_title: "",
        content_body: "",
        content_sections: [],
        cover_image: "",
        cover_alt: "",
        youtube_title: "",
        youtube_url: "",
        how_to_title: "Как выбрать тур",
        faq_title: "",
        faq_items: [],
      },
    }));
  const hubs = [...SEO_HUBS, ...customHubs];
  const normalizedNewSlug = newHubSlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  const addHub = () => {
    const label = newHubLabel.trim();
    if (!label || !normalizedNewSlug) {
      toast.error("Укажите название и URL нового SEO-хаба латиницей");
      return;
    }
    if (hubs.some((hub) => hub.slug === normalizedNewSlug)) {
      toast.error("SEO-хаб с таким URL уже существует");
      return;
    }
    if (tours.some((tour) => tour?.slug === normalizedNewSlug)) {
      toast.error("Этот URL уже занят отдельной страницей тура");
      return;
    }
    onChange(normalizedNewSlug, {
      custom: true,
      label,
      path: `/tours/${normalizedNewSlug}`,
      title: `${label} | TRAVELSPACE`,
      description: "",
      heading: label,
      intro: "",
      catalog_title: "Выберите подходящий тур",
      content_title: "",
      content_body: "",
      content_sections: [],
      cover_image: "",
      cover_alt: "",
      youtube_title: "",
      youtube_url: "",
      how_to_title: "Как выбрать тур",
      faq_title: "",
      faq_items: [],
      tour_ids: [],
    });
    setActiveHub(normalizedNewSlug);
    setNewHubLabel("");
    setNewHubSlug("");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4">
        <p className="font-medium text-neutral-900">SEO-хабы направлений</p>
        <p className="mt-1 text-sm leading-6 text-neutral-600">
          Это страницы, которые объединяют подходящие туры по направлению.
          Изменения применяются одновременно к видимой странице, поисковым
          метатегам и серверной HTML-версии.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-neutral-200 p-4">
        <div>
          <p className="font-medium">Новый сезонный или тематический хаб</p>
          <p className="mt-1 text-xs text-neutral-500">
            Например: «Рождественские туры» с URL christmas-tours. После
            создания выберите и расставьте туры во вкладке «Туры в хабе».
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Field
            label="Название хаба"
            value={newHubLabel}
            onChange={setNewHubLabel}
            placeholder="Рождественские туры"
          />
          <Field
            label="URL после /tours/"
            value={newHubSlug}
            onChange={setNewHubSlug}
            placeholder="christmas-tours"
          />
          <Button type="button" onClick={addHub}>
            <Plus className="mr-1 size-4" /> Создать хаб
          </Button>
        </div>
      </div>

      <Tabs value={activeHub} onValueChange={setActiveHub} className="min-w-0">
        <Input aria-label="Найти хаб" placeholder="Найти хаб по названию или URL" value={hubSearch} onChange={(event) => setHubSearch(event.target.value)} className="mb-3 max-w-md" />
        <p className="mb-2 text-xs text-neutral-500">Всего хабов: {hubs.length}. Выберите хаб ниже или найдите по названию.</p>
        <div className="max-h-64 overflow-y-auto min-w-0 border-b border-neutral-200 pb-2 pr-1">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-none bg-transparent p-0">
            {hubs.filter((hub) => hub.slug === activeHub || `${hub.label} ${hub.slug}`.toLocaleLowerCase().includes(hubSearch.trim().toLocaleLowerCase())).map((hub) => (
              <TabsTrigger
                key={hub.slug}
                value={hub.slug}
                className="max-w-full whitespace-normal break-words text-left px-3 py-2.5 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-800"
              >
                {hub.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {hubs.map((hub) => {
          const stored = value[hub.slug] || {};
          const item = {
            ...hub.defaults,
            ...stored,
            content_sections: Array.isArray(stored.content_sections)
              ? stored.content_sections
              : hub.defaults.content_sections || [],
            faq_items: Array.isArray(stored.faq_items)
              ? stored.faq_items
              : hub.defaults.faq_items || [],
          };
          const contentLength =
            String(item.content_body || "").length +
            item.content_sections.reduce(
              (total, section) => total + String(section?.text || "").length,
              0,
            );
          const youtubeVideoId = getYoutubeVideoId(item.youtube_url);

          const updateContentSection = (index, patch) => {
            const next = [...item.content_sections];
            next[index] = { ...next[index], ...patch };
            onChange(hub.slug, {
              content_sections: next,
              path: hub.path,
            });
          };

          const updateFaqItem = (index, patch) => {
            const next = [...item.faq_items];
            next[index] = { ...next[index], ...patch };
            onChange(hub.slug, { faq_items: next, path: hub.path });
          };

          return (
            <TabsContent key={hub.slug} value={hub.slug} className="mt-5">
              <div className="space-y-5 rounded-xl border border-neutral-200 p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-heading text-xl">{hub.label}</p>
                    <p className="mt-1 text-sm text-neutral-500">{hub.path}</p>
                  </div>
                  {hub.custom ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (!confirm(`Удалить SEO-хаб «${hub.label}»?`)) return;
                        onDelete(hub.slug);
                        setActiveHub(SEO_HUBS[0].slug);
                      }}
                    >
                      Удалить хаб
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        onChange(hub.slug, {
                          path: hub.path,
                          title: hub.defaults.title,
                          description: hub.defaults.description,
                          heading: hub.defaults.heading,
                          intro: hub.defaults.intro,
                          catalog_title: hub.defaults.catalog_title,
                          content_title: hub.defaults.content_title,
                          content_body: hub.defaults.content_body,
                          content_sections: hub.defaults.content_sections.map(
                            (section) => ({ ...section }),
                          ),
                          how_to_title: hub.defaults.how_to_title,
                          faq_title: hub.defaults.faq_title,
                          faq_items: hub.defaults.faq_items.map((faqItem) => ({
                            ...faqItem,
                          })),
                        })
                      }
                    >
                      Вернуть стандартные тексты
                    </Button>
                  )}
                </div>

                <Tabs defaultValue="main">
                  <div className="min-w-0 border-b border-neutral-200 pb-2">
                    <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-none bg-transparent p-0">
                      <TabsTrigger value="main">Основное</TabsTrigger>
                      <TabsTrigger value="content">
                        Текст после каталога
                      </TabsTrigger>
                      <TabsTrigger value="tours">
                        Туры в хабе
                      </TabsTrigger>
                      <TabsTrigger value="faq">
                        Частые вопросы ({item.faq_items.length})
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="main" className="mt-5">
                    <div className="grid gap-4 lg:grid-cols-2">
                      {hub.custom && (
                        <Field
                          label="Название хаба в списках"
                          value={stored.label || hub.label}
                          onChange={(label) =>
                            onChange(hub.slug, {
                              custom: true,
                              label,
                              path: hub.path,
                            })
                          }
                        />
                      )}
                      <Field
                        label="SEO Title"
                        value={item.title}
                        onChange={(title) =>
                          onChange(hub.slug, { title, path: hub.path })
                        }
                      />
                      <TextareaField
                        label="SEO Description"
                        value={item.description}
                        onChange={(description) =>
                          onChange(hub.slug, { description, path: hub.path })
                        }
                        rows={3}
                      />
                      <div className="lg:col-span-2">
                        <Field
                          label="H1 на странице"
                          value={item.heading}
                          onChange={(heading) =>
                            onChange(hub.slug, { heading, path: hub.path })
                          }
                        />
                      </div>
                      <div className="lg:col-span-2 space-y-3 rounded-xl border border-neutral-200 p-4">
                        <ImageUploadField
                          label="Компактная обложка под H1"
                          value={item.cover_image || ""}
                          onChange={(cover_image) =>
                            onChange(hub.slug, {
                              cover_image,
                              path: hub.path,
                            })
                          }
                          previewAspectRatio="8 / 5"
                          hint="Рекомендуемый размер: 1600×1000 px (соотношение 8:5). На мобильном и компьютере сохраняется одна область кадра; важные детали размещайте ближе к центру."
                        />
                        <Field
                          label="ALT компактной обложки"
                          value={item.cover_alt || ""}
                          onChange={(cover_alt) =>
                            onChange(hub.slug, {
                              cover_alt,
                              path: hub.path,
                            })
                          }
                          placeholder={item.heading}
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <RichTextareaField
                          label="Короткий вводный текст под H1"
                          value={item.intro}
                          onChange={(intro) =>
                            onChange(hub.slug, { intro, path: hub.path })
                          }
                          rows={6}
                          hint="Этот текст находится вверху страницы. Для большого SEO-текста используйте соседнюю вкладку «Текст после каталога»."
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <ImageUploadField
                          label="SEO / Open Graph фото для ссылки"
                          value={item.seo_image || ""}
                          onChange={(seo_image) =>
                            onChange(hub.slug, {
                              seo_image,
                              path: hub.path,
                            })
                          }
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="mt-5 space-y-5">
                    <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 text-sm leading-6 text-neutral-700">
                      Блок появится после карточек туров и перед разделом «Как
                      выбрать тур». Рекомендуемый общий объём — 1500–2500
                      знаков полезного уникального текста. Сейчас: {contentLength}
                      {" "}знаков.
                    </div>

                    <div className="space-y-3 rounded-xl border border-neutral-200 p-4">
                      <Field
                        label="Заголовок блока с YouTube-видео"
                        value={item.youtube_title || ""}
                        onChange={(youtube_title) =>
                          onChange(hub.slug, {
                            youtube_title,
                            path: hub.path,
                          })
                        }
                        placeholder={`Видео: ${item.heading}`}
                      />
                      <TextareaField
                        label="Ссылка или код YouTube-видео"
                        value={item.youtube_url || ""}
                        onChange={(youtube_url) =>
                          onChange(hub.slug, {
                            youtube_url,
                            path: hub.path,
                          })
                        }
                        rows={3}
                        placeholder="Ссылка YouTube, ID видео или стандартный <iframe> код"
                      />
                      <p className="text-xs leading-5 text-neutral-500">
                        Видео загружается только после нажатия посетителя и не
                        блокирует первоначальную загрузку страницы.
                      </p>
                      {item.youtube_url?.trim() && !youtubeVideoId && (
                        <p className="text-sm text-red-600">
                          Не удалось определить YouTube-видео. Проверьте ссылку
                          или embed-код.
                        </p>
                      )}
                      {youtubeVideoId && (
                        <div className="max-w-2xl">
                          <LazyYoutubeEmbed
                            value={youtubeVideoId}
                            title={
                              item.youtube_title?.trim() ||
                              `Видео: ${item.heading}`
                            }
                          />
                        </div>
                      )}
                    </div>

                    <Field
                      label="H2 большого SEO-блока"
                      value={item.content_title}
                      onChange={(content_title) =>
                        onChange(hub.slug, {
                          content_title,
                          path: hub.path,
                        })
                      }
                      placeholder="Автобусные туры из Беларуси: направления, цены и формат поездок"
                    />
                    <RichTextareaField
                      label="Основной текст под H2"
                      value={item.content_body}
                      onChange={(content_body) =>
                        onChange(hub.slug, { content_body, path: hub.path })
                      }
                      rows={10}
                      hint="Можно использовать абзацы, выделения и внутренние ссылки на туры или другие SEO-хабы."
                    />

                    <div>
                      <Label>Подразделы H3</Label>
                      <p className="mt-1 text-xs text-neutral-500">
                        Добавьте от двух до четырёх смысловых подразделов. H3 и
                        текст выводятся как настоящая семантическая разметка.
                      </p>
                    </div>

                    {item.content_sections.map((section, index) => (
                      <div
                        key={index}
                        className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"
                      >
                        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                          <Field
                            label={`H3 подраздела ${index + 1}`}
                            value={section.title}
                            onChange={(title) =>
                              updateContentSection(index, { title })
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              onChange(hub.slug, {
                                content_sections: item.content_sections.filter(
                                  (_, sectionIndex) => sectionIndex !== index,
                                ),
                                path: hub.path,
                              })
                            }
                          >
                            Удалить
                          </Button>
                        </div>
                        <RichTextareaField
                          label="Текст подраздела"
                          value={section.text}
                          onChange={(text) =>
                            updateContentSection(index, { text })
                          }
                          rows={6}
                          hint="Внутренние ссылки можно добавлять прямо в тексте."
                        />
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      disabled={item.content_sections.length >= 4}
                      onClick={() =>
                        onChange(hub.slug, {
                          content_sections: [
                            ...item.content_sections,
                            { title: "", text: "" },
                          ],
                          path: hub.path,
                        })
                      }
                    >
                      Добавить подраздел H3
                    </Button>

                    <Field
                      label="H2 блока «Как выбрать тур»"
                      value={item.how_to_title}
                      onChange={(how_to_title) =>
                        onChange(hub.slug, { how_to_title, path: hub.path })
                      }
                      placeholder="Как выбрать автобусный тур из Минска"
                    />
                  </TabsContent>

                  <TabsContent value="tours" className="mt-5">
                    <SeoHubToursField
                      hub={hub}
                      stored={stored}
                      tours={tours}
                      onChange={onChange}
                    />
                  </TabsContent>

                  <TabsContent value="faq" className="mt-5 space-y-5">
                    <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 text-sm leading-6 text-neutral-700">
                      Вопросы находятся внизу SEO-хаба. Даже закрытые ответы
                      остаются в HTML страницы и доступны поисковым роботам.
                      Рекомендуется добавить 6–8 действительно полезных
                      вопросов.
                    </div>

                    <Field
                      label="H2 блока частых вопросов"
                      value={item.faq_title}
                      onChange={(faq_title) =>
                        onChange(hub.slug, { faq_title, path: hub.path })
                      }
                      placeholder="Частые вопросы о турах"
                    />

                    {item.faq_items.map((faqItem, index) => (
                      <div
                        key={index}
                        className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4"
                      >
                        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                          <Field
                            label={`Вопрос ${index + 1}`}
                            value={faqItem.question}
                            onChange={(question) =>
                              updateFaqItem(index, { question })
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              onChange(hub.slug, {
                                faq_items: item.faq_items.filter(
                                  (_, faqIndex) => faqIndex !== index,
                                ),
                                path: hub.path,
                              })
                            }
                          >
                            Удалить
                          </Button>
                        </div>
                        <RichTextareaField
                          label="Ответ"
                          value={faqItem.answer}
                          onChange={(answer) =>
                            updateFaqItem(index, { answer })
                          }
                          rows={5}
                          hint="Ответ должен быть понятным пользователю и соответствовать реальным условиям тура."
                        />
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      disabled={item.faq_items.length >= 8}
                      onClick={() =>
                        onChange(hub.slug, {
                          faq_items: [
                            ...item.faq_items,
                            { question: "", answer: "" },
                          ],
                          path: hub.path,
                        })
                      }
                    >
                      Добавить вопрос
                    </Button>
                  </TabsContent>
                </Tabs>

                {item.content_updated_at && (
                  <p className="text-xs text-neutral-500">
                    Последнее существенное обновление:{" "}
                    {formatMinskDateTime(item.content_updated_at)} (по Минску)
                  </p>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

const tourReference = (tour) => String(tour?.id || tour?.slug || "");

function SeoHubToursField({ hub, stored = {}, tours = [], onChange }) {
  const [draggedTourId, setDraggedTourId] = useState("");
  const [search, setSearch] = useState("");
  const automaticTourIds = useMemo(
    () =>
      filterToursForLanding(tours, hub.slug)
        .map(tourReference)
        .filter(Boolean),
    [hub.slug, tours],
  );
  const isManual = Array.isArray(stored.tour_ids);
  const requestedIds = isManual ? stored.tour_ids : automaticTourIds;
  const toursByReference = useMemo(() => {
    const result = new Map();
    tours.forEach((tour) => {
      if (tour?.id) result.set(String(tour.id), tour);
      if (tour?.slug) result.set(String(tour.slug), tour);
    });
    return result;
  }, [tours]);
  const selectedIds = [
    ...new Set(
      requestedIds
        .map((id) => toursByReference.get(String(id)))
        .filter(Boolean)
        .map(tourReference),
    ),
  ];
  const selectedSet = new Set(selectedIds);
  const selectedTours = selectedIds.map((id) => toursByReference.get(id));
  const normalizedSearch = search.trim().toLowerCase();
  const availableTours = tours
    .filter((tour) => !selectedSet.has(tourReference(tour)))
    .filter((tour) => {
      if (!normalizedSearch) return true;
      return `${tour?.title || ""} ${tour?.region_name || ""} ${tour?.slug || ""}`
        .toLowerCase()
        .includes(normalizedSearch);
    })
    .sort(
      (left, right) =>
        String(left?.title || "").localeCompare(
          String(right?.title || ""),
          "ru",
        ),
    );

  const saveTourIds = (tourIds) =>
    onChange(hub.slug, {
      tour_ids: [...new Set(tourIds.filter(Boolean))],
      path: hub.path,
    });

  const moveSelected = (tourId, offset) => {
    const currentIndex = selectedIds.indexOf(tourId);
    const nextIndex = currentIndex + offset;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= selectedIds.length) {
      return;
    }
    const next = [...selectedIds];
    [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
    saveTourIds(next);
  };

  const dropIntoSelected = (event, targetIndex = selectedIds.length) => {
    event.preventDefault();
    event.stopPropagation();
    const tourId =
      event.dataTransfer.getData("text/plain") || draggedTourId;
    if (!tourId || !toursByReference.has(tourId)) return;

    const previousIndex = selectedIds.indexOf(tourId);
    const next = selectedIds.filter((id) => id !== tourId);
    let insertIndex = targetIndex;
    if (previousIndex >= 0 && previousIndex < targetIndex) insertIndex -= 1;
    insertIndex = Math.max(0, Math.min(insertIndex, next.length));
    next.splice(insertIndex, 0, tourId);
    saveTourIds(next);
    setDraggedTourId("");
  };

  const dropIntoAvailable = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const tourId =
      event.dataTransfer.getData("text/plain") || draggedTourId;
    if (!tourId) return;
    saveTourIds(selectedIds.filter((id) => id !== tourId));
    setDraggedTourId("");
  };

  const statusForTour = (tour) => {
    if (tour?.active === false) {
      return { label: "выключен", className: "bg-red-100 text-red-700" };
    }
    if (
      tour?.hidden === true ||
      tour?.hide_from_catalog === true ||
      tour?.catalog_hidden === true
    ) {
      return { label: "скрыт", className: "bg-amber-100 text-amber-800" };
    }
    return { label: "виден", className: "bg-emerald-100 text-emerald-700" };
  };

  const TourItem = ({ tour, selected, index }) => {
    const tourId = tourReference(tour);
    const status = statusForTour(tour);
    return (
      <div
        draggable
        onDragStart={(event) => {
          setDraggedTourId(tourId);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", tourId);
        }}
        onDragEnd={() => setDraggedTourId("")}
        onDragOver={selected ? (event) => event.preventDefault() : undefined}
        onDrop={selected ? (event) => dropIntoSelected(event, index) : undefined}
        className={`flex items-center gap-2 rounded-lg border bg-white p-2 shadow-sm transition ${
          draggedTourId === tourId
            ? "border-orange-300 opacity-60"
            : "border-neutral-200"
        }`}
      >
        <GripVertical className="size-4 shrink-0 cursor-grab text-neutral-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-900">
            {tour.title || tour.slug}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[11px] text-neutral-500">
              {tour.region_name || tour.slug}
            </span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${status.className}`}
            >
              {status.label}
            </span>
          </div>
        </div>

        {selected ? (
          <div className="flex shrink-0 items-center">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              disabled={index === 0}
              onClick={() => moveSelected(tourId, -1)}
              aria-label="Поднять тур"
            >
              <ArrowUp className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              disabled={index === selectedIds.length - 1}
              onClick={() => moveSelected(tourId, 1)}
              aria-label="Опустить тур"
            >
              <ArrowDown className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 text-neutral-500 hover:text-red-600"
              onClick={() =>
                saveTourIds(selectedIds.filter((id) => id !== tourId))
              }
              aria-label="Убрать тур из хаба"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 shrink-0 gap-1"
            onClick={() => saveTourIds([...selectedIds, tourId])}
          >
            <Plus className="size-3.5" /> Добавить
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Field
        label="Заголовок над списком туров (H2)"
        value={stored.catalog_title ?? hub.defaults.catalog_title ?? ""}
        onChange={(catalog_title) =>
          onChange(hub.slug, { catalog_title, path: hub.path })
        }
        placeholder="Актуальные автобусные туры из Минска 2026–2027"
        hint="Этот заголовок видят посетители и поисковые роботы. Напишите естественную фразу, которая точно соответствует турам в хабе."
      />

      <div className="flex flex-col gap-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-neutral-700">
          Перетащите тур справа налево, чтобы добавить его в хаб. Порядок в
          списке «Туры в этом хабе» совпадает с порядком карточек на странице.
          Скрытые и выключенные туры отмечены статусом и публично не выводятся.
        </p>
        {isManual && (
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() =>
              onChange(hub.slug, { tour_ids: null, path: hub.path })
            }
          >
            Вернуть автоподбор
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div
          className="min-h-64 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3"
          onDragOver={(event) => event.preventDefault()}
          onDrop={dropIntoSelected}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-neutral-900">
                Туры в этом хабе
              </p>
              <p className="text-xs text-neutral-500">
                {isManual ? "ручной порядок" : "автоматический подбор"}
              </p>
            </div>
            <span className="rounded-full bg-white px-2 py-1 text-xs text-neutral-600 ring-1 ring-neutral-200">
              {selectedTours.length}
            </span>
          </div>
          <div className="space-y-2">
            {selectedTours.length ? (
              selectedTours.map((tour, index) => (
                <TourItem
                  key={tourReference(tour)}
                  tour={tour}
                  selected
                  index={index}
                />
              ))
            ) : (
              <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-neutral-300 px-4 text-center text-sm text-neutral-500">
                Перетащите сюда нужные туры
              </div>
            )}
          </div>
        </div>

        <div
          className="min-h-64 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3"
          onDragOver={(event) => event.preventDefault()}
          onDrop={dropIntoAvailable}
        >
          <div className="mb-3">
            <p className="font-semibold text-neutral-900">Все остальные туры</p>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Найти тур по названию или направлению"
              className="mt-2 bg-white"
            />
          </div>
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {availableTours.length ? (
              availableTours.map((tour) => (
                <TourItem
                  key={tourReference(tour)}
                  tour={tour}
                  selected={false}
                />
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500">
                Подходящих туров не найдено
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageUploadField({
  label,
  value,
  onChange,
  previewAspectRatio,
  hint = "Рекомендуемый размер для превью ссылки: 1200×630 px.",
}) {
  const latestChange = useRef(onChange);
  latestChange.current = onChange;
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file) => {
    if (!file || hasPendingUploads()) return;

    try {
      setUploading(true);
      const url = await uploadPreparedImage(file);
      latestChange.current(url);
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
              className={`${previewAspectRatio ? "w-36" : "h-24 w-36"} rounded-lg object-cover bg-neutral-100`}
              style={previewAspectRatio ? { aspectRatio: previewAspectRatio } : undefined}
            />
          ) : (
            <div
              className={`${previewAspectRatio ? "w-36" : "h-24 w-36"} rounded-lg bg-neutral-100 flex items-center justify-center`}
              style={previewAspectRatio ? { aspectRatio: previewAspectRatio } : undefined}
            >
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
              {hint}
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

function TravelLinksSettings({ value, tours, onChange }) {
  const [search, setSearch] = useState("");
  const manual = Array.isArray(value.tour_slugs);
  const selected = value.tour_slugs || [];
  const move = (index, delta) => {
    const next = [...selected];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange({ tour_slugs: next });
  };
  return <div className="space-y-4">
    <p className="text-sm text-neutral-600">Страница /links для соцсетей. По умолчанию показывает туры с предстоящими датами, ближайшие первыми. В ручном режиме вы выбираете состав и порядок.</p>
    <Field label="Заголовок" value={value.title || ""} placeholder="Актуальные туры" onChange={(title) => onChange({ title })} />
    <TextareaField label="Описание" value={value.description || ""} onChange={(description) => onChange({ description })} />
    <label className="flex gap-2 items-center"><input type="checkbox" checked={manual} onChange={(event) => onChange({ tour_slugs: event.target.checked ? [] : null })} /> Выбирать туры и порядок вручную</label>
    {manual && <>
      <div className="space-y-2">{selected.map((slug, index) => <div key={slug} className="flex items-center gap-2 rounded-xl border p-3">
        <span className="min-w-0 flex-1 break-words">{tours.find((tour) => tour.slug === slug)?.title || slug}</span>
        <Button type="button" variant="outline" disabled={!index} aria-label="Выше" onClick={() => move(index, -1)}>↑</Button>
        <Button type="button" variant="outline" disabled={index === selected.length - 1} aria-label="Ниже" onClick={() => move(index, 1)}>↓</Button>
        <Button type="button" variant="outline" aria-label="Убрать тур" onClick={() => onChange({ tour_slugs: selected.filter((item) => item !== slug) })}>×</Button>
      </div>)}</div>
      <Input placeholder="Найти тур" aria-label="Найти тур для соцсетей" value={search} onChange={(event) => setSearch(event.target.value)} />
      <div className="max-h-96 space-y-2 overflow-y-auto">{tours.filter((tour) => !selected.includes(tour.slug) && `${tour.title} ${tour.slug}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map((tour) => <div key={tour.slug} className="flex items-center gap-2 rounded-xl border p-3">
        <span className="min-w-0 flex-1 break-words">{tour.title}{(tour.active === false || tour.hidden) && " (скрыт на сайте)"}</span>
        <Button type="button" variant="outline" onClick={() => onChange({ tour_slugs: [...selected, tour.slug] })}>Добавить</Button>
      </div>)}</div>
    </>}
  </div>;
}
