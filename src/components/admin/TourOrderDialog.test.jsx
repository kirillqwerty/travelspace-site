import { act } from "react";
import { createRoot } from "react-dom/client";
import TourOrderDialog, { buildTourOrderGroups, moveTourOrderItem } from "./TourOrderDialog";

test("builds independent bus and air orders", () => {
  const groups = buildTourOrderGroups([
    { id: "bus-2", title: "Второй", transport_type: "bus", order: 2 },
    { id: "air-2", title: "Авиа 2", transport_type: "air", order: 8 },
    { id: "bus-1", title: "Первый", transport_type: "bus", order: 1 },
    { id: "air-1", title: "Авиа 1", transport_type: "air", order: 3 },
  ]);

  expect(groups.bus).toEqual(["bus-1", "bus-2"]);
  expect(groups.air).toEqual(["air-1", "air-2"]);
});

test("moves one tour without mutating the original order", () => {
  const original = ["one", "two", "three"];
  expect(moveTourOrderItem(original, 2, 0)).toEqual(["three", "one", "two"]);
  expect(original).toEqual(["one", "two", "three"]);
});

test("saves the changed order for both sections", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const onSave = jest.fn().mockResolvedValue(undefined);
  const onOpenChange = jest.fn();
  const tours = [
    { id: "bus-1", title: "Первый", transport_type: "bus", order: 1 },
    { id: "bus-2", title: "Второй", transport_type: "bus", order: 2 },
    { id: "air-1", title: "Авиа", transport_type: "air", order: 1 },
  ];

  try {
    await act(async () => {
      root.render(
        <TourOrderDialog open tours={tours} onSave={onSave} onOpenChange={onOpenChange} />,
      );
    });
    const transferred = new Map();
    const dataTransfer = {
      effectAllowed: "",
      dropEffect: "",
      setData: (type, value) => transferred.set(type, value),
      getData: (type) => transferred.get(type) || "",
    };
    const dispatchDrag = async (node, type) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
      await act(async () => node.dispatchEvent(event));
    };
    const firstCard = document.querySelector('[data-testid="tour-order-item-bus-1"]');
    const secondCard = document.querySelector('[data-testid="tour-order-item-bus-2"]');
    await dispatchDrag(firstCard, "dragstart");
    expect(firstCard.className).toContain("ring-orange-200");
    await dispatchDrag(secondCard, "dragenter");
    expect(secondCard.className).toContain("ring-orange-100");
    await dispatchDrag(firstCard, "dragend");
    expect(firstCard.className).not.toContain("ring-orange-200");

    await act(async () => {
      document.querySelector('button[aria-label="Опустить тур «Первый»"]').click();
    });
    await act(async () => {
      document.querySelector('[data-testid="save-tour-order"]').click();
    });

    expect(onSave).toHaveBeenCalledWith({
      bus: ["bus-2", "bus-1"],
      air: ["air-1"],
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
