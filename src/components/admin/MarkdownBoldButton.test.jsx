import { act, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import MarkdownBoldButton, { toggleBoldSelection, useMarkdownBold } from "./MarkdownBoldButton";

test("selected words toggle bold without changing surrounding text", () => {
  const first = toggleBoldSelection("Тур в Грузию из Минска", 6, 12);
  expect(first.value).toBe("Тур в **Грузию** из Минска");
  expect(toggleBoldSelection(first.value, first.start, first.end).value).toBe("Тур в Грузию из Минска");
});

test("multi-paragraph selections format each line and preserve blank paragraphs", () => {
  const value = "Первая строка\n\nВторая строка";
  const first = toggleBoldSelection(value, 0, value.length);
  expect(first.value).toBe("**Первая строка**\n\n**Вторая строка**");
  expect(toggleBoldSelection(first.value, first.start, first.end).value).toBe(value);
});

test("empty selection creates selected placeholder text", () => {
  const next = toggleBoldSelection("Тур: ", 5, 5);
  expect(next.value).toBe("Тур: **жирный текст**");
  expect(next.value.slice(next.start, next.end)).toBe("жирный текст");
});

test.each([
  ["[Тур](/tours/winter_(new))", 0, 24],
  ["[Тур](/tours/winter_(new))", 1, 4],
  ["[Тур](/tours/winter_(new))", 7, 12],
])("bold around a link or its selected URL never edits the destination", (text, start, end) => {
  const next = toggleBoldSelection(text, start, end);
  expect(next.value).toContain("(/tours/winter_(new))");
  expect(toggleBoldSelection(next.value, next.start, next.end).value).toBe(text);
});

test("making a mixed selection bold removes inner bold delimiters", () => {
  const text = "До **тура** после";
  expect(toggleBoldSelection(text, 0, text.length).value).toBe("**До тура после**");
});

test("toolbar and Ctrl+B change text without submitting its editor", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const save = jest.fn();
  function Editor() {
    const [value, onChange] = useState("Грузия");
    const textareaRef = useRef(null);
    const bold = useMarkdownBold({ textareaRef, value, onChange });
    return <form onSubmit={save}><MarkdownBoldButton onClick={bold.toggle} />
      <textarea ref={textareaRef} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={bold.onKeyDown} /></form>;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Editor />));
    const textarea = container.querySelector("textarea");
    textarea.setSelectionRange(0, 6);
    await act(async () => container.querySelector("button").click());
    expect(textarea.value).toBe("**Грузия**");
    textarea.setSelectionRange(2, 8);
    await act(async () => textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "b", ctrlKey: true, bubbles: true, cancelable: true })));
    expect(textarea.value).toBe("Грузия");
    expect(save).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
