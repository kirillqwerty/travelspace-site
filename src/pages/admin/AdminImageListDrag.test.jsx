import { act } from "react";
import { createRoot } from "react-dom/client";
import { ImageListField } from "./AdminCollection";

jest.mock("react-router-dom", () => ({ Link: () => null }), { virtual: true });

test("photo URL and ALT remain selectable while the handle reorders photos", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const onChange = jest.fn();
  const onAltChange = jest.fn();
  try {
    await act(async () => root.render(<ImageListField label="Фото" value={["/one.jpg", "/two.jpg"]} altValue={["Первое", "Второе"]} onChange={onChange} onAltChange={onAltChange} />));
    const handles = [...container.querySelectorAll('button[title="Перетащить фото"]')];
    const inputs = [...container.querySelectorAll('input[placeholder="URL картинки"]')];
    expect(handles).toHaveLength(2);
    expect(inputs[0].closest('[draggable="true"]')).toBeNull();

    await act(async () => inputs[0].dispatchEvent(new Event("dragstart", { bubbles: true, cancelable: true })));
    await act(async () => handles[1].parentElement.parentElement.dispatchEvent(new Event("drop", { bubbles: true, cancelable: true })));
    expect(onChange).not.toHaveBeenCalled();

    await act(async () => handles[0].dispatchEvent(new Event("dragstart", { bubbles: true, cancelable: true })));
    await act(async () => handles[1].parentElement.parentElement.dispatchEvent(new Event("drop", { bubbles: true, cancelable: true })));
    expect(onChange).toHaveBeenLastCalledWith(["/two.jpg", "/one.jpg"]);
    expect(onAltChange).toHaveBeenLastCalledWith(["Второе", "Первое"]);
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
