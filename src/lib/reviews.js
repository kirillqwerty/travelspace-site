import { richTextToPlain } from "@/lib/richText";

export function parseReviewDate(value) {
  const text = String(value || "").trim();
  if (!text) return null;

  const display = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const parts = display
    ? [Number(display[3]), Number(display[2]), Number(display[1])]
    : iso
      ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
      : null;
  if (!parts) return null;

  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date
    : null;
}

export function sortReviewsByDate(items = []) {
  return [...items].sort((left, right) => {
    const leftDate = parseReviewDate(left?.date)?.getTime();
    const rightDate = parseReviewDate(right?.date)?.getTime();
    if (leftDate != null && rightDate != null) {
      if (leftDate !== rightDate) return rightDate - leftDate;
    } else {
      if (leftDate != null) return -1;
      if (rightDate != null) return 1;
    }
    return Number(left?.order ?? 999999) - Number(right?.order ?? 999999);
  });
}

export function reviewsStructuredData(items = []) {
  const reviews = sortReviewsByDate(items).filter(
    (item) => String(item?.text || "").trim(),
  );
  if (!reviews.length) return undefined;

  return {
    "@type": "ItemList",
    itemListElement: reviews.map((review, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Review",
        author: {
          "@type": "Person",
          name: review.name || "Клиент TRAVELSPACE",
        },
        reviewBody: richTextToPlain(review.text),
        ...(parseReviewDate(review.date)
          ? { datePublished: parseReviewDate(review.date).toISOString().slice(0, 10) }
          : {}),
        reviewRating: {
          "@type": "Rating",
          ratingValue: Math.min(5, Math.max(1, Number(review.rating) || 5)),
          bestRating: 5,
        },
        itemReviewed: { "@type": "TravelAgency", name: "TRAVELSPACE" },
      },
    })),
  };
}
