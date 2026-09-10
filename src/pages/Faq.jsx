import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import PageSeo from "@/components/PageSeo";
import StaticPageIntro from "@/components/StaticPageIntro";
import { RichText } from "@/lib/richText";
import { getInitialCollection } from "@/lib/pageBootstrap";

export default function Faq() {
  const [items, setItems] = useState(() => getInitialCollection("faq"));
  useEffect(() => {
    api.get("/faq").then((r) => setItems(r.data)).catch(() => {});
  }, []);
  const grouped = items.reduce((acc, it) => {
    const c = it.category || "Общее";
    (acc[c] ??= []).push(it);
    return acc;
  }, {});

  return (
    <div className="section-container section-pad" data-testid="faq-page">
      <PageSeo
        pageKey="faq"
        path="/faq"
        title="Частые вопросы о турах | TRAVELSPACE"
        description="Ответы на частые вопросы о бронировании, оплате, поездках, документах и автобусных турах TRAVELSPACE."
      />
      <StaticPageIntro
        pageKey="faq"
        overline="FAQ"
        heading="Частые вопросы"
        description="Собрали то, о чём спрашивают чаще всего. Если вашего вопроса нет — напишите менеджеру."
      />

      <div className="mt-8 space-y-6">
        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat}>
            <p className="overline text-neutral-500">{cat}</p>
            <Accordion
              type="single"
              collapsible
              className="mt-3 border-y border-neutral-200"
            >
              {list.map((q) => (
                <AccordionItem key={q.id} value={q.id} className="px-1">
                  <AccordionTrigger className="py-2.5 text-left text-base font-medium">
                    {q.question}
                  </AccordionTrigger>
                  <AccordionContent
                    forceMount
                    className="pb-2.5 text-neutral-700 leading-relaxed"
                  >
                    <RichText text={q.answer} className="text-sm leading-6" />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </div>
  );
}
