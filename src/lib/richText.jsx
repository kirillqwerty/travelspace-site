import { Fragment } from "react";

import checkIcon from "@/assets/rich-icons/check.svg";
import minusIcon from "@/assets/rich-icons/minus.svg";
import warningIcon from "@/assets/rich-icons/warning.svg";
import triangleIcon from "@/assets/rich-icons/triangle.svg";

export const RICH_TEXT_ICONS = [
  { token: ":check:", label: "Галочка", icon: checkIcon },
  { token: ":minus:", label: "Минус", icon: minusIcon },
  { token: ":warning:", label: "Внимание", icon: warningIcon },
  { token: ":triangle:", label: "Маркер", icon: triangleIcon },
];

const ICON_BY_TOKEN = RICH_TEXT_ICONS.reduce((acc, item) => {
  acc[item.token] = item;
  return acc;
}, {});

const INLINE_RE = /(:check:|:minus:|:warning:|:triangle:|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|__[^_]+__|_[^_]+_|https?:\/\/[^\s]+)/g;

function isSafeUrl(url = "") {
  return (
    /^https?:\/\//i.test(url) ||
    (url.startsWith("/") && !url.startsWith("//"))
  );
}

function renderRichIcon(token, key) {
  const item = ICON_BY_TOKEN[token];

  if (!item) return token;

  return (
    <img
      key={key}
      src={item.icon}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className="mx-0.5 inline-block h-[1.15em] w-[1.15em] shrink-0 object-contain align-[-0.18em]"
    />
  );
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

    if (ICON_BY_TOKEN[match]) {
      parts.push(renderRichIcon(match, key));
    } else if (match.startsWith("[") && match.includes("](")) {
      const matchLink = match.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (matchLink) {
        const [, label, href] = matchLink;
        parts.push(
          isSafeUrl(href) ? (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
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
          rel="noopener noreferrer"
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
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);
}

function splitSemanticHeading(block = "") {
  const markdown = String(block).match(/^##\s+([^\n]+)(?:\n+([\s\S]+))?$/);
  if (markdown) return { heading: markdown[1], body: markdown[2] || "" };

  const numbered = String(block).match(/^(\d+)\.\s+(.+?[.!?])(?:\s+([\s\S]+))?$/);
  if (!numbered) return null;
  return {
    heading: `${numbered[1]}. ${numbered[2]}`,
    body: numbered[3] || "",
  };
}

export function RichText({
  text,
  className = "",
  paragraphClassName = "",
  semanticHeadings = false,
}) {
  const blocks = splitRichTextBlocks(text);

  if (!blocks.length) return null;

  return (
    <div className={className}>
      {blocks.map((block, blockIndex) => {
        const semantic = semanticHeadings ? splitSemanticHeading(block) : null;
        if (semantic) {
          return (
            <div key={`block-${blockIndex}`} className={blockIndex > 0 ? "mt-7" : ""}>
              <h2 className="font-heading text-2xl font-semibold leading-tight text-neutral-950 sm:text-3xl">
                {renderInline(semantic.heading, `heading-${blockIndex}`)}
              </h2>
              {semantic.body && (
                <p className={`mt-3 ${paragraphClassName}`.trim()}>
                  {renderInline(semantic.body, `heading-body-${blockIndex}`)}
                </p>
              )}
            </div>
          );
        }
        const lines = block.split("\n");

        return (
          <p
            key={`block-${blockIndex}`}
            className={`${blockIndex > 0 ? "mt-2" : ""} ${paragraphClassName}`.trim()}
          >
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
