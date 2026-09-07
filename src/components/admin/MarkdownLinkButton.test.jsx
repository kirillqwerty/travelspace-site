import { act, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import MarkdownLinkButton from "./MarkdownLinkButton";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";

function Editor({ onSave, insideDialog }) {
  const [open, setOpen] = useState(true);
  const [text, setText] = useState("Посмотрите туры в Грузию здесь");
  const textareaRef = useRef(null);
  const form = (
    <form
      data-testid="editor-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(text);
        setOpen(false);
      }}
    >
      <textarea ref={textareaRef} value={text} onChange={(e) => setText(e.target.value)} />
      <MarkdownLinkButton textareaRef={textareaRef} value={text} onChange={setText} />
      <button type="submit">Сохранить запись</button>
    </form>
  );
  return insideDialog ? (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Редактировать запись</DialogTitle>
        {form}
      </DialogContent>
    </Dialog>
  ) : open ? form : null;
}

let container;
let root;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

function button(text) {
  return [...document.querySelectorAll("button")].find((item) => item.textContent.trim() === text);
}

async function click(element) {
  await act(async () => element.click());
}

async function changeInput(input, value) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function openLinkEditor() {
  const textarea = document.querySelector("textarea");
  textarea.focus();
  textarea.setSelectionRange(11, 24);
  await click(button("Ссылка"));
  return [...document.querySelectorAll('[role="dialog"]')].find((dialog) =>
    dialog.querySelector('input[placeholder="Например: туры в Санкт-Петербург"]'),
  );
}

test.each([[false, "submit"], [false, "click"], [true, "submit"], [true, "click"]])("link insertion does not submit or close the outer editor (dialog=%s, action=%s)", async (insideDialog, action) => {
  const onSave = jest.fn();
  await act(async () => root.render(<Editor onSave={onSave} insideDialog={insideDialog} />));
  const dialog = await openLinkEditor();
  expect(onSave).not.toHaveBeenCalled();
  expect(dialog.querySelectorAll("input")[0].value).toBe("туры в Грузию");
  await changeInput(dialog.querySelectorAll("input")[1], "/tours/gruziya");
  if (action === "click") {
    await click(dialog.querySelector('button[type="submit"]'));
  } else {
    // Enter in either input submits the link form through the same event.
    await act(async () => {
      dialog.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
  }
  expect(onSave).not.toHaveBeenCalled();
  expect(document.querySelector('[data-testid="editor-form"]')).not.toBeNull();
  expect(document.querySelector("textarea").value).toBe("Посмотрите [туры в Грузию](/tours/gruziya) здесь");
  await click(button("Сохранить запись"));
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onSave).toHaveBeenCalledWith("Посмотрите [туры в Грузию](/tours/gruziya) здесь");
});

test("canceling a link leaves the parent dialog and its text intact", async () => {
  const onSave = jest.fn();
  await act(async () => root.render(<Editor onSave={onSave} insideDialog />));
  await openLinkEditor();
  await click(button("Отмена"));
  expect(onSave).not.toHaveBeenCalled();
  expect(document.querySelector("textarea").value).toBe("Посмотрите туры в Грузию здесь");
  expect(document.querySelector('[data-testid="editor-form"]')).not.toBeNull();
});
