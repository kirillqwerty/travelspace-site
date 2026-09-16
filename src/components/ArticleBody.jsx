import { RichText } from "@/lib/richText";
import { mediaUrl } from "@/lib/media";
import { getArticleBlocks } from "@/lib/articleContent";

export default function ArticleBody({ article }) {
  return <div className="mt-10 space-y-7 text-base leading-relaxed text-neutral-800" data-testid="article-body">
    {getArticleBlocks(article).map((block, index) => block.type === "text" ?
      <RichText key={block.id || index} text={block.text} paragraphClassName="text-[17px] leading-8 text-neutral-800" semanticHeadings /> :
      block.type === "image" && block.src ? <figure key={block.id || index} className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
        <img src={mediaUrl(block.src)} alt={block.alt || article.seo_h1 || article.title || ""} width="1200" height="750" className="h-auto w-full object-cover" loading="lazy" />
      </figure> : null)}
  </div>;
}
