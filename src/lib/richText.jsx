import ResponsiveLink from "@/components/ResponsiveLink";
import { Fragment } from "react";
import { normalizeMarkdownLinks, tokenizeRichText, tokensToPlain, isSafeRichUrl } from "./richTextTokens";

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

function renderTokens(tokens, keyPrefix, links) {
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if (token.type === "text") return token.text;
    if (token.type === "icon") return renderRichIcon(token.text, key);
    const children = renderTokens(token.children, key, token.type === "link" ? false : links);
    if (token.type === "link") return links && isSafeRichUrl(token.href)
      ? <ResponsiveLink key={key} href={token.href} target="_blank" rel="noopener noreferrer" className="text-[#C2410C] no-underline hover:text-[#9A3412] [overflow-wrap:anywhere]" style={{ fontWeight: "inherit" }}>{children}</ResponsiveLink>
      : <Fragment key={key}>{children}</Fragment>;
    if (token.type === "bold") return <strong key={key} className="font-bold text-inherit">{children}</strong>;
    if (token.type === "underline") return <u key={key} className="underline underline-offset-4">{children}</u>;
    return <em key={key} className="italic">{children}</em>;
  });
}

function renderInline(text = "", keyPrefix = "rt", links = true) {
  return renderTokens(tokenizeRichText(text), keyPrefix, links);
}

export function splitRichTextBlocks(text = "") {
  return normalizeMarkdownLinks(text)
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);
}

export function richTextToPlain(value = "") {
  return tokensToPlain(tokenizeRichText(value))
    .replace(/<[^>]*>/g, " ")
    .replace(/^[\s*_]+$/, "")
    .replace(/[`#>]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

export function RichInline({ text, className = "", links = true }) {
  return <span className={className}>{renderInline(text, "inline", links)}</span>;
}
