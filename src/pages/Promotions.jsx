import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getInitialCollection } from "@/lib/pageBootstrap";
import { Link } from "react-router-dom";
import { Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LeadDialog from "@/components/LeadDialog";
import { useSiteData } from "@/lib/useSiteData";
import { mediaUrl } from "@/lib/media";
import PageSeo from "@/components/PageSeo";
import StaticPageIntro from "@/components/StaticPageIntro";
import { RichText } from "@/lib/richText";
import { formatDate } from "@/lib/formatDate";

export default function Promotions() {
  const { tours } = useSiteData();
  const [items, setItems] = useState(() => getInitialCollection("promotions"));
  const [pickedTour, setPickedTour] = useState(null);
  const [detailsPromotion, setDetailsPromotion] = useState(null);
  useEffect(() => {
    api.get("/promotions").then((r) => setItems(r.data)).catch(() => {});
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
      <StaticPageIntro
        pageKey="promotions"
        overline="Акции"
        heading="Спецпредложения сезона"
      />

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {items.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl overflow-hidden border border-neutral-200 bg-white flex flex-col"
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
            <div className="p-6 flex flex-col">
              <div className="inline-flex items-center gap-2 text-xs text-[#C2410C] uppercase tracking-wider font-medium">
                <Tag className="size-3.5" /> Акция
              </div>

              <h2 className="font-heading text-2xl mt-2">{p.title}</h2>

              <div
                className="mt-3 text-sm leading-6 text-neutral-600 overflow-hidden"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  maxHeight: "4.5rem",
                }}
              >
                <RichText text={p.description} />
              </div>

              <button
                type="button"
                onClick={() => setDetailsPromotion(p)}
                className="mt-3 w-fit text-sm font-medium text-[#C2410C] hover:text-[#9A3412]"
              >
                Подробнее об акции
              </button>

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

              <div className="mt-5 flex flex-wrap gap-3">
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

      <Dialog
        open={!!detailsPromotion}
        onOpenChange={(v) => !v && setDetailsPromotion(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-3xl">
              {detailsPromotion?.title}
            </DialogTitle>
          </DialogHeader>

          {detailsPromotion?.image && (
            <img
              src={mediaUrl(detailsPromotion.image)}
              alt={detailsPromotion.title}
              className="mt-2 h-72 w-full rounded-2xl object-cover"
              loading="lazy"
            />
          )}

          {detailsPromotion?.valid_until && (
            <p className="text-xs text-neutral-500 inline-flex items-center gap-1">
              <Calendar className="size-3.5" /> Действует до{" "}
              {formatDate(detailsPromotion.valid_until)}
            </p>
          )}

          <RichText
            text={detailsPromotion?.description}
            className="text-sm leading-6 text-neutral-700"
          />

          {detailsPromotion && getRelatedTours(detailsPromotion).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {getRelatedTours(detailsPromotion).map((tour) => (
                <Link
                  key={tour.slug}
                  to={`/tours/${tour.slug}`}
                  onClick={() => setDetailsPromotion(null)}
                  className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-[#C2410C] hover:bg-orange-100"
                >
                  {tour.title}
                </Link>
              ))}
            </div>
          )}

          <Button
            onClick={() => {
              setPickedTour(detailsPromotion);
              setDetailsPromotion(null);
            }}
            className="w-fit rounded-full bg-[#C2410C] hover:bg-[#9A3412] text-white"
          >
            Получить условия
          </Button>
        </DialogContent>
      </Dialog>

      <LeadDialog
        open={!!pickedTour}
        onOpenChange={(v) => !v && setPickedTour(null)}
        title={pickedTour?.title}
        description="Расскажите контакты — менеджер свяжется и расскажет условия акции."
      />
    </div>
  );
}
