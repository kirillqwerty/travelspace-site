import { act } from "react";
import { createRoot } from "react-dom/client";
import { HighlightedTitle } from "./tourTitle";

test("keeps an editor-selected phrase bold inside an extended article H1", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("h1");
  document.body.appendChild(container);
  const root = createRoot(container);

  try {
    await act(async () => {
      root.render(
        <HighlightedTitle
          record={{
            title: "Что взять с собой в автобусный тур?",
            title_highlighted: "Что взять с **собой** в автобусный тур?",
          }}
          text="Что взять с собой в автобусный тур: полный список"
        />,
      );
    });

    expect(container.textContent).toBe("Что взять с собой в автобусный тур: полный список");
    expect(container.querySelector("strong").textContent).toBe("собой");
  } finally {
    await act(async () => root.unmount());
    container.remove();
  }
});
