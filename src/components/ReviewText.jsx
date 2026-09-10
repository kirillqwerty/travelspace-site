import { useLayoutEffect, useRef, useState } from "react";
import { RichInline } from "@/lib/richText";

export default function ReviewText({ text }) {
  const ref = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    const measure = () => {
      if (!expanded) setOverflows(element.scrollHeight > element.clientHeight + 1);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, expanded]);
  return <>
    <p ref={ref} className={`mt-3 whitespace-pre-line break-words text-base leading-7 text-neutral-700 ${expanded ? "" : "line-clamp-4"}`}><RichInline text={text} /></p>
    {(overflows || expanded) && <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className="mt-2 text-sm font-semibold text-[#C2410C] hover:text-[#9A3412]">{expanded ? "Свернуть" : "Читать полностью"}</button>}
  </>;
}
