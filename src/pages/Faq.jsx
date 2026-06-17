import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import PageSeo from "@/components/PageSeo";
import { RichText } from "@/lib/richText";

export default function Faq() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/faq").then((r) => setItems(r.data));
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
      <p className="overline text-[#C2410C]">FAQ</p>
      <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mt-3 max-w-3xl">
        Частые вопросы
      </h1>
      <p className="text-neutral-600 mt-3 max-w-2xl">
        Собрали то, о чём спрашивают чаще всего. Если вашего вопроса нет —
        напишите менеджеру.
      </p>

      <div className="mt-12 space-y-10">
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
                  <AccordionTrigger className="text-left text-base font-medium py-5">
                    {q.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-700 leading-relaxed">
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
