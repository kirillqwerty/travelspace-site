import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

export default function Blog() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/articles").then((r) => setItems(r.data));
  }, []);

  return (
    <div className="section-container section-pad" data-testid="blog-page">
      <p className="overline text-[#C2410C]">Блог</p>
      <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mt-3 max-w-3xl">Полезное о путешествиях</h1>
      <p className="text-neutral-600 mt-3 max-w-2xl">
        Чек-листы, советы и истории из дороги, чтобы ваша поездка была комфортнее.
      </p>

      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((a) => (
          <Link
            key={a.id}
            to={`/blog/${a.slug}`}
            className="card-img-zoom-trigger group block rounded-2xl border border-neutral-200 overflow-hidden bg-white hover:shadow-lg transition"
            data-testid={`article-card-${a.slug}`}
          >
            {a.cover && (
              <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
                <img src={a.cover} alt={a.title} className="w-full h-full object-cover card-img-zoom" loading="lazy" />
              </div>
            )}
            <div className="p-5">
              <p className="text-xs text-neutral-500">{a.published_at}</p>
              <h3 className="font-heading text-xl mt-2 group-hover:text-[#C2410C] transition-colors line-clamp-3">{a.title}</h3>
              <p className="text-sm text-neutral-600 mt-2 line-clamp-3">{a.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
