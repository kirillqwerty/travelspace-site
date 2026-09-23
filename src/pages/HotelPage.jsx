import ResponsiveLink from "@/components/ResponsiveLink";
import { lazy, Suspense, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BedDouble, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, MapPin, Utensils, Waves } from "lucide-react";
import { usePublicRecord } from "@/lib/usePublicRecord";
import { mediaUrl, optimizedMediaUrl } from "@/lib/media";
import { RichText, richTextToPlain } from "@/lib/richText";
import { getYoutubeVideoId } from "@/lib/youtube";
import { Button } from "@/components/ui/button";
import PageSeo from "@/components/PageSeo";
import PageLoadState from "@/components/PageLoadState";
import LazyYoutubeEmbed from "@/components/LazyYoutubeEmbed";

const LeadDialog = lazy(() => import("@/components/LeadDialog"));

function PhotoGallery({ images = [], alts = [], name, eager = false }) {
  const [selected, setSelected] = useState(0);
  const photos = images.filter(Boolean);
  if (!photos.length) return null;
  const index = Math.min(selected, photos.length - 1);
  return <div>
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100 sm:aspect-[16/9]">
      <img src={optimizedMediaUrl(photos[index], eager ? 1200 : 800)} alt={alts[index] || name} width="1200" height="900" className="h-full w-full object-cover" loading={eager ? "eager" : "lazy"} fetchpriority={eager ? "high" : "auto"} decoding="async" />
      {photos.length > 1 && <>
        <button type="button" aria-label="Предыдущее фото" onClick={() => setSelected((index - 1 + photos.length) % photos.length)} className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><ChevronLeft className="size-5" /></button>
        <button type="button" aria-label="Следующее фото" onClick={() => setSelected((index + 1) % photos.length)} className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><ChevronRight className="size-5" /></button>
      </>}
      {photos.length > 1 && <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white">{index + 1} / {photos.length}</div>}
    </div>
    {photos.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label={`Фотографии: ${name}`}>{photos.map((photo, photoIndex) => <button type="button" key={`${photo}-${photoIndex}`} onClick={() => setSelected(photoIndex)} aria-label={`Фото ${photoIndex + 1}: ${name}`} aria-pressed={index === photoIndex} className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 p-0.5 ${index === photoIndex ? "border-[#C2410C]" : "border-transparent"}`}><img src={optimizedMediaUrl(photo, 160)} alt="" className="h-full w-full rounded object-cover" width="80" height="56" loading="lazy" /></button>)}</div>}
  </div>;
}

const formatStay = (date) => {
  const format = (value) => {
    const parsed = new Date(`${String(value || "").slice(0, 10)}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const start = format(date?.start);
  const end = format(date?.end);
  return end && end !== start ? `${start} — ${end}` : start;
};

function TourOptions({ connections, selectedId, onSelect, id, compact = false }) {
  if (!connections.length) return <div id={id} className="rounded-2xl border border-dashed border-neutral-300 bg-white p-5 text-sm leading-6 text-neutral-500">Отель пока не подключён к опубликованной программе. Менеджер подскажет доступные варианты проживания.</div>;
  return <div id={id} className="scroll-mt-28">
    <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">Выберите программу и даты</p>
    <div className="mt-3 space-y-2">
      {connections.map((connection) => {
        const selected = connection.id === selectedId;
        const dates = (connection.dates || []).filter((date) => date.status !== "hidden" && date.status !== "sold_out");
        return <button key={connection.id} type="button" onClick={() => onSelect(connection.id)} aria-pressed={selected} className={`w-full rounded-2xl border p-4 text-left transition ${selected ? "border-orange-300 bg-orange-50 shadow-sm" : "border-neutral-200 bg-white hover:border-orange-200"}`}>
          <span className="flex items-start justify-between gap-3"><span className="text-sm font-semibold leading-5 text-neutral-900">{connection.tour_title}</span><span className={`mt-0.5 size-4 shrink-0 rounded-full border-4 ${selected ? "border-[#C2410C] bg-white" : "border-neutral-300"}`} /></span>
          {!compact && connection.tour_tagline && <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-neutral-500">{connection.tour_tagline}</span>}
          <span className="mt-2 flex items-start gap-1.5 text-xs text-neutral-600"><CalendarDays className="mt-0.5 size-3.5 shrink-0 text-[#C2410C]" /><span>{dates.length ? dates.slice(0, 3).map(formatStay).filter(Boolean).join(" · ") : "Уточните ближайшие даты у менеджера"}{dates.length > 3 ? ` · ещё ${dates.length - 3}` : ""}</span></span>
        </button>;
      })}
    </div>
  </div>;
}

function DetailSection({ title, text, children, id }) {
  if (!text && !children) return null;
  return <section id={id} className="scroll-mt-28 border-t border-neutral-200 pt-7"><h2 className="font-heading text-2xl font-semibold">{title}</h2>{text && <RichText text={text} className="mt-4 text-[15px] leading-7 text-neutral-600" />}{children}</section>;
}

export default function HotelPage() {
  const { slug } = useParams();
  const { record: hotel, notFound, failed, retry } = usePublicRecord("hotels", slug);
  const [inquiry, setInquiry] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  if (notFound) return <div className="section-container py-20 text-center"><PageSeo title="Отель не найден | TRAVELSPACE" path={`/hotels/${slug}`} noIndex /><h1 className="font-heading text-3xl">Отель не найден</h1><Link className="mt-5 inline-block text-[#C2410C]" to="/tours">Перейти к турам</Link></div>;
  if (!hotel) return <PageLoadState failed={failed} retry={retry} />;
  const hotelImages = hotel.images?.length ? hotel.images : hotel.image ? [hotel.image] : [];
  const rooms = (hotel.rooms || []).filter((room) => room.active !== false);
  const connections = hotel.connections?.length ? hotel.connections : hotel.tour_slug ? [{ id: hotel.tour_id || hotel.tour_slug, tour_id: hotel.tour_id, tour_slug: hotel.tour_slug, tour_title: hotel.tour_title, tour_hotel_anchor: hotel.tour_hotel_anchor, dates: hotel.dates || [] }] : [];
  const selectedConnection = connections.find((connection) => connection.id === selectedConnectionId) || connections[0];
  const tourPath = selectedConnection ? `/tours/${selectedConnection.tour_slug}` : "/tours";
  const pricesPath = selectedConnection ? `${tourPath}#${selectedConnection.tour_hotel_anchor || "dates-prices"}` : "/tours";
  const description = richTextToPlain(hotel.seo_description || hotel.short_description || hotel.description || `${hotel.name}: номера, питание и расположение.`);
  const hasVideo = getYoutubeVideoId(hotel.youtube_url);
  return <article className="section-container pb-12 pt-24 lg:pt-28" data-testid="hotel-page">
    <PageSeo pageKey="hotel" title={hotel.seo_title || `${hotel.name} | TRAVELSPACE`} description={description} image={hotel.seo_image || hotelImages[0]} path={`/hotels/${hotel.slug}`} canonical={hotel.seo_canonical_url} noIndex={hotel.seo_noindex === true} noFollow={hotel.seo_nofollow === true} structuredData={{ "@type": "Hotel", name: hotel.name, description, image: hotelImages[0] ? mediaUrl(hotelImages[0]) : undefined, address: hotel.address || hotel.location || undefined }} />
    <Link to={selectedConnection ? pricesPath : "/tours"} className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5 text-sm text-neutral-600 transition hover:border-orange-200 hover:text-[#C2410C]" data-testid="hotel-return-to-tour" data-navigation-back="true"><ArrowLeft className="size-4 shrink-0" />{selectedConnection ? "Вернуться к выбранному туру" : "Вернуться к турам"}</Link>
    <div className="mt-7 max-w-4xl"><p className="text-xs uppercase tracking-[0.16em] text-[#C2410C]">Проживание в путешествии</p><h1 className="mt-2 break-words font-heading text-4xl font-semibold sm:text-5xl">{hotel.name}</h1>{hotel.location && <p className="mt-3 flex items-center gap-2 text-sm text-neutral-500"><MapPin className="size-4 shrink-0" />{hotel.location}</p>}{hotel.short_description && <RichText text={hotel.short_description} className="mt-4 text-lg leading-7 text-neutral-600" />}</div>
    <div className="mt-5 flex flex-wrap gap-3 lg:hidden"><a href="#hotel-tours-mobile" className="inline-flex items-center gap-2 rounded-full bg-[#C2410C] px-5 py-2.5 text-sm font-medium text-white">Даты и цены<ArrowRight className="size-4" /></a><Button variant="outline" className="rounded-full" onClick={() => setInquiry({})}>Задать вопрос</Button></div>
    <div className="mt-6 lg:hidden"><TourOptions id="hotel-tours-mobile" connections={connections} selectedId={selectedConnection?.id} onSelect={setSelectedConnectionId} />{selectedConnection && <div className="mt-3 grid gap-2 sm:grid-cols-2"><Link to={pricesPath} className="flex items-center justify-center gap-2 rounded-full bg-[#C2410C] px-5 py-3 text-sm font-medium text-white">Открыть даты и цены<ArrowRight className="size-4" /></Link><Link to={tourPath} className="flex items-center justify-center rounded-full border border-neutral-200 bg-white px-5 py-3 text-center text-sm text-neutral-700">Посмотреть программу тура</Link></div>}</div>
    <div className="mt-7 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
      <div className="min-w-0 space-y-8">
        <PhotoGallery key={hotel.id} images={hotelImages} alts={hotel.image_alts} name={hotel.name} eager />
        <nav aria-label="Разделы отеля" className="flex flex-wrap gap-2 text-sm">{[["about-hotel", "Об отеле", !!hotel.description], ["hotel-rooms", "Номера", !!rooms.length], ["hotel-meals", "Питание", !!(hotel.meal || hotel.meal_description)], ["hotel-location", "Расположение", !!(hotel.location_description || hotel.address || hotel.nearby?.length)]].filter(([, , visible]) => visible).map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-full border border-neutral-200 px-4 py-2 text-neutral-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#C2410C]">{label}</a>)}</nav>
        <DetailSection id="about-hotel" title="Об отеле" text={hotel.description} />
        {!!hotel.amenities?.length && <DetailSection title="Удобства и услуги"><ul className="mt-4 grid gap-3 sm:grid-cols-2">{hotel.amenities.filter(Boolean).map((item, index) => <li key={index} className="flex items-start gap-2 rounded-xl bg-stone-50 px-4 py-3 text-sm text-neutral-700"><Check className="mt-0.5 size-4 shrink-0 text-[#C2410C]" />{item}</li>)}</ul></DetailSection>}
        {!!rooms.length && <DetailSection id="hotel-rooms" title="Номера"><p className="mt-3 text-sm leading-6 text-neutral-500">Выберите подходящий вариант размещения. Стоимость и доступность зависят от даты поездки — актуальные предложения указаны в подключённых турах.</p><div className="mt-5 space-y-6">{rooms.map((room, index) => <div key={room.id || index} className="rounded-2xl border border-neutral-200 p-4 sm:p-5" data-testid="hotel-room"><h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><BedDouble className="size-5 shrink-0 text-[#C2410C]" />{room.title || room.number || `Номер ${index + 1}`}</h3><PhotoGallery images={room.gallery || []} alts={room.gallery_alts} name={room.title || "Номер отеля"} />{room.description && <RichText text={room.description} className="mt-4 text-sm leading-7 text-neutral-600" />}{getYoutubeVideoId(room.video_url) && <LazyYoutubeEmbed value={room.video_url} title={`Обзор: ${room.title || room.number || hotel.name}`} className="mt-4" />}<div className="mt-5 flex flex-wrap gap-3">{selectedConnection && <Link to={pricesPath} className="inline-flex items-center gap-2 rounded-full bg-[#C2410C] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#9A3412]">Даты и стоимость<ArrowRight className="size-4" /></Link>}<button className="rounded-full border px-5 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50" onClick={() => setInquiry(room)}>Уточнить о номере</button></div></div>)}</div></DetailSection>}
        <DetailSection id="hotel-meals" title="Питание" text={hotel.meal_description || hotel.meal} />
        {(hotel.address || hotel.location_description || hotel.nearby?.length || hotel.map_url) && <DetailSection id="hotel-location" title="Расположение и места рядом" text={hotel.location_description}>{hotel.address && <p className="mt-4 text-sm text-neutral-600">{hotel.address}</p>}{hotel.nearby?.length > 0 && <ul className="mt-4 space-y-3">{hotel.nearby.filter(Boolean).map((place, index) => <li key={index} className="flex gap-2 text-sm text-neutral-600"><MapPin className="mt-0.5 size-4 shrink-0 text-[#C2410C]" />{place}</li>)}</ul>}{/^https?:\/\//i.test(hotel.map_url || "") && <ResponsiveLink href={hotel.map_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm text-[#C2410C]"><MapPin className="size-4" />Открыть на карте</ResponsiveLink>}</DetailSection>}
        <DetailSection title="Пляж" text={hotel.beach} /><DetailSection title="Как добраться" text={hotel.transfer} />
        {hasVideo && <DetailSection title={hotel.youtube_title || "Видео об отеле"}><LazyYoutubeEmbed key={hotel.youtube_url} value={hotel.youtube_url} title={hotel.youtube_title || hotel.name} className="mt-4" /></DetailSection>}
        {(hotel.rules || hotel.check_in || hotel.check_out) && <DetailSection title="Условия проживания" text={hotel.rules}><div className="mt-4 flex flex-wrap gap-4 text-sm text-neutral-600">{hotel.check_in && <span className="flex items-center gap-2"><Clock className="size-4" />Заезд: {hotel.check_in}</span>}{hotel.check_out && <span className="flex items-center gap-2"><Clock className="size-4" />Выезд: {hotel.check_out}</span>}</div></DetailSection>}
      </div>
      <aside className="hidden rounded-2xl border border-neutral-200 bg-stone-50 p-6 lg:sticky lg:top-28 lg:block">
        <TourOptions id="hotel-tours" compact connections={connections} selectedId={selectedConnection?.id} onSelect={setSelectedConnectionId} />
        <div className="my-5 space-y-3 border-y border-neutral-200 py-5 text-sm text-neutral-600">{hotel.meal && <p className="flex gap-2"><Utensils className="size-4 shrink-0" />{hotel.meal}</p>}{hotel.location && <p className="flex gap-2"><MapPin className="size-4 shrink-0" />{hotel.location}</p>}{hotel.beach && <p className="flex gap-2"><Waves className="size-4 shrink-0" /><span>Информация о пляже — в описании</span></p>}<p className="leading-6">Выберите программу выше: её даты доступны сразу, без перезагрузки страницы.</p></div>
        {selectedConnection && <Link to={pricesPath} className="flex items-center justify-center gap-2 rounded-full bg-[#C2410C] px-5 py-3 text-sm font-medium text-white hover:bg-[#9A3412]">Открыть даты и цены<ArrowRight className="size-4" /></Link>}
        <Button variant="outline" className="mt-3 w-full rounded-full bg-white" onClick={() => setInquiry({})}>Задать вопрос об отеле</Button>{selectedConnection && <Link to={tourPath} className="mt-4 block text-center text-sm text-neutral-500 hover:text-[#C2410C]">Посмотреть программу «{selectedConnection.tour_title}»</Link>}
      </aside>
    </div>
    {inquiry && <Suspense fallback={null}><LeadDialog open onOpenChange={(open) => { if (!open) setInquiry(null); }} tour={selectedConnection ? { id: selectedConnection.tour_id, slug: selectedConnection.tour_slug, title: selectedConnection.tour_title, dates: selectedConnection.dates } : { title: hotel.name, dates: [] }} dates={selectedConnection?.dates || []} selectedHotel={hotel.name} selectedRoom={inquiry.title || inquiry.number || ""} title="Уточнить детали проживания" description="Оставьте контакты — менеджер поможет с выбором номера, программы и дат поездки." /></Suspense>}
  </article>;
}
