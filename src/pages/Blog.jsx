import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import PageSeo from "@/components/PageSeo";

function articlePreviewImage(article) {
  return (
    article.cover ||
    article.seo_image ||
    (Array.isArray(article.gallery) ? article.gallery.find(Boolean) : "") ||
    (Array.isArray(article.images) ? article.images.find(Boolean) : "") ||
    ""
  );
}

export default function Blog() {
  const [items, setItems] = useState([]);
  const formatDate = (date) => {
    if (!date) return "";

    const d = new Date(date);

    return d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    api
      .get("/articles")
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []));
  }, []);

  return (
    <div
      className="section-container pt-32 lg:pt-36 pb-16 lg:pb-24"
      data-testid="blog-page"
    >
      <PageSeo
        pageKey="blog"
        path="/blog"
        title="Блог о путешествиях | TRAVELSPACE"
        description="Полезные статьи, чек-листы и советы для комфортных путешествий и автобусных туров."
      />
      <p className="overline text-[#C2410C]">Блог</p>
      <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mt-3 max-w-3xl">
        Полезное о путешествиях
      </h1>
      <p className="text-neutral-600 mt-3 max-w-2xl">
        Чек-листы, советы и истории из дороги, чтобы ваша поездка была
        комфортнее.
      </p>

      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((a) => {
          const preview = articlePreviewImage(a);

          return (
            <Link
              key={a.id || a.slug}
              to={`/blog/${a.slug}`}
              className="card-img-zoom-trigger group block rounded-2xl border border-neutral-200 overflow-hidden bg-white hover:shadow-lg transition"
              data-testid={`article-card-${a.slug}`}
            >
              <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
                {preview ? (
                  <img
                    src={mediaUrl(preview)}
                    alt={a.title}
                    className="w-full h-full object-cover card-img-zoom"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-50 to-neutral-100 px-6 text-center text-sm font-medium text-neutral-500">
                    {a.title}
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs text-neutral-500">
                  {formatDate(a.published_at)}
                </p>
                <h3 className="font-heading text-xl mt-2 group-hover:text-[#C2410C] transition-colors line-clamp-3">
                  {a.title}
                </h3>
                <p className="text-sm text-neutral-600 mt-2 line-clamp-3">
                  {a.excerpt}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
