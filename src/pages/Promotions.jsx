import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeadDialog from "@/components/LeadDialog";

export default function Promotions() {
  const formatDate = (date) => {
    if (!date) return "";

    const d = new Date(date);

    return d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const [items, setItems] = useState([]);
  const [pickedTour, setPickedTour] = useState(null);
  useEffect(() => {
    api.get("/promotions").then((r) => setItems(r.data));
  }, []);

  return (
    <div
      className="section-container pt-32 lg:pt-36 pb-16 lg:pb-24"
      data-testid="promotions-page"
    >
      <p className="overline text-[#C2410C]">Акции</p>
      <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mt-3 max-w-3xl">
        Спецпредложения сезона
      </h1>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {items.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl overflow-hidden border border-neutral-200 bg-white flex flex-col h-full"
          >
            {p.image && (
              <div className="h-64 bg-neutral-100">
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              <div className="inline-flex items-center gap-2 text-xs text-[#C2410C] uppercase tracking-wider font-medium">
                <Tag className="size-3.5" /> Акция
              </div>
              <h2 className="font-heading text-2xl mt-2">{p.title}</h2>
              <p className="text-sm text-neutral-600 mt-3 leading-relaxed">
                {p.description}
              </p>
              {p.valid_until && (
                <p className="mt-4 text-xs text-neutral-500 inline-flex items-center gap-1">
                  <Calendar className="size-3.5" /> Действует до
                  {formatDate(p.valid_until)}
                </p>
              )}
              <div className="mt-auto pt-5 flex gap-3">
                <Button
                  onClick={() => setPickedTour(p)}
                  className="rounded-full bg-[#C2410C] hover:bg-[#9A3412] text-white"
                >
                  Получить условия
                </Button>
                {p.related_tour_slug && (
                  <Link
                    to={`/tours/${p.related_tour_slug}`}
                    className="rounded-full border border-neutral-300 hover:border-neutral-500 px-4 py-2 text-sm font-medium grid place-items-center"
                  >
                    К туру →
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <LeadDialog
        open={!!pickedTour}
        onOpenChange={(v) => !v && setPickedTour(null)}
        title={pickedTour?.title}
        description="Расскажите контакты — менеджер свяжется и расскажет условия акции."
      />
    </div>
  );
}
