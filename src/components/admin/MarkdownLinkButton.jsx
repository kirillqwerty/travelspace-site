import { useId, useState } from "react";
import { Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readMarkdownLink, isSafeRichUrl } from "@/lib/richTextTokens";

export default function MarkdownLinkButton({
  textareaRef,
  value = "",
  onChange,
  className = "h-8 gap-1 px-2",
}) {
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [error, setError] = useState("");

  const openEditor = () => {
    const textarea = textareaRef?.current;
    const current = String(value || "");
    const start = textarea?.selectionStart ?? current.length;
    const end = textarea?.selectionEnd ?? current.length;
    setError("");
    for (let i = 0; i < current.length; i++) {
      const existing = readMarkdownLink(current, i);
      if (existing && start >= i && end <= existing.end && start < existing.end) {
        setSelection({ start: i, end: existing.end });
        setLinkText(existing.label);
        setLinkUrl(existing.href);
        setOpen(true);
        return;
      }
    }
    setSelection({ start, end });
    setLinkText(current.slice(start, end));
    setLinkUrl("");
    setOpen(true);
  };

  const insertLink = (event) => {
    event.preventDefault();
    // React events from the dialog portal still bubble to the editor form.
    // Only insert the link here; saving the whole record is a separate action.
    event.stopPropagation();
    const url = linkUrl.trim();
    if (!url) return;
    if (!isSafeRichUrl(url)) { setError("Укажите адрес https://… или путь внутри сайта /tours/… без пробелов."); return; }

    const current = String(value || "");
    const text = (linkText.trim() || url).replace(/(?<!\\)([\[\]])/g, "\\$1");
    const markdown = `[${text}](${url})`;
    const nextValue = `${current.slice(0, selection.start)}${markdown}${current.slice(selection.end)}`;

    onChange(nextValue);
    setOpen(false);
    requestAnimationFrame(() => {
      textareaRef?.current?.focus();
      // Keep the label selected so Bold can immediately format the new link.
      textareaRef?.current?.setSelectionRange(selection.start + 1, selection.start + 1 + text.length);
    });
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={className}
        onMouseDown={(event) => event.preventDefault()}
        onClick={openEditor}
      >
        <LinkIcon className="size-4" /> Ссылка
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={insertLink} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Добавить ссылку</DialogTitle>
              <DialogDescription>
                Укажите понятный текст и адрес страницы. Выделенный текст уже
                подставлен автоматически. На сайте ссылка откроется в новой
                вкладке.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-text`}>Текст ссылки</Label>
              <Input
                id={`${fieldId}-text`}
                value={linkText}
                onChange={(event) => setLinkText(event.target.value)}
                placeholder="Например: туры в Санкт-Петербург"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-url`}>Адрес ссылки</Label>
              <Input
                id={`${fieldId}-url`}
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="/tours/sankt-peterburg или https://..."
              />
            </div>

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={!linkUrl.trim()}>
                Добавить ссылку
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
