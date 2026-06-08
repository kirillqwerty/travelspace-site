import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth.jsx";
import {
  LogOut,
  Inbox,
  Map,
  Users,
  MessageSquare,
  FileText,
  Tag,
  HelpCircle,
  Settings,
  LayoutDashboard,
} from "lucide-react";

// "Направления" entity removed — admin no longer has a separate Directions
// section. Tour records hold every direction-level field.
const ITEMS = [
  { to: "/admin", end: true, label: "Обзор", icon: LayoutDashboard },
  { to: "/admin/leads", label: "Заявки", icon: Inbox },
  { to: "/admin/tours", label: "Туры", icon: Map },
  { to: "/admin/specialists", label: "Специалисты", icon: Users },
  { to: "/admin/reviews", label: "Отзывы", icon: MessageSquare },
  { to: "/admin/articles", label: "Блог", icon: FileText },
  { to: "/admin/promotions", label: "Акции", icon: Tag },
  { to: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { to: "/admin/settings", label: "Настройки", icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <aside
        className="hidden lg:block w-64 bg-white border-r border-neutral-200 flex-shrink-0"
        data-testid="admin-sidebar"
      >
        <div className="p-6 border-b border-neutral-200">
          <Link to="/" className="flex items-center gap-2">
            <span className="size-8 rounded-full bg-[#C2410C] grid place-items-center text-white font-heading text-lg leading-none">
              T
            </span>
            <span className="font-heading font-bold">TRAVELSPACE</span>
          </Link>
          <p className="text-xs text-neutral-500 mt-1">Admin</p>
        </div>
        <nav className="p-3">
          {ITEMS.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-orange-50 text-[#C2410C] font-medium"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`
              }
              data-testid={`admin-nav-${it.to.split("/").pop() || "dashboard"}`}
            >
              <it.icon className="size-4" />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 mt-auto">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100"
            data-testid="admin-logout"
          >
            <LogOut className="size-4" /> Выйти
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="lg:hidden bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <Link to="/admin" className="font-heading text-lg font-bold">
            TRAVELSPACE · Admin
          </Link>
          <button onClick={onLogout} className="text-xs text-neutral-600">
            Выйти
          </button>
        </header>
        <nav className="lg:hidden bg-white border-b border-neutral-200 overflow-x-auto no-scrollbar px-3 py-2 flex gap-2">
          {ITEMS.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                `whitespace-nowrap text-xs px-3 py-1.5 rounded-full ${
                  isActive
                    ? "bg-[#C2410C] text-white"
                    : "bg-neutral-100 text-neutral-700"
                }`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
        <main className="p-4 sm:p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
