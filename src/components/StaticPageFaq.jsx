import { useLocation } from "react-router-dom";
import { useSiteData } from "@/lib/useSiteData";
import { RichInline, RichText } from "@/lib/richText";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";

export const validFaqItems = (items) => (Array.isArray(items) ? items : []).filter((item) => item?.question?.trim() && item?.answer?.trim());

export default function StaticPageFaq() {
  const { pathname } = useLocation();
  const { settings } = useSiteData();
  const config = Object.values(settings?.seo_pages || {}).find((page) => page.path === pathname);
  const items = validFaqItems(config?.faq_items);
  if (!items.length) return null;
  return <section className="section-container pb-12" aria-label="Частые вопросы">
    <h2 className="font-heading text-3xl mb-4">{config.faq_title || "Частые вопросы"}</h2>
    <Accordion type="single" collapsible>{items.map((item, index) => <AccordionItem key={index} value={String(index)}>
      <AccordionTrigger className="py-2.5"><RichInline text={item.question} links={false} /></AccordionTrigger>
      <AccordionContent forceMount className="pb-2.5"><RichText text={item.answer} /></AccordionContent>
    </AccordionItem>)}</Accordion>
  </section>;
}
