// Formatting belongs only to the navigation label. Keep tour.title plain for
// H1, SEO metadata, booking forms, PDF exports and automatic slugs.
export function parseTourTitle(value = "") {
  const source = String(value ?? "");
  const parts = [];
  const pattern = /\*\*([^*]+)\*\*/g;
  let start = 0;
  let match;
  const plain = (text) => text.replace(/\*\*/g, "");
  while ((match = pattern.exec(source))) {
    if (match.index > start) parts.push({ text: plain(source.slice(start, match.index)), bold: false });
    parts.push({ text: match[1], bold: true });
    start = pattern.lastIndex;
  }
  if (start < source.length) parts.push({ text: plain(source.slice(start)), bold: false });
  return { title: parts.map((part) => part.text).join(""), parts };
}

export function getTourTitleDraft(tour = {}) {
  const title = String(tour.title ?? "");
  const highlighted = tour.title_highlighted;
  // An old label must never override a renamed tour (e.g. after duplication).
  return typeof highlighted === "string" && parseTourTitle(highlighted).title === title
    ? highlighted
    : title;
}

export function tourTitleFields(value) {
  const source = String(value ?? "");
  return {
    title: parseTourTitle(source).title,
    title_highlighted: source.includes("**") ? source : "",
  };
}

export function TourMenuTitle({ tour }) {
  return parseTourTitle(getTourTitleDraft(tour)).parts.map((part, index) =>
    part.bold ? <strong key={index} className="font-extrabold text-[#C2410C]">{part.text}</strong> : part.text,
  );
}
