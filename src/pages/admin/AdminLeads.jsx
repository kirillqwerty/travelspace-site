import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trash2, RefreshCw, Hotel } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatDate } from "@/lib/formatDate";

const STATUSES = [
  { v: "new", label: "Новая" },
  { v: "in_progress", label: "В работе" },
  { v: "closed", label: "Закрыта" },
];

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.get("/admin/leads/list").then((r) => {
      setLeads(r.data);
      setLoading(false);
    });

  useEffect(() => {
    load();
  }, []);

  const onStatus = async (id, status) => {
    await api.patch(`/admin/leads/${id}`, { status });
    setLeads((p) => p.map((l) => (l.id === id ? { ...l, status } : l)));
    toast.success("Статус обновлён");
  };

  const onDelete = async (id) => {
    if (!confirm("Удалить заявку?")) return;
    await api.delete(`/admin/leads/${id}`);
    setLeads((p) => p.filter((l) => l.id !== id));
    toast.success("Заявка удалена");
  };

  return (
    <div data-testid="admin-leads">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl">Заявки</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Список всех заявок, оставленных через сайт.
          </p>
        </div>

        <Button variant="outline" onClick={load} className="rounded-full">
          <RefreshCw className="size-4 mr-1" /> Обновить
        </Button>
      </div>

      <div className="mt-8 rounded-2xl bg-white border border-neutral-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[980px]">
          <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Дата</th>
              <th className="text-left px-5 py-3">Тип</th>
              <th className="text-left px-5 py-3">Имя</th>
              <th className="text-left px-5 py-3">Телефон</th>
              <th className="text-left px-5 py-3">Тур</th>
              <th className="text-left px-5 py-3">Детали</th>
              <th className="text-left px-5 py-3">Комментарий</th>
              <th className="text-left px-5 py-3">Статус</th>
              <th className="text-left px-5 py-3"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {loading && (
              <tr>
                <td
                  colSpan={9}
                  className="px-5 py-10 text-center text-neutral-400"
                >
                  Загрузка…
                </td>
              </tr>
            )}

            {!loading && leads.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-5 py-10 text-center text-neutral-400"
                >
                  Пока нет заявок
                </td>
              </tr>
            )}

            {leads.map((l) => {
              const hasHotelDetails = l.extra?.hotel || l.extra?.room;

              return (
                <tr key={l.id} data-testid={`lead-row-${l.id}`}>
                  <td className="px-5 py-3 text-neutral-500 whitespace-nowrap">
                    {formatDate(l.created_at?.slice(0, 16).replace("T", " "))}
                  </td>

                  <td className="px-5 py-3 text-xs">{l.form_type}</td>

                  <td className="px-5 py-3">{l.name || "—"}</td>

                  <td className="px-5 py-3 font-mono whitespace-nowrap">
                    {l.phone}
                  </td>

                  <td className="px-5 py-3 max-w-[200px]">
                    <div className="font-medium truncate">
                      {l.tour || l.region || "—"}
                    </div>

                    {l.date && (
                      <div className="mt-1 text-xs text-neutral-500 whitespace-nowrap">
                        {l.date}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-3 min-w-[220px]">
                    {hasHotelDetails ? (
                      <div className="rounded-xl border border-orange-100 bg-orange-50/60 px-3 py-2">
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#C2410C]">
                          <Hotel className="size-3.5" />
                          Детали размещения
                        </div>

                        {l.extra?.hotel && (
                          <div className="text-xs text-neutral-700">
                            <span className="font-medium">Отель:</span>{" "}
                            {l.extra.hotel}
                          </div>
                        )}

                        {l.extra?.room && (
                          <div className="mt-1 text-xs text-neutral-700">
                            <span className="font-medium">Номер:</span>{" "}
                            {l.extra.room}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>

                  <td className="px-5 py-3 max-w-[260px] text-neutral-600">
                    <div className="line-clamp-3 whitespace-pre-line">
                      {l.comment || "—"}
                    </div>
                  </td>

                  <td className="px-5 py-3">
                    <Select
                      value={l.status || "new"}
                      onValueChange={(v) => onStatus(l.id, v)}
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.v} value={s.v}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  <td className="px-5 py-3">
                    <button
                      onClick={() => onDelete(l.id)}
                      className="text-neutral-400 hover:text-red-600"
                      data-testid={`lead-delete-${l.id}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
