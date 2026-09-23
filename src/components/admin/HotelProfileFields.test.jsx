import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import HotelProfileFields from "./HotelProfileFields";

const RichEditor = ({ value, onChange, placeholder }) => <textarea aria-label={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />;
const ImagesEditor = ({ onItemsChange }) => <button type="button" onClick={() => onItemsChange(["/hotel.webp"], ["Фасад отеля"])}>Добавить тестовое фото</button>;
const RoomsEditor = ({ onChange }) => <button type="button" onClick={() => onChange([{ id: "room-1", title: "Двухместный" }])}>Добавить тестовый номер</button>;
const ListEditor = ({ label, value, onChange }) => <button type="button" onClick={() => onChange([...value, label])}>{label}</button>;
const selectTab = (container, label) => {
  const tab = [...container.querySelectorAll('[role="tab"]')].find((item) => item.textContent === label);
  tab.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
};

test("splits the hotel editor into tabs without losing controlled field updates", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  let latest;
  function Editor() {
    const [hotel, setHotel] = useState({ name: "Smile", images: [], rooms: [] });
    latest = hotel;
    return <HotelProfileFields
      showName
      value={hotel}
      dates={[]}
      onChange={(patch) => setHotel((previous) => ({ ...previous, ...patch }))}
      RichEditor={RichEditor}
      ImagesEditor={ImagesEditor}
      RoomsEditor={RoomsEditor}
      ListEditor={ListEditor}
    />;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Editor />));
    expect([...container.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent)).toEqual([
      "Основное", "Фото и видео", "Номера", "Условия", "Страница и SEO",
    ]);
    expect(container.querySelector('[data-testid="hotel-tab-main"]').getAttribute("data-state")).toBe("active");

    await act(async () => selectTab(container, "Фото и видео"));
    expect(container.querySelector('[data-testid="hotel-tab-media"]').getAttribute("data-state")).toBe("active");
    await act(async () => [...container.querySelectorAll("button")].find((button) => button.textContent === "Добавить тестовое фото").click());
    expect(latest.images).toEqual(["/hotel.webp"]);
    expect(latest.image_alts).toEqual(["Фасад отеля"]);

    await act(async () => selectTab(container, "Номера"));
    await act(async () => [...container.querySelectorAll("button")].find((button) => button.textContent === "Добавить тестовый номер").click());
    expect(latest.rooms[0].title).toBe("Двухместный");

    await act(async () => selectTab(container, "Основное"));
    expect(container.querySelector('input[value="Smile"]')).not.toBeNull();
    expect(latest.images).toEqual(["/hotel.webp"]);
    expect(latest.rooms).toHaveLength(1);
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
