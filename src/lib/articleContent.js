// Existing articles keep their historical paragraph/photo order until edited.
// An explicit empty block list means empty content, never a legacy fallback.
export function getArticleBlocks(article = {}) {
  if (Array.isArray(article.content_blocks)) return article.content_blocks;
  const paragraphs = String(article.content || "").replace(/\r\n/g, "\n").split(/\n\s*\n/).filter((text) => text.trim());
  const gallery = Array.isArray(article.gallery) ? article.gallery : article.images || [];
  const images = gallery.map((src, index) => ({ id: `legacy-image-${index}`, type: "image", src, alt: article.gallery_alts?.[index] || article.image_alts?.[index] || "" }))
    .filter((block) => block.src && block.src !== article.cover);
  const result = [];
  let nextImage = 0;
  paragraphs.forEach((text, index) => {
    result.push({ id: `legacy-text-${index}`, type: "text", text });
    if (index % 2 === 1 && images[nextImage]) result.push(images[nextImage++]);
  });
  return [...result, ...images.slice(nextImage)];
}

export const articleBlockText = (blocks) => blocks.filter((block) => block.type === "text").map((block) => block.text || "").join("\n\n");

export function moveArticleBlock(blocks, from, to) {
  if (from < 0 || to < 0 || from >= blocks.length || to >= blocks.length) return blocks;
  const next = [...blocks];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}
