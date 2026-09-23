import ArticleContentEditor from "@/components/admin/ArticleContentEditor";
import { getArticleBlocks, articleBlockText } from "@/lib/articleContent";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  X,
  Loader2,
  Copy,
  Check,
  Calendar as CalendarIcon,
  FileText,
  ListOrdered,
} from "lucide-react";
import { toast } from "sonner";
import { uploadImage, usePendingUploads, hasPendingUploads, normalizeImageItems, normalizeRecordImages } from "@/lib/imageUpload";
import { mediaUrl } from "@/lib/media";
import { formatDate } from "@/lib/formatDate";
import { RICH_TEXT_ICONS, richTextToPlain } from "@/lib/richText";
import MarkdownLinkButton from "@/components/admin/MarkdownLinkButton";
import MarkdownBoldButton, { useMarkdownBold } from "@/components/admin/MarkdownBoldButton";
import TourTitleField from "@/components/admin/TourTitleField";
import TourOrderDialog from "@/components/admin/TourOrderDialog";
import LazyYoutubeEmbed from "@/components/LazyYoutubeEmbed";
import { getYoutubeVideoId } from "@/lib/youtube";
import { invalidateSiteData } from "@/lib/useSiteData";
import {
  getTourTransportType,
  TOUR_TRANSPORT_TYPES,
} from "@/lib/tourTransport";
import {
  getTourAnchorIssues,
  getTourAnchorPath,
  getTourAnchorUrl,
  normalizeTourAnchor,
  normalizeTourSectionAnchors,
  RESERVED_TOUR_ANCHORS,
  TOUR_SECTION_ANCHORS,
} from "@/lib/tourAnchors";
import { normalizeSpecialDateFields } from "@/lib/tourSpecialDates";

const TITLES = {
  tours: "Туры",
  reviews: "Отзывы",
  articles: "Статьи блога",
  promotions: "Акции",
  faq: "FAQ — главная и страница вопросов",
};

const TOUR_SEO_FIELD_KEYS = new Set([
  "seo_title",
  "seo_description",
  "seo_image",
]);
const TOUR_PUBLISHING_FIELD_KEYS = new Set([
  "seo_canonical_url",
  "seo_noindex",
  "seo_nofollow",
  "seo_lastmod",
  "order",
  "active",
  "hidden",
]);

const getTourEditorTab = (field) => {
  if (TOUR_SEO_FIELD_KEYS.has(field.key)) return "seo";
  if (TOUR_PUBLISHING_FIELD_KEYS.has(field.key)) return "publishing";
  return "content";
};

// Per-collection editor schema. Each field has a key and a render hint.
// Anything not listed will be edited inside the "Дополнительно (JSON)" textarea.
const SCHEMAS = {
  tours: {
    label: (t) => t.title || t.slug,
    description: (t) =>
      `${
        getTourTransportType(t) === TOUR_TRANSPORT_TYPES.AIR
          ? "Авиа тур"
          : "Автобусный тур"
      } · ${t.region_name || ""} · ${t.duration || ""}`,
    image: (t) => t.hero_image,
    fields: [
      {
        key: "title",
        label: "Название тура на сайте",
        type: "tour-title",
        placeholder: "Например: Легендарный тур в Арктику из Минска",
        hint: "Это название видят посетители: в карточке, на странице тура, в формах заявки и PDF-программе. Оно же является видимым H1 страницы.",
      },
      { key: "title_highlighted", type: "hidden", defaultValue: "" },
      {
        key: "transport_type",
        label: "Вид тура",
        type: "select",
        defaultValue: TOUR_TRANSPORT_TYPES.BUS,
        options: [
          {
            value: TOUR_TRANSPORT_TYPES.BUS,
            label: "Автобусный тур",
          },
          { value: TOUR_TRANSPORT_TYPES.AIR, label: "Авиа тур" },
        ],
        hint: "Определяет раздел сайта, пункт меню и значок транспорта в карточке.",
      },
      {
        key: "slug",
        label: "URL (slug)",
        type: "text",
        placeholder:
          "Можно указать вручную. Если оставить пустым, создастся из названия.",
      },
      {
        key: "tagline",
        label: "Подзаголовок в карточке тура",
        type: "textarea",
        rows: 2,
        maxLength: 180,
        placeholder: "Короткая фраза под названием тура",
        hint: "Отображается под основным заголовком в карточке тура (до двух строк).",
      },
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
        key: "auto_delete_dates_days_before",
        label: "Удалять даты за сколько дней до начала",
        type: "number",
        placeholder: "0",
        min: 0,
        max: 3650,
        hint: "Расчёт ведётся по времени Беларуси (GMT+3). Например: если указать 5, дата 30.07 удалится 25.07 в 00:00. Значение 0 удаляет дату в день начала.",
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
        key: "hero_image_alt",
        label: "ALT главного фото",
        type: "text",
        placeholder: "Что изображено на фото — без слов «фото 1»",
      },
      {
        key: "hero_mobile_image",
        label: "Главное фото для мобильной версии",
        type: "image",
      },
      {
        key: "hero_mobile_image_alt",
        label: "ALT мобильного главного фото",
        type: "text",
        placeholder: "Если пусто, используется ALT главного фото",
      },
      {
        key: "seo_title",
        label: "Заголовок для поиска и внешних ссылок (SEO Title)",
        type: "text",
        placeholder: "Например: Тур в Арктику из Минска — даты и цены | TRAVELSPACE",
        hint: "Используется во вкладке браузера, как рекомендуемый заголовок результата в поиске и при публикации ссылки в соцсетях. На странице тура крупным текстом не отображается.",
      },
      {
        key: "seo_description",
        label: "Описание для поиска и внешних ссылок (SEO Description)",
        type: "textarea",
        rows: 4,
        placeholder: "Кратко опишите маршрут, даты, стоимость и главное преимущество тура.",
        hint: "Используется как рекомендуемое описание результата в поиске. Google может сформировать свой вариант из текста страницы.",
      },
      {
        key: "seo_h1",
        label: "Устаревший SEO H1",
        type: "hidden",
      },
      {
        key: "seo_canonical_url",
        label: "Основной адрес страницы для поисковика (Canonical URL)",
        type: "text",
        placeholder: "Обычно это поле нужно оставить пустым",
        hint: "Почти всегда оставляйте пустым — сайт сам укажет текущий адрес тура. Заполняйте только если эта страница является копией другого тура: тогда укажите адрес основной страницы, например /tours/osnovnoi-tur. Ссылки на другие сайты здесь использовать нельзя.",
      },
      {
        key: "seo_noindex",
        label: "Скрыть страницу из Google и Яндекса (noindex)",
        type: "switch",
        defaultValue: false,
        onLabel: "Страница закрыта от поисковиков",
        offLabel: "Страница разрешена для поиска — рекомендуется",
        hint: "Если включить, тур продолжит открываться по прямой ссылке, но поисковикам будет дано указание не показывать его в результатах поиска. Используйте только для тестовых, временных или дублирующихся страниц.",
      },
      {
        key: "seo_nofollow",
        label: "Запретить поисковикам учитывать ссылки на странице (nofollow)",
        type: "switch",
        defaultValue: false,
        onLabel: "Ссылки закрыты для поисковых роботов",
        offLabel: "Ссылки разрешены — рекомендуется",
        hint: "На посетителей и работу кнопок это не влияет. Настройка относится только к поисковым роботам и почти всегда должна быть выключена. Включайте её только по указанию SEO-специалиста.",
      },
      {
        key: "seo_lastmod",
        label: "Дата существенного обновления для sitemap",
        type: "date",
        placeholder: "дд.мм.гггг",
        hint: "Заполняйте только при реальном обновлении содержания. Если поле пустое, используется дата сохранения содержимого.",
      },
      {
        key: "seo_image",
        label: "SEO / Open Graph фото для ссылки",
        type: "image",
      },
      { key: "order", type: "hidden", defaultValue: "" },
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
      {
        key: "date",
        label: "Дата отзыва",
        type: "date",
        placeholder: "дд.мм.гггг",
        hint: "Отзывы автоматически выводятся от новых к старым. Без даты — в конце списка.",
      },
      { key: "order", type: "hidden", defaultValue: "" },
      { key: "active", label: "Активен", type: "switch" },
    ],
  },
  articles: {
    label: (a) => a.title,
    description: (a) => a.published_at,
    image: (a) => a.cover,
    fields: [
      {
        key: "title",
        label: "Заголовок",
        type: "article-title",
        placeholder: "Например: Главные достопримечательности Санкт-Петербурга",
      },
      { key: "title_highlighted", type: "hidden", defaultValue: "" },
      {
        key: "slug",
        label: "URL (slug)",
        type: "text",
        placeholder:
          "Можно указать вручную. Если оставить пустым, создастся из заголовка.",
      },
      { key: "cover", label: "Обложка", type: "image" },
      { key: "cover_alt", label: "ALT обложки", type: "text" },
      {
        key: "gallery",
        label: "Дополнительные фото внутри статьи",
        type: "hidden",
        altKey: "gallery_alts",
      },
      { key: "excerpt", label: "Краткое описание", type: "textarea" },
      {
        key: "content",
        label: "Содержание",
        type: "hidden",
        rows: 14,
        placeholder:
          "Разбивайте текст на короткие абзацы. Ссылки добавляйте через кнопку над полем.",

      },
      { key: "content_blocks", label: "Содержание статьи: текст и фотографии", type: "article-body" },
      { key: "seo_title", label: "SEO Title", type: "text" },
      { key: "seo_description", label: "SEO Description", type: "textarea" },
      { key: "seo_h1", label: "SEO H1", type: "text" },
      {
        key: "seo_canonical_url",
        label: "Canonical URL (необязательно)",
        type: "text",
      },
      {
        key: "seo_noindex",
        label: "Запретить индексацию статьи (noindex)",
        type: "switch",
        defaultValue: false,
      },
      {
        key: "seo_nofollow",
        label: "Запретить переход по ссылкам (nofollow)",
        type: "switch",
        defaultValue: false,
      },
      {
        key: "seo_lastmod",
        label: "Дата существенного обновления для sitemap",
        type: "date",
        placeholder: "дд.мм.гггг",
      },
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
      {
        key: "hidden",
        label: "Скрыть из общего списка блога",
        type: "switch",
        defaultValue: false,
        onLabel: "Статья доступна по ссылке и поисковикам, но не показана в блоге",
        offLabel: "Статья показана в общем списке блога",
        hint: "Подходит для SEO-статей: прямая ссылка работает, статья остаётся в sitemap и может индексироваться.",
      },
    ],
  },
  promotions: {
    label: (p) => p.title,
    description: (p) => p.valid_until && `до ${formatDate(p.valid_until)}`,
    image: (p) => p.image,
    fields: [
      { key: "title", label: "Название акции", type: "text" },
      { key: "image", label: "Изображение", type: "image" },
      { key: "description", label: "Описание", type: "textarea" },
      {
        key: "valid_until",
        label: "Действует до",
        type: "date",
        placeholder: "дд.мм.гггг",
        hint: "Дата сохраняется и выводится в формате дд.мм.гггг.",
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
    description: (f) => `${f.category || "Общее"} · ${f.show_on_home === false ? "Только страница FAQ" : "Главная и страница FAQ"} · порядок ${f.order || 0}`,
    fields: [
      { key: "category", label: "Категория", type: "text" },
      { key: "question", label: "Вопрос", type: "text" },
      { key: "answer", label: "Ответ", type: "textarea" },
      {
        key: "show_on_home",
        label: "Показывать на главной странице",
        type: "switch",
        defaultValue: true,
        hint: "Вопрос останется на общей странице FAQ, даже если отключить его на главной.",
      },
      { key: "order", label: "Порядок", type: "number" },
      { key: "active", label: "Активен", type: "switch" },
    ],
  },
};

const TOUR_JSON_HINT =
  "Для тура можно добавить поля: highlights (массив строк) — главные впечатления; what_to_see (массив строк) — что посмотреть; gallery (массив URL) — галерея; program (массив дней) — программа по дням; included / excluded — что входит и что нет; important_info — важно знать; hotels — отели; dates — массив дат; faq — массив вопросов; related_tour_slugs — связанные туры; videos — видео YouTube.";

const TOUR_EXTRA_KEYS = [
  "badges",
  "gallery",
  "gallery_alts",
  "highlights",
  "what_to_see",
  "included",
  "excluded",
  "important_info",
  "section_anchors",
  "program",
  "use_hotel_chains",
  "show_chain_dates",
  "chains",
  "dates",
  "hotels",
  "faq",
  "map_embed",
  "related_tour_slugs",
  "related_tours_title",
  "videos",
  "youtube_title",
  "youtube_url",
];

const firstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null);

const normalizeDateRecord = (d = {}, record = {}) => ({
  id: d.id || uid(),
  start: d.start || "",
  end: d.end || "",
  price: d.price === "" ? "" : Number(d.price ?? record.price_from ?? 0),
  currency: d.currency || record.currency || "BYN",
  price_type: d.price_type || d.priceType || "from",
  status: d.status || "active",
  comment: d.comment || "",
  ...normalizeSpecialDateFields(d),
  promotion_active:
    d.promotion_active === true ||
    d.promotionActive === true ||
    d.is_promotion === true ||
    d.isPromotion === true ||
    d.is_promo === true ||
    d.isPromo === true ||
    d.promo === true,
  promotion_price: firstDefined(
    d.promotion_price,
    d.promotionPrice,
    d.promo_price,
    d.promoPrice,
    d.sale_price,
    d.salePrice,
    d.discount_price,
    d.discountPrice,
    "",
  ),
  promotion_currency:
    d.promotion_currency ||
    d.promotionCurrency ||
    d.promo_currency ||
    d.promoCurrency ||
    d.sale_currency ||
    d.saleCurrency ||
    d.currency ||
    record.currency ||
    "BYN",
  promotion_additional_price: firstDefined(
    d.promotion_additional_price,
    d.promotionAdditionalPrice,
    d.promo_additional_price,
    d.promoAdditionalPrice,
    d.sale_additional_price,
    d.saleAdditionalPrice,
    d.discount_additional_price,
    d.discountAdditionalPrice,
    "",
  ),
  promotion_additional_currency:
    d.promotion_additional_currency ||
    d.promotionAdditionalCurrency ||
    d.promo_additional_currency ||
    d.promoAdditionalCurrency ||
    d.sale_additional_currency ||
    d.saleAdditionalCurrency ||
    d.additional_currency ||
    record.additional_currency ||
    d.currency ||
    record.currency ||
    "BYN",
});

const normalizeDateForSave = (date = {}) => ({
  ...date,
  ...normalizeSpecialDateFields(date),
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
  promotion_price: firstDefined(
    meal.promotion_price,
    meal.promotionPrice,
    meal.promo_price,
    meal.promoPrice,
    meal.sale_price,
    meal.salePrice,
    meal.discount_price,
    meal.discountPrice,
    "",
  ),
  promotion_currency:
    meal.promotion_currency ||
    meal.promotionCurrency ||
    meal.promo_currency ||
    meal.promoCurrency ||
    meal.sale_currency ||
    meal.saleCurrency ||
    meal.currency ||
    fallback.currency ||
    "BYN",
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
    promotion_additional_price: firstDefined(
      price.promotion_additional_price,
      price.promotionAdditionalPrice,
      price.promo_additional_price,
      price.promoAdditionalPrice,
      price.sale_additional_price,
      price.saleAdditionalPrice,
      price.discount_additional_price,
      price.discountAdditionalPrice,
      "",
    ),
    promotion_additional_currency:
      price.promotion_additional_currency ||
      price.promotionAdditionalCurrency ||
      price.promo_additional_currency ||
      price.promoAdditionalCurrency ||
      price.sale_additional_currency ||
      price.saleAdditionalCurrency ||
      price.additional_currency ||
      price.currency ||
      room.currency ||
      "BYN",
  };
};

const normalizeRoomRecord = (room = {}) => ({
  ...room,
  id: room.id || uid(),
  number: room.number || "",
  title: room.title || "",
  description: room.description || "",
  gallery: Array.isArray(room.gallery) ? room.gallery.filter(Boolean) : [],
  gallery_alts: Array.isArray(room.gallery_alts) ? room.gallery_alts : [],
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
  ...h,
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
  image_alts: Array.isArray(h.image_alts) ? h.image_alts : [],
  meal: h.meal || "",
  location: h.location || "",
  order: h.order ?? "",
  active: h.active !== false,
  rooms: Array.isArray(h.rooms) ? h.rooms.map(normalizeRoomRecord) : [],
});

const getActiveChainDates = (chains = []) => {
  const seen = new Set();

  return (Array.isArray(chains) ? chains : [])
    .filter((chain) => chain?.active !== false)
    .flatMap((chain) => (Array.isArray(chain?.dates) ? chain.dates : []))
    .filter((date) => {
      const key =
        date?.id ||
        `${date?.start || ""}|${date?.end || ""}|${date?.price ?? ""}`;

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const resolveUseHotelChains = (record = {}) => {
  if (typeof record.use_hotel_chains === "boolean") {
    return record.use_hotel_chains;
  }

  return (Array.isArray(record.chains) ? record.chains : []).some(
    (chain) => Array.isArray(chain?.hotels) && chain.hotels.length > 0,
  );
};

const normalizeChains = (record = {}) => {
  if (Array.isArray(record.chains) && record.chains.length) {
    return record.chains.map((chain, index) => ({
      id: chain.id || uid(),
      title:
        chain.title !== undefined
          ? chain.title
          : chain.name !== undefined
            ? chain.name
            : `Цепочка ${index + 1}`,
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
  record = normalizeRecordImages(record);
  if (collectionName !== "tours") return record;

  const isNew = !record.id;
  const useHotelChains = resolveUseHotelChains(record);
  const chainDates = getActiveChainDates(record.chains);
  const simpleDates = chainDates.length
    ? chainDates
    : Array.isArray(record.dates)
      ? record.dates
      : [];

  return {
    ...(isNew ? {} : { id: record.id }),
    ...(record._hotels_revision ? { _hotels_revision: record._hotels_revision } : {}),

    title: record.title || "",
    title_highlighted:
      typeof record.title_highlighted === "string"
        ? record.title_highlighted
        : "",
    transport_type: getTourTransportType(record),
    slug: record.slug || slugify(record.title || ""),
    tagline: record.tagline || "",
    region_name: record.region_name || "",
    region_slug: record.region_slug || slugify(record.region_name || ""),
    duration: record.duration || "",
    auto_delete_dates_days_before: record.auto_delete_dates_days_before ?? 0,
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
    hero_image_alt: record.hero_image_alt || "",
    hero_mobile_image:
      record.hero_mobile_image ||
      record.mobile_hero_image ||
      record.hero_mobile ||
      "",
    hero_mobile_image_alt:
      record.hero_mobile_image_alt || record.hero_image_alt || "",
    seo_title: record.seo_title || "",
    seo_description: record.seo_description || "",
    seo_h1: record.seo_h1 || "",
    seo_canonical_url: record.seo_canonical_url || "",
    seo_noindex: record.seo_noindex === true,
    seo_nofollow: record.seo_nofollow === true,
    seo_lastmod: record.seo_lastmod || "",
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
    gallery_alts: Array.isArray(record.gallery_alts)
      ? record.gallery_alts
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
    section_anchors: normalizeTourSectionAnchors(record.section_anchors),

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
            anchor: normalizeTourAnchor(d.anchor),
            ...normalizeImageItems(Array.isArray(d.images) ? d.images : images, d.image_alts),
            notes: d.notes || "",
          };
        })
      : [],

    // New tour structure: chain -> hotels -> rooms.
    // Old dates/hotels are converted into one default chain for compatibility.
    use_hotel_chains: useHotelChains,
    show_chain_dates: record.show_chain_dates !== false,
    chains: normalizeChains(record),

    // Keep old fields only for compatibility with old public components/data.
    dates: (useHotelChains
      ? Array.isArray(record.dates)
        ? record.dates
        : []
      : simpleDates
    ).map((d) => normalizeDateRecord(d, record)),
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
    related_tour_slugs: Array.isArray(record.related_tour_slugs)
      ? [...new Set(record.related_tour_slugs.map(String).filter(Boolean))]
      : record.related_tour_slug
        ? [String(record.related_tour_slug)]
        : [],
    related_tours_title:
      record.related_tours_title ||
      "Туры, которые вас также могут заинтересовать",
    youtube_title: record.youtube_title || "",
    youtube_url: record.youtube_url || "",
    videos: Array.isArray(record.videos)
      ? record.videos.map((video) => ({
          id: video?.id || uid(),
          title: video?.title || "",
          url: video?.url || video?.video_url || "",
          cover: video?.cover || video?.thumbnail || "",
          cover_alt: video?.cover_alt || "",
          description: video?.description || "",
        }))
      : [],
  };
};

export default function AdminCollection({ name }) {
  const schema = SCHEMAS[name];
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [tourOrderOpen, setTourOrderOpen] = useState(false);

  const load = useCallback(async () => {
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
  }, [name]);

  useEffect(() => {
    console.log("AdminCollection mounted / name changed:", name);
    load();
  }, [load, name]);

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

    invalidateSiteData();
    setEditing(null);
    await load();
  };

  const onDelete = async (id) => {
    if (!confirm("Удалить запись?")) return;
    await api.delete(`/admin/${name}/${id}`);
    invalidateSiteData();
    setItems((p) => p.filter((x) => x.id !== id));
    toast.success("Удалено");
  };

  const onDuplicateTour = async (item) => {
    if (name !== "tours" || !item?.id) return;

    const title = schema.label?.(item) || item.title || "тур";
    if (!confirm(`Создать дубликат тура «${title}»?`)) return;

    try {
      setDuplicatingId(item.id);
      const response = await api.post(`/admin/tours/${item.id}/duplicate`);
      toast.success(
        "Дубликат создан. Он выключен и скрыт из каталога до публикации.",
      );
      await load();
      setEditing(normalizeRecord(response.data, name));
    } catch (e) {
      console.error("Duplicate tour error:", e);
      toast.error(
        e?.response?.data?.detail ||
          e?.message ||
          "Не удалось создать дубликат",
      );
    } finally {
      setDuplicatingId(null);
    }
  };

  const onSaveTourOrder = async (groups) => {
    try {
      const response = await api.put("/admin/tours/order", {
        bus: groups[TOUR_TRANSPORT_TYPES.BUS] || [],
        air: groups[TOUR_TRANSPORT_TYPES.AIR] || [],
      });
      setItems(response.data);
      invalidateSiteData();
      toast.success("Порядок туров сохранён");
    } catch (error) {
      toast.error(
        error?.response?.data?.detail ||
          error?.message ||
          "Не удалось сохранить порядок туров",
      );
      throw error;
    }
  };

  return (
    <div data-testid={`admin-collection-${name}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl">{TITLES[name]}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Управление содержимым раздела «{TITLES[name]}».
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {name === "tours" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setTourOrderOpen(true)}
              className="rounded-full"
              data-testid="admin-tour-order-btn"
            >
              <ListOrdered className="size-4" /> Порядок туров
            </Button>
          )}
          <Button
            onClick={() => setEditing(normalizeRecord({}, name))}
            className="rounded-full bg-[#C2410C] hover:bg-[#9A3412] text-white"
            data-testid="admin-add-btn"
          >
            <Plus className="size-4 mr-1" /> Добавить
          </Button>
        </div>
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
                    {richTextToPlain(schema.description(it))}
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

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {name === "tours" && (
                      <Link
                        to={`/admin/tours/${it.id}/pdf-program`}
                        className="inline-flex items-center gap-1 text-xs text-violet-700 hover:underline"
                        data-testid={`admin-pdf-program-${it.id}`}
                      >
                        <FileText className="size-3.5" /> PDF-программа
                      </Link>
                    )}

                    {name === "tours" && (
                      <button
                        type="button"
                        onClick={() => onDuplicateTour(it)}
                        disabled={duplicatingId === it.id}
                        className="text-xs text-sky-700 hover:underline disabled:pointer-events-none disabled:opacity-60 inline-flex items-center gap-1"
                        data-testid={`admin-duplicate-${it.id}`}
                      >
                        {duplicatingId === it.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                        Дублировать
                      </button>
                    )}

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
        collectionItems={items}
        onClose={() => setEditing(null)}
        onSave={onSave}
      />

      {name === "tours" && (
        <TourOrderDialog
          open={tourOrderOpen}
          tours={items}
          onOpenChange={setTourOrderOpen}
          onSave={onSaveTourOrder}
        />
      )}
    </div>
  );
}

function TourSearchPreview({ form }) {
  const tourTitle = String(form.title || "").trim() || "Название тура";
  const previewTitle =
    String(form.seo_title || "").trim() || `${tourTitle} | TRAVELSPACE`;
  const previewDescription =
    String(form.seo_description || "").trim() ||
    String(form.short_description || form.tagline || form.description || "").trim() ||
    "Добавьте отдельное описание для поисковой выдачи.";
  const previewSlug =
    String(form.slug || "").trim() || slugify(tourTitle) || "nazvanie-tura";

  return (
    <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
        Предпросмотр результата поиска
      </p>
      <p className="mt-2 truncate text-xs text-emerald-700">
        travelspace.by › tours › {previewSlug}
      </p>
      <p className="mt-1 line-clamp-2 text-base font-medium leading-snug text-[#1a0dab]">
        {previewTitle}
      </p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-600">
        {previewDescription}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-500">
        <span>Title: {String(form.seo_title || "").length} символов</span>
        <span>
          Description: {String(form.seo_description || "").length} символов
        </span>
      </div>
      <p className="mt-2 text-[11px] text-neutral-500">
        Это ориентировочный вид: поисковая система может изменить заголовок или
        описание результата.
      </p>
    </div>
  );
}

function EditDialog({
  open,
  record,
  schema,
  collectionName,
  collectionItems = [],
  onClose,
  onSave,
}) {
  const uploading = usePendingUploads();
  const [form, setForm] = useState({});
  const [extraJson, setExtraJson] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [saving, setSaving] = useState(false);
  const [tourEditorTab, setTourEditorTab] = useState("content");
  useEffect(() => {
    if (!open) return;
    if (!record) return;

    const knownKeys = new Set(schema.fields.map((f) => f.key));
    schema.fields.forEach((f) => {
      if (f.altKey) knownKeys.add(f.altKey);
    });
    knownKeys.add("id");
    knownKeys.add("_hotels_revision");

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

    if (collectionName === "articles") known.content_blocks = getArticleBlocks(record);
    setForm(known);
    setExtraJson(
      Object.keys(extra).length ? JSON.stringify(extra, null, 2) : "",
    );
    setJsonError("");
    setTourEditorTab("content");
  }, [open, record, schema, collectionName]);
  const update = useCallback((k, v) => setForm((p) => ({ ...p, [k]: v })), []);
  const updateTourTitle = useCallback((fields) => setForm((previous) => ({ ...previous, ...fields })), []);

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
    if (e.target !== e.currentTarget) return;
    if (hasPendingUploads()) { toast.error("Дождитесь загрузки фото"); return; }

    const payload = {
      ...form,
    };

    if (collectionName === "tours") {
      payload.slug = form.slug?.trim() || slugify(form.title);
      payload.transport_type = getTourTransportType(form);
      payload.tagline = String(form.tagline || "").trim();
      payload.region_slug =
        form.region_slug?.trim() || slugify(form.region_name);
      payload.departure_cities = Array.isArray(form.departure_cities)
        ? form.departure_cities.filter(Boolean)
        : form.departure_city
          ? [form.departure_city]
          : [];
      payload.departure_city =
        payload.departure_cities[0] || form.departure_city || "";

      payload.use_hotel_chains = form.use_hotel_chains === true;
      payload.show_chain_dates = form.show_chain_dates !== false;

      if (payload.use_hotel_chains) {
        // A tour may use hotel links while displaying its common dates. This
        // prevents duplicated schedules for tours that do not use chains as
        // their public date source.
        payload.dates = payload.show_chain_dates
          ? []
          : (Array.isArray(form.dates) && form.dates.length
              ? form.dates
              : getActiveChainDates(form.chains)).map(normalizeDateForSave);
        payload.hotels = [];
        payload.chains = (Array.isArray(form.chains) ? form.chains : []).map(
          (chain) => ({
            ...chain,
            dates: (Array.isArray(chain?.dates) ? chain.dates : []).map(
              normalizeDateForSave,
            ),
          }),
        );
      } else {
        // In simple mode the public page reads the common date list directly.
        // Remove the hidden chain data so dates are not duplicated in booking
        // forms and in the automatic stale-date cleanup.
        payload.dates = (Array.isArray(form.dates) ? form.dates : []).map(
          normalizeDateForSave,
        );
        payload.chains = [];
        payload.hotels = [];
      }

      const allPayloadDates = payload.use_hotel_chains
        ? (payload.show_chain_dates
            ? payload.chains.flatMap((chain) => chain.dates || [])
            : payload.dates)
        : payload.dates;
      const linkedSpecialTourSlugs = allPayloadDates
        .filter((date) => date.special_active && date.special_tour_slug)
        .map((date) => date.special_tour_slug);
      if (linkedSpecialTourSlugs.includes(payload.slug)) {
        toast.error("Особая дата не может вести на этот же тур.");
        return;
      }
      const knownTourSlugs = new Set(
        collectionItems.map((tour) => String(tour?.slug || "")).filter(Boolean),
      );
      const missingSpecialTourSlug = linkedSpecialTourSlugs.find(
        (linkedSlug) => !knownTourSlugs.has(linkedSlug),
      );
      if (missingSpecialTourSlug) {
        toast.error(
          `Связанный тур «${missingSpecialTourSlug}» не найден. Выберите существующую программу или уберите переход.`,
        );
        return;
      }

      payload.program = Array.isArray(form.program)
        ? form.program.map((day, index) => {
            return {
              ...day,
              day: String(day.day || index + 1),
              anchor: normalizeTourAnchor(day.anchor),
              ...normalizeImageItems(Array.isArray(day.images) ? day.images : day.image ? [day.image] : [], day.image_alts),
            };
          })
        : [];
      payload.section_anchors = normalizeTourSectionAnchors(
        form.section_anchors,
      );

      const anchorIssues = getTourAnchorIssues(payload);
      if (anchorIssues.reserved.length) {
        toast.error(
          `Якорь #${anchorIssues.reserved[0]} уже используется сайтом. Оставьте поле пустым и скопируйте системную ссылку или задайте другое название.`,
        );
        return;
      }
      if (anchorIssues.duplicates.length) {
        toast.error(
          `Якорь #${anchorIssues.duplicates[0]} указан несколько раз. Каждый якорь внутри тура должен быть уникальным.`,
        );
        return;
      }

      payload.related_tour_slugs = Array.isArray(form.related_tour_slugs)
        ? [
            ...new Set(
              form.related_tour_slugs
                .map((slug) => String(slug || "").trim())
                .filter((slug) => slug && slug !== payload.slug),
            ),
          ]
        : [];
      payload.youtube_title = String(form.youtube_title || "").trim();
      payload.youtube_url = String(form.youtube_url || "").trim();
      payload.videos = Array.isArray(form.videos)
        ? form.videos
            .map((video) => ({
              id: video?.id || uid(),
              title: String(video?.title || "").trim(),
              url: String(video?.url || "").trim(),
              cover: String(video?.cover || "").trim(),
              cover_alt: String(video?.cover_alt || "").trim(),
              description: String(video?.description || "").trim(),
            }))
            .filter((video) => video.url)
        : [];
    }

    if (collectionName === "articles") {
      payload.slug = form.slug?.trim() || slugify(form.title);
      payload.content = articleBlockText(payload.content_blocks);
    }

    if (collectionName === "reviews") {
      const normalizedDate = normalizeDateToDisplay(form.date);
      if (form.date && !isValidDisplayDate(normalizedDate)) {
        toast.error("Укажите дату отзыва в формате дд.мм.гггг");
        return;
      }
      payload.date = normalizedDate;
    }

    if (collectionName === "promotions") {
      const normalizedValidUntil = normalizeDateToDisplay(form.valid_until);

      if (form.valid_until && !isValidDisplayDate(normalizedValidUntil)) {
        toast.error("Укажите дату в формате дд.мм.гггг");
        return;
      }

      payload.valid_until = normalizedValidUntil;
      payload.related_tour_slugs = Array.isArray(form.related_tour_slugs)
        ? form.related_tour_slugs
            .map((slug) => String(slug || "").trim())
            .filter(Boolean)
        : [];
      payload.related_tour_slug = payload.related_tour_slugs[0] || "";
    }

    try {
      setSaving(true);
      await onSave(normalizeRecordImages(payload));
    } catch (e) {
      console.error("Save error:", e);
      toast.error(e?.response?.data?.detail || e?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !saving && !uploading && !v && onClose()}>
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

        {(saving || uploading) && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-10 animate-spin text-[#C2410C]" />
              <span className="text-sm text-neutral-600">
                {uploading ? "Загружаем фото…" : "Сохраняем изменения..."}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
          <fieldset disabled={saving || uploading} className="contents">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {collectionName === "tours" && (
              <Tabs
                value={tourEditorTab}
                onValueChange={setTourEditorTab}
                className="sticky top-0 z-20 -mx-2 rounded-xl border border-neutral-200 bg-white/95 p-2 shadow-sm backdrop-blur"
              >
                <div className="overflow-x-auto">
                  <TabsList className="h-auto min-w-max justify-start">
                    <TabsTrigger value="content">Для посетителей</TabsTrigger>
                    <TabsTrigger value="seo">SEO и поиск</TabsTrigger>
                    <TabsTrigger value="publishing">
                      Публикация и индексация
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="content" className="px-2 pb-1 pt-2">
                  <p className="text-xs text-neutral-600">
                    Здесь находится всё, что посетители видят непосредственно
                    на сайте: название, описание, фотографии, программа, цены и
                    даты.
                  </p>
                </TabsContent>

                <TabsContent value="seo" className="px-2 pb-1 pt-2">
                  <p className="text-xs text-neutral-600">
                    Эти поля помогают оформить результат поиска и превью ссылки
                    в соцсетях. Они не заменяют видимое название тура на
                    странице.
                  </p>
                  <TourSearchPreview form={form} />
                </TabsContent>

                <TabsContent value="publishing" className="px-2 pb-1 pt-2">
                  <p className="text-xs text-neutral-600">
                    Управление доступностью тура, адресом страницы и правилами
                    для поисковых роботов. Меняйте запреты индексации только при
                    необходимости.
                  </p>
                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                    <span className="font-medium">Для обычного тура:</span>{" "}
                    основной адрес оставьте пустым, а настройки noindex и
                    nofollow — выключенными.
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {schema.fields
              .filter((field) => field.type !== "hidden")
              .filter(
                (field) =>
                  collectionName !== "tours" ||
                  getTourEditorTab(field) === tourEditorTab,
              )
              .map((f) => (
              <div key={f.key}>
                <Label className="text-xs">{f.label}</Label>
                {f.type === "article-body" ? (
                  <ArticleContentEditor value={form.content_blocks} onChange={(content_blocks) => setForm((previous) => ({ ...previous, content_blocks, content: articleBlockText(content_blocks) }))} TextEditor={RichTextarea} ImageEditor={ImageInput} />
                ) : f.type === "tour-title" ? (
                  <TourTitleField tour={form} onChange={updateTourTitle} placeholder={f.placeholder} />
                ) : f.type === "article-title" ? (
                  <TourTitleField tour={form} onChange={updateTourTitle} placeholder={f.placeholder} mode="article" />
                ) : f.type === "switch" ? (
                  <div className="mt-1 flex items-center gap-2">
                    <Switch
                      checked={!!form[f.key]}
                      onCheckedChange={(v) => update(f.key, v)}
                    />
                    <span className="text-sm text-neutral-500">
                      {form[f.key]
                        ? f.onLabel || "Да"
                        : f.offLabel || "Нет"}
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
                      {f.options.filter(Boolean).map((option) => {
                        const value =
                          typeof option === "string" ? option : option.value;
                        const label =
                          typeof option === "string"
                            ? option
                            : option.label || option.value;

                        return (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        );
                      })}
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
                  f.key.startsWith("seo_") || f.plain ? (
                    <Textarea
                      value={form[f.key] ?? ""}
                      onChange={(e) => update(f.key, e.target.value)}
                      rows={f.rows || 3}
                      maxLength={f.maxLength}
                      placeholder={f.placeholder}
                      className="mt-1"
                    />
                  ) : (
                    <RichTextarea
                      value={form[f.key] ?? ""}
                      onChange={(v) => update(f.key, v)}
                      rows={f.rows || 3}
                      maxLength={f.maxLength}
                      placeholder={f.placeholder}
                    />
                  )
                ) : f.type === "number" ? (
                  <Input
                    type="number"
                    min={f.min}
                    max={f.max}
                    value={form[f.key] ?? ""}
                    placeholder={f.placeholder || "Введите число"}
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
                    altValue={f.altKey && Array.isArray(form[f.altKey]) ? form[f.altKey] : []}
                    onAltChange={f.altKey ? (v) => update(f.altKey, v) : undefined}
                    onItemsChange={f.altKey ? (images, imageAlts) =>
                      setForm((previous) => ({
                        ...previous,
                        [f.key]: images,
                        [f.altKey]: imageAlts,
                      })) : undefined}
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
                    maxLength={f.maxLength}
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

            {collectionName === "tours" && tourEditorTab === "content" && (
              <MemoTourExtraFields
                form={form}
                setForm={setForm}
                tours={collectionItems}
              />
            )}
          </div>

          <div className="border-t px-6 py-4 bg-white flex justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving || uploading}
              className="rounded-full"
            >
              Отмена
            </Button>

            <Button
              type="submit"
              disabled={saving || uploading}
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
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
const DATE_DISPLAY_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/;
const DATE_LEGACY_RE = /^(\d{4})[-.\/](\d{2})[-.\/](\d{2})$/;

const toDateObject = (day, month, year) => {
  const d = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    d.getFullYear() !== Number(year) ||
    d.getMonth() !== Number(month) - 1 ||
    d.getDate() !== Number(day)
  ) {
    return null;
  }

  return d;
};

const formatDateForStorage = (date) => {
  if (!date) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
};

const normalizeDateToDisplay = (value = "") => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";

  const datePart = rawValue.split(/[ T]/)[0];

  const display = datePart.match(DATE_DISPLAY_RE);
  if (display) {
    const [, day, month, year] = display;
    return toDateObject(day, month, year) ? datePart : rawValue;
  }

  const legacy = datePart.match(DATE_LEGACY_RE);
  if (legacy) {
    const [, year, month, day] = legacy;
    return toDateObject(day, month, year)
      ? `${day}.${month}.${year}`
      : rawValue;
  }

  return rawValue;
};

const isValidDisplayDate = (value = "") => {
  const match = String(value || "")
    .trim()
    .match(DATE_DISPLAY_RE);
  if (!match) return false;

  const [, day, month, year] = match;
  return !!toDateObject(day, month, year);
};

const formatDateInput = (value = "") => {
  const normalized = normalizeDateToDisplay(value);
  const digits = normalized.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;

  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
};

const parseDateForCalendar = (value = "") => {
  const normalized = normalizeDateToDisplay(value);
  const match = normalized.match(DATE_DISPLAY_RE);

  if (!match) return undefined;

  const [, day, month, year] = match;
  return toDateObject(day, month, year) || undefined;
};

function DateInput({ value, onChange, placeholder = "дд.мм.гггг" }) {
  const displayValue = normalizeDateToDisplay(value);
  const selectedDate = parseDateForCalendar(displayValue);

  return (
    <div className="mt-1 space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={`w-full justify-start text-left font-normal ${
              displayValue ? "text-neutral-900" : "text-neutral-500"
            }`}
          >
            <CalendarIcon className="mr-2 size-4" />
            {isValidDisplayDate(displayValue) ? displayValue : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) onChange(formatDateForStorage(date));
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <div className="flex gap-2">
        <Input
          value={displayValue}
          placeholder={placeholder}
          inputMode="numeric"
          onChange={(e) => onChange(formatDateInput(e.target.value))}
        />
        {displayValue && (
          <Button type="button" variant="outline" onClick={() => onChange("")}>
            Очистить
          </Button>
        )}
      </div>
    </div>
  );
}

function RichTextarea({
  value = "",
  onChange,
  rows = 3,
  placeholder = "",
  className = "",
  maxLength,
  compact = false,
}) {
  const textareaRef = useRef(null);
  const bold = useMarkdownBold({ textareaRef, value, onChange });

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
        <MarkdownBoldButton onClick={bold.toggle} className="h-7 gap-1 px-2 text-xs" />
        {!compact && <span className="px-2 text-[11px] font-medium text-neutral-500">
          Смайлы:
        </span>}

        {!compact && RICH_TEXT_ICONS.map((item) => (
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

        <MarkdownLinkButton
          textareaRef={textareaRef}
          value={value}
          onChange={onChange}
          className="h-7 gap-1 px-2 text-xs"
        />
      </div>

      <Textarea
        ref={textareaRef}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={bold.onKeyDown}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        className={`leading-6 ${className}`}
      />

      {!compact && <p className="text-xs text-neutral-500">
        Enter — новая строка, пустая строка — отдельный абзац. Ссылки
        добавляются через кнопку выше. Для жирного текста выделите слова и нажмите «Жирный» или Ctrl+B.
      </p>}
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

function AnchorAdminField({
  label,
  value = "",
  onChange,
  tourSlug,
  defaultAnchor = "",
  placeholder = "Например: dates-sale",
}) {
  const [copied, setCopied] = useState(false);
  const normalizedValue = normalizeTourAnchor(value);
  const activeAnchor = normalizedValue || defaultAnchor;
  const path = getTourAnchorPath(tourSlug, activeAnchor);
  const usesReservedAnchor =
    Boolean(normalizedValue) && RESERVED_TOUR_ANCHORS.has(normalizedValue);

  const copyLink = async () => {
    const link = getTourAnchorUrl(tourSlug, activeAnchor);
    if (!link) return;

    try {
      await copyToClipboard(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <Label className="text-xs">{label}</Label>
      <Input
        value={value || ""}
        onChange={(event) => onChange(normalizeTourAnchor(event.target.value))}
        placeholder={placeholder}
        className="mt-1"
      />
      {usesReservedAnchor && (
        <p className="mt-1 text-xs text-red-600">
          #{normalizedValue} уже является системным якорем. Очистите поле и
          используйте готовую ссылку ниже либо задайте другое значение.
        </p>
      )}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-xs text-neutral-500">
          {normalizedValue ? "Пользовательская ссылка" : defaultAnchor ? "Системная ссылка" : "Ссылка появится после заполнения"}:{" "}
          {path && (
            <span className="break-all font-mono text-[#C2410C]">{path}</span>
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={copyLink}
          disabled={!activeAnchor || usesReservedAnchor}
          className="h-9 shrink-0 rounded-full px-3 text-xs"
        >
          {copied ? (
            <Check className="mr-1 size-3.5" />
          ) : (
            <Copy className="mr-1 size-3.5" />
          )}
          {copied ? "Скопировано" : "Копировать"}
        </Button>
      </div>
    </div>
  );
}

function TourSectionAnchorsField({ value = {}, onChange, tourSlug, tour }) {
  const anchors = normalizeTourSectionAnchors(value);
  const issues = getTourAnchorIssues({ ...tour, section_anchors: anchors });

  const updateAnchor = (key, anchor) => {
    const next = { ...anchors };
    if (anchor) next[key] = anchor;
    else delete next[key];
    onChange(next);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50/40 p-4">
      <div>
        <Label className="text-base font-semibold text-neutral-900">
          Рекламные якоря разделов
        </Label>
        <p className="mt-1 text-xs leading-5 text-neutral-600">
          Поля необязательные. Введите короткое уникальное название, чтобы
          получить прямую ссылку на раздел. Старые системные ссылки продолжают
          работать и доступны для копирования без заполнения поля. Ссылка будет
          вести на страницу, если соответствующий раздел тура заполнен и виден.
        </p>
      </div>

      {(issues.duplicates.length > 0 || issues.reserved.length > 0) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {issues.duplicates.length > 0 && (
            <p>Повторяются якоря: {issues.duplicates.map((item) => `#${item}`).join(", ")}.</p>
          )}
          {issues.reserved.length > 0 && (
            <p>Заняты системные имена: {issues.reserved.map((item) => `#${item}`).join(", ")}.</p>
          )}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {TOUR_SECTION_ANCHORS.map((section) => (
          <AnchorAdminField
            key={section.key}
            label={section.label}
            value={anchors[section.key] || ""}
            onChange={(anchor) => updateAnchor(section.key, anchor)}
            tourSlug={tourSlug}
            defaultAnchor={section.defaultAnchor || ""}
            placeholder={`Например: ${section.key.replaceAll("_", "-")}-details`}
          />
        ))}
      </div>
    </div>
  );
}

function TourExtraFields({ form, setForm, tours = [] }) {
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
  const updateGalleryAlts = useCallback(
    (v) => update("gallery_alts", v),
    [update],
  );
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
  const updateSectionAnchors = useCallback(
    (v) => update("section_anchors", v),
    [update],
  );
  const updateProgram = useCallback((v) => update("program", v), [update]);
  const updateChains = useCallback((v) => update("chains", v), [update]);
  const updateDates = useCallback((v) => update("dates", v), [update]);
  const updateFaq = useCallback((v) => update("faq", v), [update]);
  const updateRelatedTours = useCallback(
    (v) => update("related_tour_slugs", v),
    [update],
  );
  const updateVideos = useCallback((v) => update("videos", v), [update]);

  const handleUseHotelChainsChange = useCallback(
    (enabled) => {
      const currentChains = Array.isArray(form.chains) ? form.chains : [];
      const hasHotelData = currentChains.some(
        (chain) => Array.isArray(chain?.hotels) && chain.hotels.length > 0,
      );

      if (
        !enabled &&
        hasHotelData &&
        !confirm(
          "Переключить тур в режим «Только даты»? После сохранения цепочки, отели, номера и их привязки будут удалены.",
        )
      ) {
        return;
      }

      setForm((prev) => {
        const chains = Array.isArray(prev.chains) ? prev.chains : [];

        if (enabled) {
          const nextChains = chains.length
            ? chains
            : [
                {
                  id: uid(),
                  title: "Расписание и проживание",
                  description: "",
                  order: 1,
                  active: true,
                  dates: Array.isArray(prev.dates) ? prev.dates : [],
                  hotels: [],
                },
              ];

          return {
            ...prev,
            use_hotel_chains: true,
            chains: nextChains,
          };
        }

        const chainDates = getActiveChainDates(chains);

        return {
          ...prev,
          use_hotel_chains: false,
          dates: chainDates.length
            ? chainDates
            : Array.isArray(prev.dates)
              ? prev.dates
              : [],
        };
      });
    },
    [form.chains, setForm],
  );

  return (
    <div className="space-y-6 rounded-xl border border-neutral-200 p-4">
      <h3 className="font-medium">Дополнительная информация</h3>

      <TourSectionAnchorsField
        value={form.section_anchors || {}}
        onChange={updateSectionAnchors}
        tourSlug={tourSlug}
        tour={form}
      />

      <MemoBadgesField value={form.badges || []} onChange={updateBadges} />

      <MemoImageListField
        label="Галерея"
        value={form.gallery || []}
        onChange={updateGallery}
        altValue={form.gallery_alts || []}
        onAltChange={updateGalleryAlts}
        onItemsChange={(gallery, galleryAlts) =>
          setForm((previous) => ({
            ...previous,
            gallery,
            gallery_alts: galleryAlts,
          }))
        }
      />

      <MemoStringListField
        rich
        label="Главные впечатления"
        value={form.highlights || []}
        onChange={updateHighlights}
        placeholder="Сулакский каньон — самый глубокий в Европе"
      />

      <MemoStringListField
        rich
        label="Что посмотреть"
        value={form.what_to_see || []}
        onChange={updateWhatToSee}
        placeholder="Дербент и крепость Нарын-Кала"
      />

      <MemoStringListField
        rich
        label="Что входит"
        value={form.included || []}
        onChange={updateIncluded}
        placeholder="Проезд и трансферы"
      />

      <MemoStringListField
        rich
        label="Что не входит"
        value={form.excluded || []}
        onChange={updateExcluded}
        placeholder="Личные расходы"
      />

      <MemoStringListField
        rich
        label="Важная информация"
        value={form.important_info || []}
        onChange={updateImportantInfo}
        placeholder="Документ: внутренний или загранпаспорт"
      />

      <MemoProgramField
        value={form.program || []}
        onChange={updateProgram}
        tourSlug={tourSlug}
      />

      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 sm:p-5">
        <div className="space-y-2">
          <Label htmlFor="tour-youtube-title">Заголовок блока с YouTube-видео</Label>
          <Input
            id="tour-youtube-title"
            value={form.youtube_title || ""}
            onChange={(event) => update("youtube_title", event.target.value)}
            placeholder="Видео о туре"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tour-youtube-url">Ссылка или код YouTube-видео</Label>
          <Textarea
            id="tour-youtube-url"
            value={form.youtube_url || ""}
            onChange={(event) => update("youtube_url", event.target.value)}
            rows={3}
            placeholder="Ссылка YouTube, ID видео или стандартный <iframe> код"
            aria-describedby="tour-youtube-hint"
          />
          <p id="tour-youtube-hint" className="text-xs leading-5 text-neutral-500">
            Видео загружается только после нажатия посетителя и не блокирует первоначальную загрузку страницы.
            Оставьте ссылку пустой, чтобы скрыть весь блок.
          </p>
          {form.youtube_url?.trim() && !getYoutubeVideoId(form.youtube_url) && (
            <p role="status" className="text-sm text-red-700">Не удалось определить YouTube-видео. Проверьте ссылку или код.</p>
          )}
        </div>
        {getYoutubeVideoId(form.youtube_url) && (
          <div className="max-w-xl">
            <LazyYoutubeEmbed
              key={getYoutubeVideoId(form.youtube_url)}
              value={form.youtube_url}
              title={form.youtube_title?.trim() || "Видео о туре"}
            />
          </div>
        )}
      </div>

      <TourVideosField value={form.videos || []} onChange={updateVideos} />

      <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Label className="text-base font-semibold text-neutral-900">
              Отели, номера и цепочки
            </Label>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">
              {form.use_hotel_chains
                ? "Включён расширенный режим: даты задаются внутри цепочек и привязываются к отелям и номерам."
                : "Режим «Только даты»: добавляйте даты тура напрямую, без создания отеля и номера."}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-sky-100">
            <span className="text-xs font-medium text-neutral-600">
              {form.use_hotel_chains ? "Включены" : "Выключены"}
            </span>
            <Switch
              checked={form.use_hotel_chains === true}
              onCheckedChange={handleUseHotelChainsChange}
            />
          </div>
        </div>
      </div>

      {form.use_hotel_chains ? (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label className="text-sm font-semibold">Показывать даты цепочек</Label>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-neutral-500">
                Выключите для туров, где основные даты уже заполнены отдельно. Отели останутся подключёнными, а повторяющиеся даты цепочек не появятся на странице.
              </p>
            </div>
            <Switch
              checked={form.show_chain_dates !== false}
              onCheckedChange={(checked) => setForm((previous) => ({
                ...previous,
                show_chain_dates: checked,
                dates: !checked && !(previous.dates || []).length
                  ? getActiveChainDates(previous.chains)
                  : previous.dates,
              }))}
              aria-label="Показывать даты цепочек"
            />
          </div>
          {form.show_chain_dates === false && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="mb-3 text-sm font-medium text-neutral-700">Основные даты тура</p>
              <MemoDatesField
                value={form.dates || []}
                onChange={updateDates}
                tours={tours}
                currentTourSlug={tourSlug}
                defaultCurrency={form.currency || "BYN"}
                defaultPrice={form.price_from || ""}
                defaultAdditionalPrice={form.additional_price || ""}
                defaultAdditionalCurrency={form.additional_currency || form.currency || "BYN"}
              />
            </div>
          )}
          <MemoChainsField
            value={form.chains || []}
            onChange={updateChains}
            tourSlug={tourSlug}
            tours={tours}
            tourCurrency={form.currency || "BYN"}
            tourPrice={form.price_from || ""}
            tourAdditionalPrice={form.additional_price || ""}
            tourAdditionalCurrency={
              form.additional_currency || form.currency || "BYN"
            }
          />
        </>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="mb-3 text-sm text-neutral-600">
            Эти даты будут показаны на странице тура и в форме заявки без блока
            отелей и номеров.
          </p>
          <MemoDatesField
            value={form.dates || []}
            onChange={updateDates}
            tours={tours}
            currentTourSlug={tourSlug}
            defaultCurrency={form.currency || "BYN"}
            defaultPrice={form.price_from || ""}
            defaultAdditionalPrice={form.additional_price || ""}
            defaultAdditionalCurrency={
              form.additional_currency || form.currency || "BYN"
            }
          />
        </div>
      )}

      <RelatedToursField
        value={form.related_tour_slugs || []}
        onChange={updateRelatedTours}
        tours={tours}
        currentSlug={tourSlug}
        title={form.related_tours_title || ""}
        onTitleChange={(related_tours_title) =>
          update("related_tours_title", related_tours_title)
        }
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

function TourVideosField({ value = [], onChange }) {
  const items = Array.isArray(value) ? value : [];

  const updateItem = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Видео о туре</Label>
        <p className="mt-1 text-xs text-neutral-500">
          Добавьте ссылку YouTube. На странице сначала показывается только
          обложка; видеоплеер загружается после нажатия посетителя.
        </p>
      </div>

      {items.map((video, index) => (
        <div
          key={video.id || index}
          className="space-y-3 rounded-xl border border-neutral-200 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              value={video.url || ""}
              onChange={(event) => updateItem(index, { url: event.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              <X className="size-4" />
            </Button>
          </div>
          <Input
            value={video.title || ""}
            onChange={(event) => updateItem(index, { title: event.target.value })}
            placeholder="Название видео"
          />
          <RichTextarea
            value={video.description || ""}
            onChange={(description) => updateItem(index, { description })}
            rows={3}
            placeholder="Короткое описание (необязательно)"
          />
          <ImageInput
            value={video.cover || ""}
            onChange={(cover) => updateItem(index, { cover })}
          />
          <Input
            value={video.cover_alt || ""}
            onChange={(event) =>
              updateItem(index, { cover_alt: event.target.value })
            }
            placeholder="ALT обложки видео"
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          onChange([
            ...items,
            {
              id: uid(),
              title: "",
              url: "",
              cover: "",
              cover_alt: "",
              description: "",
            },
          ])
        }
      >
        <Plus className="mr-1 size-4" /> Добавить видео
      </Button>
    </div>
  );
}

function RelatedToursField({
  value = [],
  onChange,
  tours = [],
  currentSlug = "",
  title = "",
  onTitleChange,
}) {
  const [draggedSlug, setDraggedSlug] = useState("");
  const selected = Array.isArray(value) ? value.map(String) : [];
  const available = tours.filter(
    (tour) =>
      tour?.slug &&
      tour.slug !== currentSlug &&
      tour.active !== false &&
      !selected.includes(String(tour.slug)),
  );
  const toursBySlug = new Map(
    tours.filter((tour) => tour?.slug).map((tour) => [String(tour.slug), tour]),
  );

  const move = (fromSlug, toSlug) => {
    const fromIndex = selected.indexOf(fromSlug);
    const toIndex = selected.indexOf(toSlug);
    if (fromIndex < 0 || toIndex < 0) return;
    onChange(reorderArray(selected, fromIndex, toIndex));
  };

  return (
    <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/30 p-4">
      <div>
        <Label>Рекомендуемые туры</Label>
        <p className="mt-1 text-xs text-neutral-500">
          Выберите туры вручную и перетащите выбранные карточки в нужном
          порядке. Блок появится перед FAQ.
        </p>
      </div>
      <Input
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Туры, которые вас также могут заинтересовать"
      />
      {selected.length > 0 && (
        <div className="space-y-2">
          {selected.map((slug) => {
            const tour = toursBySlug.get(slug);
            return (
              <div
                key={slug}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  move(draggedSlug, slug);
                  setDraggedSlug("");
                }}
                className={`flex items-center gap-3 rounded-lg border bg-white p-3 ${
                  draggedSlug === slug ? "opacity-50" : ""
                }`}
              >
                <span draggable onDragStart={() => setDraggedSlug(slug)} onDragEnd={() => setDraggedSlug("")} className="cursor-grab text-neutral-400" title="Перетащить тур">☰</span>
                <span className="min-w-0 flex-1 text-sm">
                  {tour?.title || `${slug} (тур не найден)`}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onChange(selected.filter((item) => item !== slug))}
                >
                  <X className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      <select
        value=""
        onChange={(event) => {
          if (event.target.value) onChange([...selected, event.target.value]);
        }}
        className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
      >
        <option value="">Добавить тур…</option>
        {available.map((tour) => (
          <option key={tour.slug} value={tour.slug}>
            {tour.title || tour.slug}
          </option>
        ))}
      </select>
    </div>
  );
}

function StringListField({ label, value, onChange, placeholder, rich = false }) {
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
            {rich ? <div className="min-w-0 flex-1"><RichTextarea compact rows={2} value={item} placeholder={placeholder} onChange={(text) => updateItem(index, text)} /></div> : <Input
              value={item}
              placeholder={placeholder}
              onChange={(e) => updateItem(index, e.target.value)}
            />}
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

function ImageListField({
  label,
  value,
  onChange,
  altValue = [],
  onAltChange,
  onItemsChange,
}) {
  const sourceItems = Array.isArray(value) ? value : [];
  const items = sourceItems.length ? sourceItems : [""];
  const alts = Array.isArray(altValue) ? altValue : [];
  const editsAlt = typeof onAltChange === "function";
  const [draggedIndex, setDraggedIndex] = useState(null);

  const commit = (nextImages, nextAlts) => {
    if (typeof onItemsChange === "function") {
      onItemsChange(nextImages, nextAlts);
      return;
    }
    onChange(nextImages);
    if (editsAlt) onAltChange(nextAlts);
  };

  const updateItem = (index, text) => {
    const next = [...items];
    next[index] = text;
    commit(next, next.map((_, itemIndex) => alts[itemIndex] || ""));
  };

  const addItem = () => {
    commit(
      [...items, ""],
      [...items.map((_, index) => alts[index] || ""), ""],
    );
  };

  const removeItem = (index) => {
    const remaining = items
      .map((image, itemIndex) => ({ image, alt: alts[itemIndex] || "" }))
      .filter((_, itemIndex) => itemIndex !== index)
      .filter((item) => Boolean(item.image));
    commit(
      remaining.map((item) => item.image),
      remaining.map((item) => item.alt),
    );
  };

  const moveItem = (fromIndex, toIndex) => {
    const filledItems = items
      .map((image, index) => ({ image, alt: alts[index] || "" }))
;
    const moved = reorderArray(filledItems, fromIndex, toIndex);
    commit(
      moved.map((item) => item.image),
      moved.map((item) => item.alt),
    );
  };

  return (
    <div>
      <Label>{label}</Label>

      <div className="mt-2 space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();

              if (draggedIndex === null) return;
              if (!items[draggedIndex]) return;
              if (!item) return;

              moveItem(draggedIndex, index);
              setDraggedIndex(null);
            }}
            className={`flex flex-col sm:flex-row gap-2 items-start rounded-xl transition ${
              draggedIndex === index ? "opacity-50 ring-2 ring-[#C2410C]" : ""
            }`}
          >
            <div className="flex w-full sm:w-auto items-center gap-2">
              <button
                type="button"
                draggable={!!item}
                onDragStart={() => setDraggedIndex(index)}
                onDragEnd={() => setDraggedIndex(null)}
                className="cursor-grab rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500 active:cursor-grabbing"
                title="Перетащить фото"
              >
                ☰
              </button>

              <span className="w-6 shrink-0 text-xs text-neutral-400">
                {index + 1}
              </span>
            </div>

            <div className="w-full min-w-0 space-y-2">
              <ImageInput value={item} onChange={(v) => updateItem(index, v)} />
              {editsAlt && (
                <Input
                  value={alts[index] || ""}
                  onChange={(event) => {
                    const next = items.map((_, itemIndex) => alts[itemIndex] || "");
                    next[index] = event.target.value;
                    commit(items, next);
                  }}
                  placeholder="ALT: кратко опишите, что изображено"
                />
              )}
            </div>

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

function ImageInput({ value, onChange }) {
  const latestChange = useRef(onChange);
  latestChange.current = onChange;
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file || hasPendingUploads()) return;

    try {
      setUploading(true);
      const url = await uploadImage(file);
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

function ProgramField({ value, onChange, tourSlug }) {
  const items = value.length
    ? value
    : [
        {
          day: "1",
          title: "",
          description: "",
          anchor: "",
          image: "",
          images: [],
          image_alts: [],
          notes: "",
        },
      ];

  const updateItem = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const updateImages = (index, images, imageAlts = []) => {
    const nextImages = Array.isArray(images) ? images : [];

    updateItem(index, {
      images: nextImages,
      image: nextImages.find(Boolean) || "",
      image_alts: Array.isArray(imageAlts) ? imageAlts : [],
    });
  };

  const addItem = () =>
    onChange([
      ...items,
      {
        day: String(items.length + 1),
        title: "",
        description: "",
        anchor: "",
        image: "",
        images: [],
        image_alts: [],
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

            <AnchorAdminField
              label="Рекламный якорь этого дня программы"
              value={item.anchor || ""}
              onChange={(anchor) => updateItem(index, { anchor })}
              tourSlug={tourSlug}
              placeholder={`Например: den-${item.day || index + 1}`}
            />

            <ImageListField
              label="Фото дня"
              value={getProgramItemImages(item)}
              onChange={(images) => updateImages(index, images)}
              altValue={item.image_alts || []}
              onAltChange={(imageAlts) =>
                updateImages(index, getProgramItemImages(item), imageAlts)
              }
              onItemsChange={(images, imageAlts) =>
                updateImages(index, images, imageAlts)
              }
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
  tours = [],
  currentTourSlug = "",
  defaultCurrency = "BYN",
  defaultPrice = "",
  defaultAdditionalPrice = "",
  defaultAdditionalCurrency = "BYN",
  roomPricingMode = false,
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
          special_active: false,
          special_label: "",
          special_tour_slug: "",
          special_cta_label: "",
          promotion_active: false,
          promotion_price: "",
          promotion_currency: defaultCurrency,
          promotion_additional_price: "",
          promotion_additional_currency:
            defaultAdditionalCurrency || defaultCurrency,
        },
      ];
  const specialTourOptions = (Array.isArray(tours) ? tours : []).filter(
    (tour) =>
      tour?.slug &&
      String(tour.slug) !== String(currentTourSlug) &&
      tour.active !== false,
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
        start: "",
        end: "",
        price: defaultPrice || "",
        currency: defaultCurrency,
        price_type: "from",
        status: "active",
        comment: "",
        special_active: false,
        special_label: "",
        special_tour_slug: "",
        special_cta_label: "",
        promotion_active: false,
        promotion_price: "",
        promotion_currency: defaultCurrency,
        promotion_additional_price: "",
        promotion_additional_currency:
          defaultAdditionalCurrency || defaultCurrency,
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
            className={`rounded-xl border p-3 space-y-3 transition ${
              item.special_active
                ? "border-amber-300 bg-amber-50/50"
                : item.promotion_active
                ? "border-rose-200 bg-rose-50/40"
                : "border-neutral-200 bg-white"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-neutral-500">
                  Дата {index + 1}
                </p>
                {item.promotion_active && (
                  <p className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                    Акционная дата
                  </p>
                )}
                {item.special_active && (
                  <p className="mt-1 ml-1 inline-flex rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                    {item.special_label || "Особая дата"}
                  </p>
                )}
              </div>

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

            <div>
              <Label className="text-xs">Примечание к дате</Label>
              <Input value={item.comment || ""} onChange={(event) => updateItem(index, { comment: event.target.value })} placeholder="Например: Рождество или закрытие фонтанов" className="mt-1" />
            </div>

            <div className="rounded-xl border border-amber-200 bg-white p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label className="text-sm font-semibold text-neutral-900">
                    Особая дата
                  </Label>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                    Выделяет этот выезд и при необходимости добавляет переход
                    на отдельную программу.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2">
                  <span className="text-xs font-medium text-neutral-600">
                    {item.special_active ? "Включена" : "Выключена"}
                  </span>
                  <Switch
                    checked={item.special_active === true}
                    onCheckedChange={(special_active) =>
                      updateItem(index, { special_active })
                    }
                  />
                </div>
              </div>

              {item.special_active && (
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div>
                    <Label className="text-xs">Короткая метка</Label>
                    <Input
                      value={item.special_label || ""}
                      maxLength={80}
                      onChange={(event) =>
                        updateItem(index, {
                          special_label: event.target.value,
                        })
                      }
                      placeholder="Например: Фестиваль тюльпанов"
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-neutral-500">
                      Можно написать любую метку. Если оставить пустой,
                      появится «Особая дата».
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs">Связанная программа</Label>
                    <select
                      value={item.special_tour_slug || ""}
                      onChange={(event) =>
                        updateItem(index, {
                          special_tour_slug: event.target.value,
                        })
                      }
                      className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                    >
                      <option value="">Без перехода на другой тур</option>
                      {specialTourOptions.map((tour) => (
                        <option key={tour.slug} value={tour.slug}>
                          {tour.title || tour.slug}
                        </option>
                      ))}
                    </select>
                  </div>

                  {item.special_tour_slug && (
                    <div className="lg:col-span-2">
                      <Label className="text-xs">Текст кнопки</Label>
                      <Input
                        value={item.special_cta_label || ""}
                        maxLength={80}
                        onChange={(event) =>
                          updateItem(index, {
                            special_cta_label: event.target.value,
                          })
                        }
                        placeholder="Смотреть специальную программу"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <div>
                <Label className="text-xs">Цена</Label>
                <Input
                  type="number"
                  value={item.price ?? ""}
                  placeholder="Цена"
                  onChange={(e) =>
                    updateItem(index, {
                      price:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
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

            <div className="rounded-xl border border-rose-100 bg-white p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label className="text-sm font-semibold text-neutral-900">
                    Акционная дата
                  </Label>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                    {roomPricingMode
                      ? "Включите акцию для этой даты. Сниженные цены по номерам и типам питания задаются ниже, в прайслисте каждого номера."
                      : "Включите, чтобы на сайте старая цена была зачёркнута, а рядом показалась новая."}
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-neutral-50 px-3 py-2">
                  <span className="text-xs font-medium text-neutral-600">
                    {item.promotion_active ? "Включена" : "Выключена"}
                  </span>
                  <Switch
                    checked={item.promotion_active === true}
                    onCheckedChange={(promotion_active) =>
                      updateItem(index, {
                        promotion_active,
                        promotion_currency:
                          item.promotion_currency ||
                          item.currency ||
                          defaultCurrency,
                        promotion_additional_currency:
                          item.promotion_additional_currency ||
                          defaultAdditionalCurrency ||
                          defaultCurrency,
                      })
                    }
                  />
                </div>
              </div>

              {item.promotion_active && !roomPricingMode && (
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-lg bg-rose-50/70 p-3">
                    <Label className="text-xs">Новая основная цена</Label>
                    <div className="mt-1 grid grid-cols-[minmax(0,1fr)_92px] gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={item.promotion_price ?? ""}
                        placeholder={
                          item.price ? `Было ${item.price}` : "Новая цена"
                        }
                        onChange={(e) =>
                          updateItem(index, {
                            promotion_price:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          })
                        }
                      />

                      <Select
                        value={
                          item.promotion_currency ||
                          item.currency ||
                          defaultCurrency
                        }
                        onValueChange={(promotion_currency) =>
                          updateItem(index, { promotion_currency })
                        }
                      >
                        <SelectTrigger>
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
                  </div>

                  <div className="rounded-lg bg-rose-50/70 p-3">
                    <Label className="text-xs">Новая придаточная цена</Label>
                    <div className="mt-1 grid grid-cols-[minmax(0,1fr)_92px] gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={item.promotion_additional_price ?? ""}
                        placeholder={
                          defaultAdditionalPrice
                            ? `Было ${defaultAdditionalPrice}`
                            : "Если есть доплата"
                        }
                        onChange={(e) =>
                          updateItem(index, {
                            promotion_additional_price:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          })
                        }
                      />

                      <Select
                        value={
                          item.promotion_additional_currency ||
                          defaultAdditionalCurrency ||
                          item.currency ||
                          defaultCurrency
                        }
                        onValueChange={(promotion_additional_currency) =>
                          updateItem(index, { promotion_additional_currency })
                        }
                      >
                        <SelectTrigger>
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
                  </div>
                </div>
              )}

              {item.promotion_active && roomPricingMode && (
                <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50/70 px-3 py-2 text-xs leading-relaxed text-rose-800">
                  Акция включена. Новые цены появятся только у этой даты и
                  настраиваются в таблицах «Прайслист номера по датам и
                  питанию».
                </div>
              )}
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

function ChainsField({
  value,
  onChange,
  tourSlug,
  tours = [],
  tourCurrency,
  tourPrice,
  tourAdditionalPrice = "",
  tourAdditionalCurrency = "BYN",
}) {
  const [hotelCatalog, setHotelCatalog] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  useEffect(() => {
    let active = true;
    api.get("/admin/hotels")
      .then((response) => { if (active) setHotelCatalog(response.data || []); })
      .catch(() => { if (active) toast.error("Не удалось загрузить список отелей"); })
      .finally(() => { if (active) setHotelsLoading(false); });
    return () => { active = false; };
  }, []);
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
      <Label>Заезды / расписание тура</Label>
      <p className="mt-1 text-xs text-neutral-500">
        У каждого варианта свои даты, отели и номера. Номер можно отметить
        выкупленным на конкретную дату заезда.
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
                  placeholder="Например: Заезд 1 / Группа 1"
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
              tours={tours}
              currentTourSlug={tourSlug}
              defaultCurrency={tourCurrency}
              defaultPrice={tourPrice}
              defaultAdditionalPrice={tourAdditionalPrice}
              defaultAdditionalCurrency={tourAdditionalCurrency || tourCurrency}
              roomPricingMode={(chain.hotels || []).some((hotel) =>
                (hotel.rooms || []).some((room) => room.active !== false),
              )}
            />

            <MemoChainHotelsField
              value={chain.hotels || []}
              hotels={hotelCatalog}
              loading={hotelsLoading}
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

function ChainHotelsField({ value = [], hotels = [], loading = false, onChange }) {
  const [selectedId, setSelectedId] = useState("");

  const connectedIds = new Set(value.map((item) => String(item.hotel_id || item.id)));
  const available = hotels.filter((hotel) => !connectedIds.has(String(hotel.id)));
  const connect = () => {
    const hotel = hotels.find((item) => String(item.id) === selectedId);
    if (!hotel) return;
    onChange([...value, { id: hotel.id, hotel_id: hotel.id }]);
    setSelectedId("");
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Label>Подключённые отели</Label>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            Здесь отель только подключается к туру. Создание, содержание и окончательное удаление доступны в разделе «Отели».
          </p>
        </div>
        <Link to="/admin/hotels" className="shrink-0 text-xs font-medium text-[#C2410C] hover:text-[#9A3412]">
          Открыть раздел «Отели»
        </Link>
      </div>

      <div className="mt-3 space-y-2">
        {!value.length && (
          <p className="rounded-xl border border-dashed px-4 py-5 text-center text-sm text-neutral-500">
            К этой цепочке пока не подключён ни один отель.
          </p>
        )}
        {value.map((item, index) => (
          <div key={item.hotel_id || item.id || index} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3">
            {(item.images?.[0] || item.image) ? (
              <img src={mediaUrl(item.images?.[0] || item.image)} alt="" className="size-12 shrink-0 rounded-lg object-cover" loading="lazy" />
            ) : (
              <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-neutral-100 text-xs text-neutral-400">Фото</div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name || "Отель"}</p>
              <p className="truncate text-xs text-neutral-500">{item.location || `${item.rooms?.length || 0} номеров`}</p>
            </div>
            <Button type="button" variant="outline" className="shrink-0" onClick={() => onChange(value.filter((_, current) => current !== index))}>
              <X className="mr-1 size-4" /> Отключить
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <select
          aria-label="Выберите отель для подключения"
          className="h-10 min-w-0 flex-1 rounded-md border bg-white px-3 text-sm"
          value={selectedId}
          disabled={loading || !available.length}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          <option value="">{loading ? "Загрузка отелей…" : available.length ? "Выберите существующий отель" : "Все отели уже подключены"}</option>
          {available.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.name}{hotel.location ? ` — ${hotel.location}` : ""}</option>)}
        </select>
        <Button type="button" variant="outline" disabled={!selectedId} onClick={connect}>
          <Plus className="mr-1 size-4" /> Подключить
        </Button>
      </div>
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
              altValue={room.gallery_alts || []}
              onAltChange={(gallery_alts) =>
                updateItem(index, { gallery_alts })
              }
              onItemsChange={(gallery, gallery_alts) =>
                updateItem(index, { gallery, gallery_alts })
              }
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
        promotion_price: firstDefined(
          meal.promotion_price,
          meal.promotionPrice,
          priceRecord?.promotion_price,
          priceRecord?.promotionPrice,
          "",
        ),
        promotion_currency:
          meal.promotion_currency ||
          meal.promotionCurrency ||
          priceRecord?.promotion_currency ||
          priceRecord?.promotionCurrency ||
          meal.currency ||
          priceRecord?.currency ||
          defaultCurrency,
      };
    }

    return {
      price: meal.price ?? "",
      currency: meal.currency || defaultCurrency,
      promotion_price: firstDefined(
        meal.promotion_price,
        meal.promotionPrice,
        "",
      ),
      promotion_currency:
        meal.promotion_currency ||
        meal.promotionCurrency ||
        meal.currency ||
        defaultCurrency,
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
      promotion_additional_price: firstDefined(
        priceRecord?.promotion_additional_price,
        priceRecord?.promotionAdditionalPrice,
        "",
      ),
      promotion_additional_currency:
        priceRecord?.promotion_additional_currency ||
        priceRecord?.promotionAdditionalCurrency ||
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
      promotion_additional_price: current?.promotion_additional_price ?? "",
      promotion_additional_currency:
        current?.promotion_additional_currency ||
        current?.additional_currency ||
        current?.currency ||
        defaultCurrency,
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
      ) ||
      ROOM_MEAL_PLANS.some((plan) =>
        hasMealPriceValue({
          price: nextRecord.meal_prices?.[plan.key]?.promotion_price,
        }),
      ) ||
      hasMealPriceValue({ price: nextRecord.additional_price }) ||
      hasMealPriceValue({ price: nextRecord.promotion_additional_price });

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
      promotion_additional_price: current?.promotion_additional_price ?? "",
      promotion_additional_currency:
        current?.promotion_additional_currency ||
        current?.additional_currency ||
        current?.currency ||
        defaultCurrency,
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
      ) ||
      ROOM_MEAL_PLANS.some((plan) =>
        hasMealPriceValue({
          price: nextRecord.meal_prices?.[plan.key]?.promotion_price,
        }),
      ) ||
      hasMealPriceValue({ price: nextRecord.additional_price }) ||
      hasMealPriceValue({ price: nextRecord.promotion_additional_price });

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
                      <div className="flex min-w-[130px] flex-col items-start gap-1.5">
                        <span>{formatDateLabel(date)}</span>
                        {date.promotion_active === true && (
                          <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                            Акция
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="border-b border-l border-neutral-100 px-3 py-3">
                      {(() => {
                        const additional = getDateAdditionalRecord(date);

                        return (
                          <div className="space-y-2">
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

                            {date.promotion_active === true && (
                              <div className="rounded-lg border border-rose-100 bg-rose-50/70 p-2">
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                                  Доплата по акции
                                </p>
                                <div className="grid grid-cols-[minmax(90px,1fr)_82px] gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={
                                      additional.promotion_additional_price ??
                                      ""
                                    }
                                    onChange={(e) =>
                                      updateDateAdditionalPrice(date, {
                                        promotion_additional_price:
                                          e.target.value === ""
                                            ? ""
                                            : Number(e.target.value),
                                      })
                                    }
                                    placeholder="Новая доплата"
                                  />

                                  <Select
                                    value={
                                      additional.promotion_additional_currency ||
                                      additional.additional_currency ||
                                      defaultCurrency
                                    }
                                    onValueChange={(
                                      promotion_additional_currency,
                                    ) =>
                                      updateDateAdditionalPrice(date, {
                                        promotion_additional_currency,
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {currencies.map((currency) => (
                                        <SelectItem
                                          key={currency}
                                          value={currency}
                                        >
                                          {currency}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
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
                          <div className="space-y-2">
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

                            {date.promotion_active === true && (
                              <div className="rounded-lg border border-rose-100 bg-rose-50/70 p-2">
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                                  Цена по акции
                                </p>
                                <div className="grid grid-cols-[minmax(90px,1fr)_82px] gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={meal.promotion_price ?? ""}
                                    onChange={(e) =>
                                      updateMealPrice(date, plan.key, {
                                        promotion_price:
                                          e.target.value === ""
                                            ? ""
                                            : Number(e.target.value),
                                      })
                                    }
                                    placeholder="Новая цена"
                                  />

                                  <Select
                                    value={
                                      meal.promotion_currency ||
                                      meal.currency ||
                                      defaultCurrency
                                    }
                                    onValueChange={(promotion_currency) =>
                                      updateMealPrice(date, plan.key, {
                                        promotion_currency,
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {currencies.map((currency) => (
                                        <SelectItem
                                          key={currency}
                                          value={currency}
                                        >
                                          {currency}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
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
    prev.additional_price === next.additional_price &&
    prev.additional_currency === next.additional_currency &&
    prevProps.tours === nextProps.tours &&
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

export { RichTextarea, ImageListField, RoomsField, StringListField, normalizeRecord };
