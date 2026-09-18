import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Both editors use these fields and save the very same hotel inside its tour.
export default function HotelProfileFields({ value, onChange, dates = [], RichEditor, ImagesEditor, RoomsEditor, ListEditor, showName = false }) {
  const text = (key, label, placeholder = "") => <label className="block space-y-1" key={key}><span className="text-xs font-medium">{label}</span><Input value={value[key] || ""} onChange={(e) => onChange({ [key]: e.target.value })} placeholder={placeholder} /></label>;
  const rich = (key, label) => <div className="space-y-1" key={key}><Label>{label}</Label><RichEditor value={value[key] || ""} onChange={(next) => onChange({ [key]: next })} placeholder={label} /></div>;
  return <div className="space-y-5" data-testid="hotel-profile-fields">
    {showName && text("name", "Название отеля", "Например: Smile")}
    {rich("short_description", "Коротко об отеле")}
    {rich("description", "Описание отеля")}
    <ImagesEditor label="Фото отеля" value={value.images || (value.image ? [value.image] : [])} altValue={value.image_alts || []}
      onChange={(images) => onChange({ images, image: images[0] || "" })}
      onAltChange={(image_alts) => onChange({ image_alts })}
      onItemsChange={(images, image_alts) => onChange({ images, image: images[0] || "", image_alts })} />
    <div className="grid gap-3 sm:grid-cols-2">{text("meal", "Питание", "Завтраки, полупансион…")}{text("location", "Курорт / расположение", "Грузия, Кобулети")}</div>
    <details className="rounded-xl border border-neutral-200 p-4">
      <summary className="cursor-pointer text-sm font-medium">Подробнее об отеле: питание, удобства и места рядом</summary>
      <div className="mt-4 space-y-5">
        {rich("meal_description", "Подробнее о питании")}
        <div className="grid gap-3 sm:grid-cols-2">{text("address", "Адрес")}{text("map_url", "Ссылка на карту", "https://…")}</div>
        {rich("location_description", "Расположение и окрестности")}
        <ListEditor label="Удобства и услуги" value={value.amenities || []} onChange={(amenities) => onChange({ amenities })} placeholder="Wi-Fi, бассейн, парковка…" />
        <ListEditor label="Что находится рядом" value={value.nearby || []} onChange={(nearby) => onChange({ nearby })} placeholder="Пляж — 200 м, набережная — 5 минут…" />
        {rich("beach", "Пляж и расстояние до моря")}{rich("transfer", "Трансфер и дорога до отеля")}
        <div className="grid gap-3 sm:grid-cols-2">{text("check_in", "Время заезда", "После 14:00")}{text("check_out", "Время выезда", "До 12:00")}</div>
        {rich("rules", "Условия проживания и важная информация")}
        {text("youtube_title", "Заголовок видео")}{text("youtube_url", "Ссылка на YouTube", "Ссылка, ID или код iframe")}
        <p className="text-xs text-neutral-500">Видео загружается только после нажатия посетителя.</p>
      </div>
    </details>
    <RoomsEditor value={value.rooms || []} dates={dates} onChange={(rooms) => onChange({ rooms })} />
    <details className="rounded-xl border border-neutral-200 p-4">
      <summary className="cursor-pointer text-sm font-medium">Страница отеля, SEO и публикация</summary>
      <div className="mt-4 space-y-4">
        {text("hotel_slug", "Адрес страницы отеля", "Оставьте пустым для автоматического адреса")}
        {value.hotel_page_slug && <p className="break-all text-xs text-neutral-500">/hotels/{value.hotel_page_slug}</p>}
        {text("seo_title", "SEO-заголовок")}{text("seo_description", "Описание для поиска")}
        {text("seo_canonical_url", "Основной адрес (canonical)", "Обычно оставляют пустым")}
        {[['active', 'Показывать отель и его номера в туре', true], ['page_enabled', 'Отдельная страница отеля и кнопка в туре', true], ['seo_noindex', 'Запретить индексацию страницы', false], ['seo_nofollow', 'Запретить переход поисковых роботов по ссылкам', false]].map(([key, label, fallback]) =>
          <label key={key} className="flex items-center gap-3 text-sm"><Switch checked={value[key] ?? fallback} onCheckedChange={(next) => onChange({ [key]: next })} />{label}</label>)}
      </div>
    </details>
  </div>;
}
