import { BedDouble, Building2, Image, MapPin, SearchCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_CONTENT_CLASS = "mt-0 space-y-5 data-[state=inactive]:hidden";

function SectionIntro({ title, description }) {
  return <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
    <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
    <p className="mt-1 text-xs leading-5 text-neutral-500">{description}</p>
  </div>;
}

// Every field remains controlled by the parent editor. forceMount keeps image,
// room and rich-text controls mounted while an administrator switches tabs.
export default function HotelProfileFields({ value, onChange, dates = [], RichEditor, ImagesEditor, RoomsEditor, ListEditor, showName = false }) {
  const text = (key, label, placeholder = "") => <label className="block space-y-1" key={key}><span className="text-xs font-medium">{label}</span><Input value={value[key] || ""} onChange={(e) => onChange({ [key]: e.target.value })} placeholder={placeholder} /></label>;
  const rich = (key, label) => <div className="space-y-1" key={key}><Label>{label}</Label><RichEditor value={value[key] || ""} onChange={(next) => onChange({ [key]: next })} placeholder={label} /></div>;

  return <Tabs defaultValue="main" className="min-w-0" data-testid="hotel-profile-fields">
    <div className="sticky top-0 z-20 -mx-5 mb-5 overflow-x-auto border-y border-neutral-200 bg-white/95 px-5 py-2 backdrop-blur sm:-mx-7 sm:px-7">
      <TabsList className="h-auto w-max min-w-full justify-start gap-1 bg-neutral-100 p-1">
        <TabsTrigger value="main" className="gap-1.5 px-3 py-2"><Building2 className="size-4" />Основное</TabsTrigger>
        <TabsTrigger value="media" className="gap-1.5 px-3 py-2"><Image className="size-4" />Фото и видео</TabsTrigger>
        <TabsTrigger value="rooms" className="gap-1.5 px-3 py-2"><BedDouble className="size-4" />Номера</TabsTrigger>
        <TabsTrigger value="details" className="gap-1.5 px-3 py-2"><MapPin className="size-4" />Условия</TabsTrigger>
        <TabsTrigger value="publishing" className="gap-1.5 px-3 py-2"><SearchCheck className="size-4" />Страница и SEO</TabsTrigger>
      </TabsList>
    </div>

    <TabsContent forceMount value="main" className={TAB_CONTENT_CLASS} data-testid="hotel-tab-main">
      <SectionIntro title="Основная информация" description="Название и тексты, которые знакомят посетителя с отелем в туре и на отдельной странице." />
      {showName && text("name", "Название отеля", "Например: Smile")}
      {rich("short_description", "Коротко об отеле")}
      {rich("description", "Описание отеля")}
      <div className="grid gap-3 sm:grid-cols-2">
        {text("meal", "Питание", "Завтраки, полупансион…")}
        {text("location", "Курорт / расположение", "Грузия, Кобулети")}
      </div>
    </TabsContent>

    <TabsContent forceMount value="media" className={TAB_CONTENT_CLASS} data-testid="hotel-tab-media">
      <SectionIntro title="Фотографии и видео" description="Первое фото используется как главное. Остальные посетитель сможет листать в галерее." />
      <ImagesEditor label="Фото отеля" value={value.images || (value.image ? [value.image] : [])} altValue={value.image_alts || []}
        onChange={(images) => onChange({ images, image: images[0] || "" })}
        onAltChange={(image_alts) => onChange({ image_alts })}
        onItemsChange={(images, image_alts) => onChange({ images, image: images[0] || "", image_alts })} />
      <div className="rounded-xl border border-neutral-200 p-4 space-y-4">
        {text("youtube_title", "Заголовок видео")}
        {text("youtube_url", "Ссылка на YouTube", "Ссылка, ID или код iframe")}
        <p className="text-xs text-neutral-500">Видео загружается только после нажатия посетителя и не замедляет первоначальное открытие страницы.</p>
      </div>
    </TabsContent>

    <TabsContent forceMount value="rooms" className={TAB_CONTENT_CLASS} data-testid="hotel-tab-rooms">
      <SectionIntro title="Номера и стоимость" description="Добавьте категории номеров, фотографии, описание и цены для доступных дат связанных туров." />
      <RoomsEditor value={value.rooms || []} dates={dates} onChange={(rooms) => onChange({ rooms })} />
    </TabsContent>

    <TabsContent forceMount value="details" className={TAB_CONTENT_CLASS} data-testid="hotel-tab-details">
      <SectionIntro title="Питание, расположение и условия" description="Подробности проживания, инфраструктура отеля и полезные ориентиры для туриста." />
      {rich("meal_description", "Подробнее о питании")}
      <div className="grid gap-3 sm:grid-cols-2">
        {text("address", "Адрес")}
        {text("map_url", "Ссылка на карту", "https://…")}
      </div>
      {rich("location_description", "Расположение и окрестности")}
      <ListEditor label="Удобства и услуги" value={value.amenities || []} onChange={(amenities) => onChange({ amenities })} placeholder="Wi-Fi, бассейн, парковка…" />
      <ListEditor label="Что находится рядом" value={value.nearby || []} onChange={(nearby) => onChange({ nearby })} placeholder="Пляж — 200 м, набережная — 5 минут…" />
      {rich("beach", "Пляж и расстояние до моря")}
      {rich("transfer", "Трансфер и дорога до отеля")}
      <div className="grid gap-3 sm:grid-cols-2">
        {text("check_in", "Время заезда", "После 14:00")}
        {text("check_out", "Время выезда", "До 12:00")}
      </div>
      {rich("rules", "Условия проживания и важная информация")}
    </TabsContent>

    <TabsContent forceMount value="publishing" className={TAB_CONTENT_CLASS} data-testid="hotel-tab-publishing">
      <SectionIntro title="Страница, публикация и SEO" description="Адрес страницы и настройки поисковой индексации. Обычно достаточно оставить SEO-поля пустыми." />
      {text("hotel_slug", "Адрес страницы отеля", "Оставьте пустым для автоматического адреса")}
      {value.hotel_page_slug && <p className="break-all rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">/hotels/{value.hotel_page_slug}</p>}
      {text("seo_title", "SEO-заголовок")}
      {text("seo_description", "Описание для поиска")}
      {text("seo_canonical_url", "Основной адрес (canonical)", "Обычно оставляют пустым")}
      <div className="space-y-3 rounded-xl border border-neutral-200 p-4">
        {[['active', 'Показывать отель и его номера в туре', true], ['page_enabled', 'Отдельная страница отеля и кнопка в туре', true], ['seo_noindex', 'Запретить индексацию страницы', false], ['seo_nofollow', 'Запретить переход поисковых роботов по ссылкам', false]].map(([key, label, fallback]) =>
          <label key={key} className="flex items-center gap-3 text-sm"><Switch checked={value[key] ?? fallback} onCheckedChange={(next) => onChange({ [key]: next })} />{label}</label>)}
      </div>
    </TabsContent>
  </Tabs>;
}
