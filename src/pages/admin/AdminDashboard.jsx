import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Inbox, Map, Users, MessageSquare, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const CARDS = [
  { key: "leads", endpoint: "/admin/leads/list", label: "Заявок", icon: Inbox, to: "/admin/leads", accent: "#C2410C" },
  { key: "tours", endpoint: "/admin/tours", label: "Туров", icon: Map, to: "/admin/tours", accent: "#7C2D12" },
  { key: "specialists", endpoint: "/admin/specialists", label: "Специалистов", icon: Users, to: "/admin/specialists", accent: "#171717" },
  { key: "reviews", endpoint: "/admin/reviews", label: "Отзывов", icon: MessageSquare, to: "/admin/reviews", accent: "#525252" },
  { key: "articles", endpoint: "/admin/articles", label: "Статей в блоге", icon: FileText, to: "/admin/articles", accent: "#171717" },
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState({});
  const [recentLeads, setRecentLeads] = useState([]);

  useEffect(() => {
    CARDS.forEach((c) => {
      api.get(c.endpoint).then((r) => {
        setCounts((p) => ({ ...p, [c.key]: Array.isArray(r.data) ? r.data.length : 0 }));
        if (c.key === "leads") setRecentLeads(r.data.slice(0, 5));
      });
    });
  }, []);

  return (
    <div data-testid="admin-dashboard">
      <h1 className="font-heading text-3xl">Обзор</h1>
      <p className="text-sm text-neutral-500 mt-1">Сводка по сайту, заявкам и контенту.</p>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {CARDS.map((c) => (
          <Link
            key={c.key}
            to={c.to}
            className="rounded-2xl bg-white border border-neutral-200 p-5 hover:shadow-md transition"
          >
            <c.icon className="size-5" style={{ color: c.accent }} />
            <p className="font-heading text-3xl font-bold mt-3">{counts[c.key] ?? "—"}</p>
            <p className="text-sm text-neutral-500 mt-1">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-white border border-neutral-200 overflow-hidden">
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="font-heading text-xl">Последние заявки</h2>
          <Link to="/admin/leads" className="text-xs text-[#C2410C]">Все заявки →</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-500 text-xs">
            <tr>
              <th className="text-left px-5 py-3">Дата</th>
              <th className="text-left px-5 py-3">Имя</th>
              <th className="text-left px-5 py-3">Телефон</th>
              <th className="text-left px-5 py-3">Тур</th>
              <th className="text-left px-5 py-3">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {recentLeads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-neutral-400">Пока нет заявок</td>
              </tr>
            )}
            {recentLeads.map((l) => (
              <tr key={l.id}>
                <td className="px-5 py-3 text-neutral-500">{l.created_at?.slice(0, 16).replace("T", " ")}</td>
                <td className="px-5 py-3">{l.name || "—"}</td>
                <td className="px-5 py-3 font-mono">{l.phone}</td>
                <td className="px-5 py-3">{l.tour || l.region || "—"}</td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-[#C2410C]">{l.status || "new"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
