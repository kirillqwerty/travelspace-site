import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { moveArticleBlock } from "@/lib/articleContent";

export default function ArticleContentEditor({ value = [], onChange, TextEditor, ImageEditor }) {
  const dragged = useRef(null);
  const blocks = Array.isArray(value) ? value : [];
  const update = (id, patch) => onChange(blocks.map((block) => block.id === id ? { ...block, ...patch } : block));
  const newBlockId = () => globalThis.crypto?.randomUUID?.() || `article-block-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const insert = (index, type) => {
    const next = [...blocks];
    next.splice(index, 0, { id: newBlockId(), type, ...(type === "text" ? { text: "" } : { src: "", alt: "" }) });
    onChange(next);
  };
  const insertion = (index) => <div className="flex flex-wrap gap-2 py-2">
    <Button type="button" variant="outline" onClick={() => insert(index, "text")}>Добавить текст здесь</Button>
    <Button type="button" variant="outline" onClick={() => insert(index, "image")}>Добавить фото здесь</Button>
  </div>;
  return <div className="space-y-2" data-testid="article-content-editor">
    <p className="text-sm text-neutral-600">Добавляйте фото между текстовыми блоками. Перетаскивайте за ручку «Переместить» или используйте кнопки «Выше» и «Ниже». Каждый абзац можно сделать отдельным блоком.</p>
    {insertion(0)}
    {blocks.map((block, index) => <div key={block.id}>
      <section data-block-id={block.id} onDragOver={(e) => { if (dragged.current) e.preventDefault(); }} onDrop={(e) => {
        if (!dragged.current) return;
        e.preventDefault();
        onChange(moveArticleBlock(blocks, blocks.findIndex((b) => b.id === dragged.current), index));
        dragged.current = null;
      }} className="min-w-0 rounded-xl border border-neutral-200 p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span draggable onDragStart={(e) => { dragged.current = block.id; e.dataTransfer.setData("text/plain", block.id); e.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { dragged.current = null; }} className="cursor-grab rounded border px-2 py-2" title="Перетащить блок">⠿ Переместить</span>
          <span className="text-sm font-medium">{index + 1}. {block.type === "image" ? "Фото" : "Текст"}</span>
          <Button type="button" variant="outline" disabled={index === 0} onClick={() => onChange(moveArticleBlock(blocks, index, index - 1))}>Выше</Button>
          <Button type="button" variant="outline" disabled={index === blocks.length - 1} onClick={() => onChange(moveArticleBlock(blocks, index, index + 1))}>Ниже</Button>
          <Button type="button" variant="outline" onClick={() => onChange(blocks.filter((b) => b.id !== block.id))}>Удалить блок</Button>
        </div>
        {block.type === "text" ? <>
          <TextEditor value={block.text || ""} onChange={(text) => update(block.id, { text })} rows={5} />
          {/\n\s*\n/.test(block.text || "") && <Button type="button" variant="outline" onClick={() => {
            const next = [...blocks];
            next.splice(index, 1, ...block.text.split(/\n\s*\n/).filter((text) => text.trim()).map((text) => ({ id: newBlockId(), type: "text", text })));
            onChange(next);
          }}>Разделить на абзацы</Button>}
        </> : <>
          <ImageEditor value={block.src || ""} onChange={(src) => update(block.id, { src })} />
          <label className="block text-sm">ALT фотографии<Input value={block.alt || ""} onChange={(e) => update(block.id, { alt: e.target.value })} /></label>
        </>}
      </section>
      {insertion(index + 1)}
    </div>)}
  </div>;
}
