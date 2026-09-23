import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import TourTitleField from "./TourTitleField";

test("highlights a selected word, previews it and preserves it after save/reopen without submitting the form", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const save = jest.fn((event) => event.preventDefault());
  let latest;
  function Editor({ initial }) {
    const [tour, setTour] = useState(initial);
    latest = tour;
    return <form onSubmit={save}><TourTitleField tour={tour} onChange={setTour} /></form>;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Editor initial={{ title: "Тур в Дагестан из Минска" }} />));
    let input = container.querySelector("input");
    input.focus();
    input.setSelectionRange(0, 0);
    await act(async () => container.querySelector("button").click());
    expect(input.value).toBe("Тур в Дагестан из Минска");
    input.setSelectionRange(6, 14);
    await act(async () => container.querySelector("button").click());
    expect(input.value).toBe("Тур в **Дагестан** из Минска");
    expect(latest.title).toBe("Тур в Дагестан из Минска");
    expect(container.querySelector('[data-testid="tour-title-preview"] strong').textContent).toBe("Дагестан");
    expect(save).not.toHaveBeenCalled();

    const stored = JSON.parse(JSON.stringify(latest));
    await act(async () => root.render(<Editor key="reopened" initial={stored} />));
    input = container.querySelector("input");
    expect(input.value).toBe("Тур в **Дагестан** из Минска");
    input.setSelectionRange(8, 16);
    await act(async () => input.dispatchEvent(new KeyboardEvent("keydown", { key: "b", ctrlKey: true, bubbles: true, cancelable: true })));
    expect(input.value).toBe("Тур в Дагестан из Минска");
    expect(latest.title_highlighted).toBe("");
    expect(container.querySelector('[data-testid="tour-title-preview"] strong')).toBeNull();
    expect(save).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});

test("uses the same safe highlighting editor for article titles", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  let latest;
  function Editor() {
    const [article, setArticle] = useState({ title: "Гид по Санкт-Петербургу" });
    latest = article;
    return <TourTitleField tour={article} onChange={setArticle} mode="article" />;
  }
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Editor />));
    const input = container.querySelector('[aria-label="Заголовок статьи на сайте"]');
    input.focus();
    input.setSelectionRange(7, 23);
    await act(async () => container.querySelector("button").click());
    expect(latest.title).toBe("Гид по Санкт-Петербургу");
    expect(latest.title_highlighted).toBe("Гид по **Санкт-Петербургу**");
    expect(container.querySelector('[data-testid="article-title-preview"] strong').textContent).toBe("Санкт-Петербургу");
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
