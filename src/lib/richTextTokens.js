// Small, deterministic parser for the formatting supported by our editors.
// Brackets and URL parentheses are balanced; URLs are never parsed as emphasis.
export function normalizeMarkdownLinks(text = "") {
  return String(text || "").replace(/\](?:\s|\u200B|\uFEFF|&nbsp;|&#(?:32|160);|&#x(?:20|a0);)*\(/gi, "](");
}

export function isSafeRichUrl(value = "") {
  const url = String(value).trim();
  if (/[\s\\\u0000-\u001f\u007f]/.test(url)) return false;
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  try { return /^https?:$/i.test(new URL(url).protocol); } catch { return false; }
}

function closingBracket(text, start, open, close) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "\\") { i++; continue; }
    if (text[i] === open) depth++;
    if (text[i] === close && --depth === 0) return i;
  }
  return -1;
}

export function readMarkdownLink(text, start = 0) {
  if (text[start] !== "[") return null;
  const labelEnd = closingBracket(text, start, "[", "]");
  if (labelEnd < 0 || text[labelEnd + 1] !== "(") return null;
  const end = closingBracket(text, labelEnd + 1, "(", ")");
  if (end < 0) return null;
  return { label: text.slice(start + 1, labelEnd), href: text.slice(labelEnd + 2, end).trim(), start, labelEnd, end: end + 1 };
}

export function tokenizeRichText(value, depth = 0) {
  const text = normalizeMarkdownLinks(value);
  if (depth > 30) return [{ type: "text", text }];
  const result = [];
  const pushText = (value) => {
    if (result.at(-1)?.type === "text") result[result.length - 1].text += value;
    else result.push({ type: "text", text: value });
  };
  for (let i = 0; i < text.length;) {
    if (text[i] === "\\" && /[\\[\]()*_]/.test(text[i + 1] || "")) { pushText(text[i + 1]); i += 2; continue; }
    const link = readMarkdownLink(text, i);
    if (link) {
      result.push({ type: "link", href: link.href, children: tokenizeRichText(link.label, depth + 1) });
      i = link.end; continue;
    }
    const url = text.slice(i).match(/^https?:\/\/[^\s<>]+/i)?.[0];
    if (url) {
      let href = url.replace(/[.,!?:;]+$/, "");
      while (href.endsWith(")") && (href.match(/\)/g) || []).length > (href.match(/\(/g) || []).length) href = href.slice(0, -1);
      result.push({ type: "link", href, children: [{ type: "text", text: href }] });
      i += href.length; continue;
    }
    const icon = text.slice(i).match(/^:(check|minus|warning|triangle):/)?.[0];
    if (icon) { result.push({ type: "icon", text: icon }); i += icon.length; continue; }
    const marker = text.startsWith("**", i) ? "**" : text.startsWith("___", i) ? "___" : text.startsWith("__", i) ? "__" : text[i] === "_" ? "_" : null;
    let end = -1;
    if (marker && !(marker.includes("_") && /[\p{L}\p{N}]/u.test(text[i - 1] || ""))) {
      for (let j = i + marker.length; j < text.length; j++) {
        if (text[j] === "\\") { j++; continue; }
        const nestedLink = readMarkdownLink(text, j);
        if (nestedLink) { j = nestedLink.end - 1; continue; }
        if (marker === "_" && text.startsWith("__", j)) {
          const nestedEnd = text.indexOf("__", j + 2);
          if (nestedEnd >= 0) { j = nestedEnd + 1; continue; }
        }
        if (text.startsWith(marker, j) && j > i + marker.length) { end = j; break; }
      }
    }
    if (end !== -1) {
      const children = tokenizeRichText(text.slice(i + marker.length, end), depth + 1);
      result.push(marker === "___" ? { type: "underline", children: [{ type: "italic", children }] } : { type: marker === "**" ? "bold" : marker === "__" ? "underline" : "italic", children });
      i = end + marker.length; continue;
    }
    pushText(text[i++]);
  }
  return result;
}

export function tokensToPlain(tokens) {
  return tokens.map((token) => token.children ? tokensToPlain(token.children) : token.type === "icon" ? "" : token.text).join("");
}
