import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import LeadForm from "@/components/LeadForm";
import { useSiteData } from "@/lib/useSiteData";

export default function Article() {
  const { slug } = useParams();
  const [a, setA] = useState(null);
  const [error, setError] = useState(false);
  const { tours } = useSiteData();

  useEffect(() => {
    setA(null);
    setError(false);
    api.get(`/articles/${slug}`).then((r) => setA(r.data)).catch(() => setError(true));
  }, [slug]);

  if (error) {
    return (
      <div className="section-container section-pad text-center">
        <h1 className="font-heading text-3xl">Статья не найдена</h1>
        <Link to="/blog" className="text-[#C2410C] underline mt-4 inline-block">К блогу</Link>
      </div>
    );
  }
  if (!a) return <div className="section-container section-pad text-neutral-400">Загрузка…</div>;

  return (
    <article className="section-container py-12 lg:py-20 max-w-3xl" data-testid="article-page">
      <Link to="/blog" className="text-xs text-neutral-500 hover:text-[#C2410C]">← В блог</Link>
      <p className="text-xs text-neutral-500 mt-6">{a.published_at}</p>
      <h1 className="font-heading text-4xl sm:text-5xl mt-2">{a.title}</h1>
      {a.cover && (
        <div className="mt-8 aspect-[16/9] rounded-2xl overflow-hidden">
          <img src={a.cover} alt={a.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="prose max-w-none mt-10 text-base text-neutral-800 leading-relaxed whitespace-pre-line">{a.content}</div>

      <div className="mt-16 rounded-2xl border border-neutral-200 p-6 sm:p-8 bg-neutral-50">
        <h3 className="font-heading text-2xl">Хотите такой же тур?</h3>
        <p className="text-sm text-neutral-600 mt-1">Оставьте телефон, менеджер подберёт и расскажет о ближайших датах.</p>
        <div className="mt-5">
          <LeadForm tours={tours} compact />
        </div>
      </div>
    </article>
  );
}
