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
  return <HighlightedTitle record={tour} />;
}

const renderHighlightedParts = (parts) =>
  parts.map((part, index) =>
    part.bold ? <strong key={index} className="font-extrabold text-[#C2410C]">{part.text}</strong> : part.text,
  );

const highlightTermsInText = (text, terms) => {
  const source = String(text || "");
  const normalizedSource = source.toLocaleLowerCase("ru");
  const normalizedTerms = terms
    .map((term) => String(term || "").trim())
    .filter(Boolean)
    .map((term) => ({ source: term, normalized: term.toLocaleLowerCase("ru") }));
  const parts = [];
  let cursor = 0;

  while (cursor < source.length) {
    const next = normalizedTerms
      .map((term) => ({ ...term, index: normalizedSource.indexOf(term.normalized, cursor) }))
      .filter((term) => term.index >= 0)
      .sort((left, right) => left.index - right.index || right.normalized.length - left.normalized.length)[0];
    if (!next) {
      parts.push({ text: source.slice(cursor), bold: false });
      break;
    }
    if (next.index > cursor) {
      parts.push({ text: source.slice(cursor, next.index), bold: false });
    }
    const end = next.index + next.normalized.length;
    parts.push({ text: source.slice(next.index, end), bold: true });
    cursor = end;
  }

  return parts.length ? parts : [{ text: source, bold: false }];
};

export function HighlightedTitle({ record, text }) {
  const parsed = parseTourTitle(getTourTitleDraft(record));
  const displayText = text == null ? parsed.title : String(text);
  const parts = displayText === parsed.title
    ? parsed.parts
    : highlightTermsInText(
        displayText,
        parsed.parts.filter((part) => part.bold).map((part) => part.text),
      );
  return renderHighlightedParts(parts);
}
