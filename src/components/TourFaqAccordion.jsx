import { useEffect, useState } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { RichText, richTextToPlain } from "@/lib/richText";

export default function TourFaqAccordion({ items }) {
  const [openAnswers, setOpenAnswers] = useState(["faq-0"]);
  useEffect(() => setOpenAnswers(["faq-0"]), [items]);
  const allOpen = items.every((_, index) => openAnswers.includes(`faq-${index}`));

  return <>
    <div className="mb-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="overline text-[#C2410C]">FAQ</p>
        <h2 className="font-heading mt-2 text-3xl sm:text-4xl">Ответы на популярные вопросы</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600">Нажмите на вопрос, чтобы прочесть ответ, или раскройте все ответы сразу.</p>
      </div>
      <button type="button" data-testid="tour-faq-toggle-all"
        className="min-h-12 shrink-0 rounded-full border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-semibold text-[#9A3412] transition-colors hover:border-orange-300 hover:bg-orange-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-700"
        onClick={() => setOpenAnswers(allOpen ? [] : items.map((_, index) => `faq-${index}`))}>
        {allOpen ? "Свернуть все ответы" : "Раскрыть все ответы"}
      </button>
    </div>
    <Accordion type="multiple" value={openAnswers} onValueChange={setOpenAnswers} className="space-y-3">
      {items.map((item, index) => {
        const value = `faq-${index}`;
        const open = openAnswers.includes(value);
        const preview = richTextToPlain(item.answer);
        return <AccordionItem key={`${item.question}-${index}`} value={value}
          className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white px-4 transition-colors data-[state=open]:border-orange-200 data-[state=open]:bg-orange-50/30 sm:px-6">
          <AccordionTrigger className="gap-3 py-5 text-left hover:no-underline [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-[#C2410C]">
            <span className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-5">
              <span className="min-w-0 flex-1">
                <span className="block break-words text-lg font-semibold leading-6 text-neutral-900 sm:text-xl sm:leading-7">{item.question}</span>
                {!open && preview && <span className="mt-2 block text-sm font-normal leading-6 text-neutral-600 line-clamp-2">{preview.slice(0, 150)}{preview.length > 150 ? "…" : ""}</span>}
                <span className="mt-2 block text-xs font-medium text-[#9A3412]">{open ? "Ответ · нажмите, чтобы свернуть" : "Прочесть ответ полностью"}</span>
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent forceMount className="pb-5 text-neutral-700 leading-relaxed">
            <RichText text={item.answer} className="space-y-3" paragraphClassName="text-sm leading-7" />
          </AccordionContent>
        </AccordionItem>;
      })}
    </Accordion>
  </>;
}
