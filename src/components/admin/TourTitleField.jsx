import { useRef } from "react";
import { Input } from "@/components/ui/input";
import MarkdownBoldButton, { useMarkdownBold } from "./MarkdownBoldButton";
import { getTourTitleDraft, tourTitleFields, TourMenuTitle } from "@/lib/tourTitle";

export default function TourTitleField({ tour, onChange, placeholder, mode = "tour" }) {
  const inputRef = useRef(null);
  const articleMode = mode === "article";
  const value = getTourTitleDraft(tour);
  const change = (next) => onChange(tourTitleFields(next));
  const bold = useMarkdownBold({ textareaRef: inputRef, value, onChange: change, requireSelection: true });
  return (
    <div className="mt-1 space-y-2">
      <div className="overflow-hidden rounded-lg border border-neutral-200">
        <div className="border-b border-neutral-200 bg-neutral-50 px-2 py-1">
          <MarkdownBoldButton onClick={bold.toggle} />
        </div>
        <Input ref={inputRef} aria-label={articleMode ? "Заголовок статьи на сайте" : "Название тура на сайте"} value={value}
          placeholder={placeholder} onChange={(event) => change(event.target.value)}
          onKeyDown={bold.onKeyDown} className="rounded-none border-0 shadow-none" />
      </div>
      <p className="text-xs text-neutral-500">
        {articleMode
          ? "Выделите нужные слова и нажмите «Жирный» или Ctrl+B. Выделение будет видно в меню «Блог», карточке и заголовке статьи."
          : "Выделите направление в названии и нажмите «Жирный» или Ctrl+B. Повторное нажатие убирает выделение. Жирный текст будет виден в меню «Автобусные туры» и «Авиа туры» на компьютере и телефоне."}
      </p>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
        <p className="mb-1 text-xs text-neutral-500">{articleMode ? "Так выглядит заголовок" : "Так название выглядит в меню"}</p>
        <p className="text-sm font-normal leading-snug text-neutral-700 [overflow-wrap:anywhere]"
          data-testid={articleMode ? "article-title-preview" : "tour-title-preview"}><TourMenuTitle tour={tour} /></p>
      </div>
    </div>
  );
}
