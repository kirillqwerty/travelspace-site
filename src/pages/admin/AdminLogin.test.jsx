import { act } from "react";
import { createRoot } from "react-dom/client";
import AdminLogin from "./AdminLogin";
import { preserveServerPage } from "@/lib/pageBootstrap";

jest.mock("@/lib/auth.jsx", () => ({
  useAuth: () => ({ user: null, loading: false, login: jest.fn() }),
}));
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(), Navigate: () => null,
}), { virtual: true });

test("login form stays visible when upgrading from a server with an admin SEO snapshot", async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.history.replaceState({}, "", "/admin/login");
  document.body.innerHTML = '<div id="root"><div data-seo-prerender="true">Страница не найдена</div></div>';
  preserveServerPage();
  const container = document.getElementById("root");
  const root = createRoot(container);
  try {
    await act(async () => root.render(<AdminLogin />));
    expect(container.hidden).toBe(false);
    expect(container.querySelector('[data-testid="admin-login-form"]')).not.toBeNull();
    expect(container.querySelector('input[type="password"]')).not.toBeNull();
    expect(document.body.textContent).not.toContain("Страница не найдена");
    expect(document.body.textContent).toContain("Вход в админ-панель");
  } finally {
    await act(async () => root.unmount());
    document.body.innerHTML = "";
    window.history.replaceState({}, "", "/");
  }
});
