import ResponsiveLink from "@/components/ResponsiveLink";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Hotel, Plus, Pencil, ArrowUpRight, Trash2, Search, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { invalidateSiteData } from "@/lib/useSiteData";
import { hasPendingUploads, normalizeRecordImages, usePendingUploads } from "@/lib/imageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import HotelProfileFields from "@/components/admin/HotelProfileFields";
import { RichTextarea, ImageListField, ImageInput, RoomsField, StringListField } from "./AdminCollection";

const message = (error) => error?.response?.data?.detail || "Не удалось сохранить изменения. Попробуйте ещё раз.";

export default function AdminHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [tourFilter, setTourFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const uploading = usePendingUploads();
  const load = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const hotelResponse = await api.get("/admin/hotels");
      setHotels(hotelResponse.data);
    } catch { setFailed(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const tourOptions = useMemo(() => {
    const map = new Map();
    hotels.forEach((hotel) => (hotel.connections || []).forEach((connection) => map.set(connection.tour_id, connection.tour_title)));
    return [...map.entries()].map(([id, title]) => ({ id, title }));
  }, [hotels]);
  const visible = useMemo(() => hotels.filter((hotel) => (!tourFilter || (hotel.connections || []).some((connection) => connection.tour_id === tourFilter)) && `${hotel.name} ${hotel.location || ""} ${(hotel.connections || []).map((connection) => connection.tour_title).join(" ")}`.toLowerCase().includes(query.toLowerCase())), [hotels, query, tourFilter]);
  const dates = useMemo(() => {
    const seen = new Set();
    return (editing?.connections || []).flatMap((connection) => connection.dates || []).filter((date) => {
      const key = date.id || `${date.start}|${date.end}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [editing]);
  const openEditor = (hotel) => { setEditing(normalizeRecordImages({ ...hotel })); setError(""); };
  const save = async (event) => {
    event.preventDefault();
    if (hasPendingUploads()) return;
    setSaving(true);
    setError("");
    try {
      const payload = normalizeRecordImages(editing);
      if (editing.id) await api.put(`/admin/hotels/${encodeURIComponent(editing.id)}`, payload);
      else await api.post("/admin/hotels", payload);
      invalidateSiteData();
      setEditing(null);
      toast.success("Отель сохранён. Подключённые туры сразу получат обновлённую информацию.");
      await load();
    } catch (failure) { setError(message(failure)); }
    finally { setSaving(false); }
  };
  const remove = async (hotel) => {
    if (!window.confirm(`Удалить отель «${hotel.name}» окончательно? Он будет отключён от ${hotel.connections?.length || 0} туров, сами туры и их даты сохранятся.`)) return;
    try { await api.delete(`/admin/hotels/${encodeURIComponent(hotel.id)}`); invalidateSiteData(); await load(); toast.success("Отель удалён и отключён от туров"); }
    catch (failure) { toast.error(message(failure)); }
  };
  const copy = async (hotel) => {
    try { await navigator.clipboard.writeText(`https://travelspace.by/hotels/${hotel.slug}`); toast.success("Ссылка скопирована"); }
    catch { toast.error("Не удалось скопировать ссылку"); }
  };

  return <div data-testid="admin-hotels">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="font-heading text-3xl">Отели</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">Отель создаётся и удаляется только здесь. В настройках тура его можно подключить или отключить; один отель разрешено использовать в нескольких турах.</p></div>
      <Button className="rounded-full bg-[#C2410C] text-white hover:bg-[#9A3412]" disabled={loading || failed} onClick={() => openEditor({ name: "", images: [], rooms: [], active: true, page_enabled: true })}><Plus className="mr-2 size-4" />Добавить отель</Button>
    </div>
    <div className="mt-7 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-3 size-4 text-neutral-400" /><Input aria-label="Поиск отеля" className="bg-white pl-9" placeholder="Название, курорт или тур" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <select aria-label="Фильтр по туру" className="h-10 max-w-full rounded-md border bg-white px-3 text-sm sm:max-w-xs" value={tourFilter} onChange={(event) => setTourFilter(event.target.value)}><option value="">Все туры</option>{tourOptions.map((tour) => <option key={tour.id} value={tour.id}>{tour.title}</option>)}</select>
    </div>
    {loading ? <div className="p-10 text-center text-neutral-500"><Loader2 className="mx-auto mb-2 size-6 animate-spin" />Загружаем отели…</div> : failed ? <div className="p-8 text-center"><p>Не удалось загрузить отели.</p><Button variant="outline" className="mt-3" onClick={load}>Повторить</Button></div> : <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {!visible.length && <p className="col-span-full rounded-2xl border border-dashed p-8 text-center text-neutral-500">Отели не найдены. Создайте отель здесь, затем подключите его в настройках нужных туров.</p>}
      {visible.map((hotel) => <article key={hotel.id} className="overflow-hidden rounded-2xl border bg-white" data-testid="admin-hotel-card">
        {hotel.images?.[0] || hotel.image ? <img src={mediaUrl(hotel.images?.[0] || hotel.image)} alt="" className="aspect-[16/10] w-full object-cover" loading="lazy" /> : <div className="grid aspect-[16/10] place-items-center bg-stone-100"><Hotel className="size-10 text-stone-300" /></div>}
        <div className="p-5"><p className="text-xs text-neutral-500">{hotel.location || "Отель"}</p><h2 className="mt-1 text-xl font-semibold">{hotel.name}</h2><p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-500">{hotel.connections?.length ? hotel.connections.map((connection) => connection.tour_title).join(" · ") : "Пока не подключён к турам"}</p>
          <p className="mt-3 text-xs text-neutral-500">Номеров: {hotel.rooms?.length || 0} · Туров: {hotel.connections?.length || 0} · {hotel.active === false ? "Выключен" : hotel.page_enabled === false ? "Страница выключена" : "Опубликован"}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4"><button className="inline-flex items-center gap-1 text-sm font-medium text-[#C2410C]" onClick={() => openEditor(hotel)}><Pencil className="size-3.5" />Изменить</button>
            {hotel.active !== false && hotel.page_enabled !== false && <><ResponsiveLink href={`/hotels/${hotel.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-neutral-600">На сайт<ArrowUpRight className="size-3.5" /></ResponsiveLink><button aria-label={`Скопировать ссылку на ${hotel.name}`} onClick={() => copy(hotel)}><Copy className="size-4 text-neutral-500" /></button></>}
            <button className="ml-auto text-neutral-400 hover:text-red-600" aria-label={`Удалить отель ${hotel.name}`} onClick={() => remove(hotel)}><Trash2 className="size-4" /></button></div>
        </div>
      </article>)}
    </div>}
    <Dialog open={!!editing} onOpenChange={(open) => { if (!open && !saving && !uploading) setEditing(null); }}>
      <DialogContent className="flex h-[95dvh] max-h-[95vh] w-[calc(100vw-24px)] max-w-5xl flex-col gap-0 overflow-hidden p-0" onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader className="shrink-0 border-b px-5 py-5 sm:px-7"><DialogTitle className="font-heading text-2xl">{editing?.id ? "Редактирование отеля" : "Новый отель"}</DialogTitle><DialogDescription>Изменения появятся на странице отеля и во всех подключённых турах после сохранения.</DialogDescription></DialogHeader>
        {editing && <form className="flex min-h-0 min-w-0 w-full flex-1 flex-col" onSubmit={save}>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]" data-testid="hotel-editor-scroll">
          <fieldset disabled={saving || uploading} className="min-w-0 w-full p-5 sm:p-7">
            <div className="mb-6 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
              <p className="text-sm font-medium">{editing.id ? `Подключено туров: ${editing.connections?.length || 0}` : "Сначала сохраните карточку отеля"}</p>
              {editing.connections?.length > 0 && <p className="mt-1 text-xs leading-5 text-neutral-600">{editing.connections.map((connection) => connection.tour_title).join(" · ")}</p>}
              <p className="mt-2 text-xs text-neutral-500">Привязки и даты задаются в <ResponsiveLink as={Link} className="text-[#C2410C]" to="/admin/tours" target="_blank">настройках туров</ResponsiveLink>. Изменения описания, фото и номеров применяются ко всем привязкам.</p>
            </div>
            <HotelProfileFields showName value={editing} dates={dates} onChange={(patch) => setEditing((previous) => ({ ...previous, ...patch }))} RichEditor={RichTextarea} ImagesEditor={ImageListField} ImageInput={ImageInput} RoomsEditor={RoomsField} ListEditor={StringListField} />
          </fieldset>
          </div>
          <div className="shrink-0 border-t bg-white p-4">{error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving || uploading} onClick={() => setEditing(null)}>Отмена</Button><Button type="submit" disabled={saving || uploading} className="bg-[#C2410C] text-white hover:bg-[#9A3412]">{saving ? "Сохраняем…" : uploading ? "Загружаем фото…" : "Сохранить отель"}</Button></div></div>
        </form>}
      </DialogContent>
    </Dialog>
  </div>;
}
