import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeadDialog from "@/components/LeadDialog";
import { useSiteData } from "@/lib/useSiteData";
import { mediaUrl } from "@/lib/media";
import PageSeo from "@/components/PageSeo";
import { RichText } from "@/lib/richText";

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

  const { tours } = useSiteData();
  const [items, setItems] = useState([]);
  const [pickedTour, setPickedTour] = useState(null);
  useEffect(() => {
    api.get("/promotions").then((r) => setItems(r.data));
  }, []);

  const getRelatedSlugs = (p) => {
    if (Array.isArray(p.related_tour_slugs))
      return p.related_tour_slugs.filter(Boolean);
    return p.related_tour_slug ? [p.related_tour_slug] : [];
  };

  const getRelatedTours = (p) => {
    const slugs = getRelatedSlugs(p);
    return tours.filter((tour) => slugs.includes(tour.slug));
  };

  return (
    <div
      className="section-container pt-32 lg:pt-36 pb-16 lg:pb-24"
      data-testid="promotions-page"
    >
      <PageSeo
        pageKey="promotions"
        path="/promotions"
        title="Акции и спецпредложения на туры | TRAVELSPACE"
        description="Актуальные акции, скидки и спецпредложения на автобусные туры из Минска."
      />
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
                  src={mediaUrl(p.image)}
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
              <RichText
                text={p.description}
                className="mt-3 text-sm leading-6 text-neutral-600"
              />
              {p.valid_until && (
                <p className="mt-4 text-xs text-neutral-500 inline-flex items-center gap-1">
                  <Calendar className="size-3.5" /> Действует до{" "}
                  {formatDate(p.valid_until)}
                </p>
              )}

              {getRelatedTours(p).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {getRelatedTours(p).map((tour) => (
                    <Link
                      key={tour.slug}
                      to={`/tours/${tour.slug}`}
                      className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-[#C2410C] hover:bg-orange-100"
                    >
                      {tour.title}
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-5 flex flex-wrap gap-3">
                <Button
                  onClick={() => setPickedTour(p)}
                  className="rounded-full bg-[#C2410C] hover:bg-[#9A3412] text-white"
                >
                  Получить условия
                </Button>
                {getRelatedTours(p)[0] && (
                  <Link
                    to={`/tours/${getRelatedTours(p)[0].slug}`}
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
