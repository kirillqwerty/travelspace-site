import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Inbox,
  Map,
  Users,
  MessageSquare,
  FileText,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

const CARDS = [
  {
    key: "leads",
    label: "Заявки",
    icon: Inbox,
    to: "/admin/leads",
    accent: "#C2410C",
  },
  {
    key: "tours",
    label: "Туры",
    icon: Map,
    to: "/admin/tours",
    accent: "#7C2D12",
  },
  {
    key: "specialists",
    label: "Специалисты",
    icon: Users,
    to: "/admin/specialists",
    accent: "#171717",
  },
  // {
  //   key: "reviews",
  //   label: "Отзывы",
  //   icon: MessageSquare,
  //   to: "/admin/reviews",
  //   accent: "#525252",
  // },
  {
    key: "articles",
    label: "Блог",
    icon: FileText,
    to: "/admin/articles",
    accent: "#171717",
  },
];

export default function AdminDashboard() {
  const [recentLeads, setRecentLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get("/admin/leads/list")
      .then((r) => {
        if (!cancelled) {
          setRecentLeads(r.data.slice(0, 5));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingLeads(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div data-testid="admin-dashboard">
      <h1 className="font-heading text-3xl">Обзор</h1>
      <p className="text-sm text-neutral-500 mt-1">
        Сводка по сайту, заявкам и контенту.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {CARDS.map((c) => (
          <Link
            key={c.key}
            to={c.to}
            className="rounded-2xl bg-white border border-neutral-200 p-5 hover:shadow-md transition"
          >
            <c.icon className="size-5" style={{ color: c.accent }} />
            <p className="font-heading text-xl font-bold mt-3">{c.label}</p>
            <p className="text-sm text-neutral-500 mt-1">Открыть раздел</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-white border border-neutral-200 overflow-hidden">
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="font-heading text-xl">Последние заявки</h2>
          <Link to="/admin/leads" className="text-xs text-[#C2410C]">
            Все заявки →
          </Link>
        </div>

        {loadingLeads ? (
          <div className="px-5 py-10 text-center text-neutral-400">
            <Loader2 className="mx-auto size-7 animate-spin text-[#C2410C]" />
            <p className="mt-3 text-sm">Загружаем заявки…</p>
          </div>
        ) : (
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
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-neutral-400"
                  >
                    Пока нет заявок
                  </td>
                </tr>
              )}

              {recentLeads.map((l) => (
                <tr key={l.id}>
                  <td className="px-5 py-3 text-neutral-500">
                    {l.created_at?.slice(0, 16).replace("T", " ")}
                  </td>
                  <td className="px-5 py-3">{l.name || "—"}</td>
                  <td className="px-5 py-3 font-mono">{l.phone}</td>
                  <td className="px-5 py-3">{l.tour || l.region || "—"}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-[#C2410C]">
                      {l.status || "new"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
