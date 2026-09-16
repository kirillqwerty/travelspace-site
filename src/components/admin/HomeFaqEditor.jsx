import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { invalidateSiteData } from "@/lib/useSiteData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MarkdownBoldButton, { useMarkdownBold } from "./MarkdownBoldButton";
import MarkdownLinkButton from "./MarkdownLinkButton";
import { RichText } from "@/lib/richText";

export default function HomeFaqEditor() {
  const [items, setItems] = useState(null);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const textareaRef = useRef(null);
  const update = (patch) => setDraft((previous) => ({ ...previous, ...patch }));
  const bold = useMarkdownBold({ textareaRef, value: draft?.answer || "", onChange: (answer) => update({ answer }) });
  const load = () => api.get("/admin/faq").then((r) => setItems(r.data || []));
  useEffect(() => { load().catch(() => setError("Не удалось загрузить вопросы. Повторите загрузку.")); }, []);
  const visible = (items || []).filter((item) => item.active !== false && item.show_on_home !== false).sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const save = async () => {
    if (!draft.question?.trim() || !draft.answer?.trim()) { setError("Заполните вопрос и ответ."); return; }
    setBusy(true); setError(""); setStatus("");
    try {
      if (draft.id) await api.put(`/admin/faq/${draft.id}`, draft);
      else await api.post("/admin/faq", draft);
      invalidateSiteData();
      setDraft(null);
      await load();
      setStatus("Вопрос сохранён.");
    } catch { setError("Не удалось сохранить или обновить список. Повторите загрузку перед повторным сохранением."); }
    finally { setBusy(false); }
  };
  const hide = async (item) => {
    setBusy(true); setError(""); setStatus("");
    try {
      await api.put(`/admin/faq/${item.id}`, { ...item, show_on_home: false });
      invalidateSiteData(); await load(); setStatus("Вопрос убран с главной и сохранён на странице FAQ.");
    } catch { setError("Не удалось убрать вопрос с главной."); }
    finally { setBusy(false); }
  };
  const move = async (index, direction) => {
    const next = [...visible];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setBusy(true); setError(""); setStatus("");
    try {
      await Promise.all(next.map((item, order) => api.put(`/admin/faq/${item.id}`, { ...item, order: order + 1 })));
      invalidateSiteData(); await load(); setStatus("Порядок вопросов сохранён.");
    } catch { setError("Не удалось сохранить порядок вопросов."); }
    finally { setBusy(false); }
  };
  return <section className="space-y-3" data-testid="home-faq-editor">
    <p className="font-medium">FAQ на главной ({visible.length})</p>
    <p className="text-sm text-neutral-600">Здесь показаны вопросы, которые видны на главной. Это общая коллекция со страницей FAQ: изменение текста обновляет обе страницы. «Убрать с главной» сохраняет вопрос на странице FAQ. Порядок задаётся числом: меньшие значения идут выше.</p>
    <a href="/admin/faq" className="inline-block text-sm text-[#C2410C] underline">Все вопросы, включая скрытые — страница FAQ</a>
    {error && <p role="alert" className="text-sm text-red-700">{error} <Button type="button" variant="outline" onClick={() => load().then(() => setError("")).catch(() => {})}>Повторить загрузку</Button></p>}
    {status && <p role="status" className="text-sm text-green-800">{status}</p>}
    {items === null && !error && <p>Загружаем вопросы…</p>}
    {items !== null && !visible.length && <p>На главной нет вопросов. Добавьте новый или включите показ существующего в общей коллекции.</p>}
    <fieldset disabled={busy} className="space-y-3 min-w-0">
      {visible.map((item, index) => <details key={item.id} className="rounded-xl border p-3">
        <summary className="cursor-pointer break-words">{item.question}</summary>
        <RichText text={item.answer} className="mt-3 text-sm" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={!!draft} onClick={() => { setDraft({ ...item }); setStatus(""); }}>Редактировать</Button>
          <Button type="button" variant="outline" disabled={!!draft} onClick={() => hide(item)}>Убрать с главной</Button>
          <Button type="button" variant="outline" disabled={!!draft || index === 0} onClick={() => move(index, -1)}>Выше</Button>
          <Button type="button" variant="outline" disabled={!!draft || index === visible.length - 1} onClick={() => move(index, 1)}>Ниже</Button>
        </div>
      </details>)}
      {!draft && items !== null && <Button type="button" variant="outline" onClick={() => setDraft({ question: "", answer: "", category: "Общее", order: Math.max(0, ...items.map((i) => Number(i.order) || 0)) + 1, active: true, show_on_home: true })}>Добавить вопрос на главную</Button>}
      {draft && <div className="rounded-xl border border-orange-200 p-3 space-y-3">
        <label className="block text-sm">Вопрос<Input value={draft.question} onChange={(e) => update({ question: e.target.value })} /></label>
        <div className="flex gap-2"><MarkdownBoldButton onClick={bold.toggle} /><MarkdownLinkButton textareaRef={textareaRef} value={draft.answer} onChange={(answer) => update({ answer })} /></div>
        <label className="block text-sm">Ответ<Textarea ref={textareaRef} value={draft.answer} onChange={(e) => update({ answer: e.target.value })} onKeyDown={bold.onKeyDown} rows={5} /></label>
        <label className="block text-sm">Порядок на главной и странице FAQ<Input type="number" value={draft.order ?? 0} onChange={(e) => update({ order: Number(e.target.value) })} /></label>
        <div className="flex flex-wrap gap-2"><Button type="button" onClick={save}>Сохранить вопрос</Button><Button type="button" variant="outline" onClick={() => { setDraft(null); setError(""); }}>Отмена</Button></div>
      </div>}
    </fieldset>
    <p className="text-xs text-neutral-500">Вопросы сохраняются отдельно кнопкой «Сохранить вопрос». Заголовок блока — общей кнопкой сохранения настроек.</p>
  </section>;
}
