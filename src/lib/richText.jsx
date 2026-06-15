import { Fragment } from "react";

const INLINE_RE = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|__[^_]+__|_[^_]+_|https?:\/\/[^\s]+)/g;

function isSafeUrl(url = "") {
  return /^https?:\/\//i.test(url) || url.startsWith("/");
}

function renderInline(text = "", keyPrefix = "rt") {
  const parts = [];
  let lastIndex = 0;
  let index = 0;

  String(text).replace(INLINE_RE, (match, _group, offset) => {
    if (offset > lastIndex) {
      parts.push(String(text).slice(lastIndex, offset));
    }

    const key = `${keyPrefix}-${index++}`;

    if (match.startsWith("[") && match.includes("](")) {
      const matchLink = match.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (matchLink) {
        const [, label, href] = matchLink;
        parts.push(
          isSafeUrl(href) ? (
            <a
              key={key}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
              className="font-medium text-[#C2410C] underline underline-offset-4 hover:text-[#9A3412]"
            >
              {label}
            </a>
          ) : (
            label
          ),
        );
      } else {
        parts.push(match);
      }
    } else if (match.startsWith("**") && match.endsWith("**")) {
      parts.push(
        <strong key={key} className="font-semibold text-neutral-950">
          {match.slice(2, -2)}
        </strong>,
      );
    } else if (match.startsWith("__") && match.endsWith("__")) {
      parts.push(
        <u key={key} className="underline underline-offset-4 decoration-[#C2410C]/50">
          {match.slice(2, -2)}
        </u>,
      );
    } else if (match.startsWith("_") && match.endsWith("_")) {
      parts.push(
        <em key={key} className="italic">
          {match.slice(1, -1)}
        </em>,
      );
    } else if (/^https?:\/\//i.test(match)) {
      parts.push(
        <a
          key={key}
          href={match}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[#C2410C] underline underline-offset-4 hover:text-[#9A3412]"
        >
          {match}
        </a>,
      );
    } else {
      parts.push(match);
    }

    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < String(text).length) {
    parts.push(String(text).slice(lastIndex));
  }

  return parts;
}

export function splitRichTextBlocks(text = "") {
  return String(text || "")
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);
}

export function RichText({ text, className = "", paragraphClassName = "" }) {
  const blocks = splitRichTextBlocks(text);

  if (!blocks.length) return null;

  return (
    <div className={className}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n");

        return (
          <p key={`block-${blockIndex}`} className={paragraphClassName}>
            {lines.map((line, lineIndex) => (
              <Fragment key={`line-${blockIndex}-${lineIndex}`}>
                {lineIndex > 0 && <br />}
                {renderInline(line, `block-${blockIndex}-line-${lineIndex}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function RichInline({ text, className = "" }) {
  return <span className={className}>{renderInline(text, "inline")}</span>;
}
