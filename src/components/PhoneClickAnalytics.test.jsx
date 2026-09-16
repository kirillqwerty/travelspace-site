import { act } from "react";
import { createRoot } from "react-dom/client";
import PhoneClickAnalytics from "./PhoneClickAnalytics";
import { trackPhoneClick } from "@/lib/analytics";

jest.mock("@/lib/analytics", () => ({
  trackPhoneClick: jest.fn(),
}));

test("tracks nested content inside a tel link exactly once", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(document.getElementById("root"));

  try {
    await act(async () => root.render(<PhoneClickAnalytics />));
    const link = document.createElement("a");
    link.href = "tel:+375296369911";
    link.dataset.analyticsPlacement = "sticky-tour-call";
    link.innerHTML = "<span>Звонок</span>";
    link.addEventListener("click", (event) => event.preventDefault());
    document.body.appendChild(link);

    link.querySelector("span").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );

    expect(trackPhoneClick).toHaveBeenCalledTimes(1);
    expect(trackPhoneClick).toHaveBeenCalledWith({
      phone: "+375296369911",
      linkText: "Звонок",
      placement: "sticky-tour-call",
    });
  } finally {
    await act(async () => root.unmount());
    document.body.innerHTML = "";
    jest.clearAllMocks();
  }
});
