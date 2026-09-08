import { Bold } from "lucide-react";
import { Button } from "@/components/ui/button";

export function toggleBoldSelection(value, start, end) {
  const current = String(value ?? "");
  const selected = current.slice(start, end);
  // Preserve selection so a second click removes the formatting.
  if (start >= 2 && current.slice(start - 2, start) === "**" && current.slice(end, end + 2) === "**") {
    return { value: current.slice(0, start - 2) + selected + current.slice(end + 2), start: start - 2, end: end - 2 };
  }
  const text = selected || "жирный текст";
  const lines = text.split("\n");
  const remove = lines.filter((line) => line.trim()).every((line) => /^\s*\*\*.+\*\*\s*$/.test(line));
  const formatted = lines.map((line) => {
    if (!line.trim()) return line;
    return remove
      ? line.replace(/^(\s*)\*\*(.+)\*\*(\s*)$/, "$1$2$3")
      : line.replace(/^(\s*)(.*?)(\s*)$/, "$1**$2**$3");
  }).join("\n");
  const next = current.slice(0, start) + formatted + current.slice(end);
  const innerSelection = !remove && lines.length === 1;
  const leading = innerSelection ? formatted.indexOf("**") + 2 : 0;
  const trailing = innerSelection ? formatted.lastIndexOf("**") : formatted.length;
  return { value: next, start: start + leading, end: start + trailing };
}

export function useMarkdownBold({ textareaRef, value, onChange, requireSelection = false }) {
  const toggle = () => {
    const textarea = textareaRef.current;
    if (requireSelection && (!textarea || textarea.selectionStart === textarea.selectionEnd)) {
      textarea?.focus();
      return;
    }
    const current = String(value ?? "");
    const next = toggleBoldSelection(current, textarea?.selectionStart ?? current.length, textarea?.selectionEnd ?? current.length);
    onChange(next.value);
    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(next.start, next.end);
    });
  };
  const onKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "b") {
      event.preventDefault();
      event.stopPropagation();
      toggle();
    }
  };
  return { toggle, onKeyDown };
}

export default function MarkdownBoldButton({ onClick, className = "h-8 gap-1 px-2" }) {
  return (
    <Button type="button" size="sm" variant="ghost" className={className}
      title="Выделите текст и нажмите, чтобы сделать его жирным или убрать выделение (Ctrl+B)"
      onMouseDown={(event) => event.preventDefault()} onClick={onClick}>
      <Bold className="size-4" /> Жирный
    </Button>
  );
}
