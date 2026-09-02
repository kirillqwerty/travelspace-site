import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import PageSeo from "@/components/PageSeo";
import TourCard from "@/components/TourCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSiteData } from "@/lib/useSiteData";
import {
  filterToursForLanding,
  getTourLanding,
  TOUR_LANDING_LINKS,
} from "@/lib/seoLandings";
import { RichText } from "@/lib/richText";

function richTextToPlain(value = "") {
  return String(value || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/[*_`#>]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function TourLanding({ slug }) {
  const { tours, ready, settings } = useSiteData();
  const landing = getTourLanding(settings, slug);
  const matchingTours = filterToursForLanding(tours, slug);
  const relatedLinks = TOUR_LANDING_LINKS.filter((item) => item.slug !== slug);

  if (!landing) return null;

  const contentSections = Array.isArray(landing.content_sections)
    ? landing.content_sections.filter(
        (section) => section?.title?.trim() && section?.text?.trim(),
      )
    : [];
  const hasContentBlock = Boolean(
    landing.content_title?.trim() &&
      (landing.content_body?.trim() || contentSections.length),
  );
  const faqItems = Array.isArray(landing.faq_items)
    ? landing.faq_items.filter(
        (item) => item?.question?.trim() && item?.answer?.trim(),
      )
    : [];
  const faqStructuredData = faqItems.length
    ? {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: richTextToPlain(item.question),
          acceptedAnswer: {
            "@type": "Answer",
            text: richTextToPlain(item.answer),
          },
        })),
      }
    : undefined;

  return (
    <div className="bg-white">
      <PageSeo
        title={landing.title}
        description={landing.description}
        path={`/tours/${slug}`}
        structuredData={faqStructuredData}
      />

      <section className="border-b border-neutral-200 bg-neutral-50 pt-28 pb-12 lg:pt-36 lg:pb-16">
        <div className="section-container">
          <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-neutral-500">
            <Link to="/" className="hover:text-orange-600">Главная</Link>
            <span aria-hidden="true"> / </span>
            <Link to="/tours" className="hover:text-orange-600">Туры</Link>
            <span aria-hidden="true"> / </span>
            <span>{landing.heading}</span>
          </nav>
          <h1 className="font-heading text-4xl font-bold leading-tight text-neutral-950 sm:text-5xl lg:text-6xl">
            {landing.heading}
          </h1>
          <RichText
            text={landing.intro}
            className="mt-5 w-full text-lg leading-relaxed text-neutral-600"
            paragraphClassName="leading-relaxed"
          />
        </div>
      </section>

      <section className="section-container py-14 lg:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-600">Актуальные программы</p>
            <h2 className="font-heading mt-2 text-3xl font-bold text-neutral-950">Выберите подходящий тур</h2>
          </div>
          <Link to="/tours" className="inline-flex items-center gap-2 font-semibold text-orange-600 hover:text-orange-700">
            Весь каталог <ArrowRight className="size-4" />
          </Link>
        </div>

        {matchingTours.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {matchingTours.map((tour) => <TourCard key={tour.id || tour.slug} tour={tour} />)}
          </div>
        ) : (
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-8 text-neutral-600">
            {ready
              ? "Новые даты для этого направления скоро появятся. Оставьте заявку — менеджер предложит альтернативу."
              : "Загружаем актуальные программы…"}
          </div>
        )}
      </section>

      {hasContentBlock && (
        <section className="border-t border-neutral-200 bg-neutral-50 py-14 lg:py-20">
          <div className="section-container">
            <h2 className="font-heading text-3xl font-bold leading-tight text-neutral-950 sm:text-4xl">
              {landing.content_title}
            </h2>
            {landing.content_body?.trim() && (
              <RichText
                text={landing.content_body}
                className="mt-6 w-full text-base leading-7 text-neutral-700 sm:text-lg"
                paragraphClassName="leading-7"
              />
            )}

            {contentSections.length > 0 && (
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {contentSections.map((section, index) => (
                  <section
                    key={`${section.title}-${index}`}
                    className="rounded-2xl border border-neutral-200 bg-white p-6"
                  >
                    <h3 className="font-heading text-2xl font-semibold leading-tight text-neutral-950">
                      {section.title}
                    </h3>
                    <RichText
                      text={section.text}
                      className="mt-4 leading-7 text-neutral-600"
                      paragraphClassName="leading-7"
                    />
                  </section>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="border-y border-neutral-200 bg-neutral-950 py-14 text-white lg:py-20">
        <div className="section-container grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-orange-400">Перед бронированием</p>
            <h2 className="font-heading mt-3 text-3xl font-bold">
              {landing.how_to_title || "Как выбрать тур"}
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-white/70">
              Сравните даты, длительность, программу, отели и услуги, включённые в стоимость. На странице каждого тура указаны все детали поездки.
            </p>
          </div>
          <ul className="space-y-4 text-white/85">
            {["Проверьте город и время отправления", "Сравните основную и дополнительную стоимость", "Изучите программу по дням и условия проживания"].map((item) => (
              <li key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-orange-400" />{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-container py-14 lg:py-20">
        <h2 className="font-heading text-3xl font-bold text-neutral-950">Другие направления</h2>
        <nav aria-label="Другие направления" className="mt-6 flex flex-wrap gap-3">
          {relatedLinks.map((item) => (
            <Link key={item.slug} to={item.path} className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold transition hover:border-orange-500 hover:text-orange-600">
              {item.label}
            </Link>
          ))}
        </nav>
      </section>

      {faqItems.length > 0 && (
        <section className="border-t border-neutral-200 bg-neutral-50 py-14 lg:py-20">
          <div className="section-container">
            <h2 className="font-heading text-3xl font-bold text-neutral-950 sm:text-4xl">
              {landing.faq_title || "Частые вопросы о турах"}
            </h2>
            <Accordion
              type="single"
              collapsible
              className="mt-8 rounded-2xl border border-neutral-200 bg-white px-5 sm:px-7"
            >
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={`${item.question}-${index}`}
                  value={`faq-${index}`}
                  className="last:border-b-0"
                >
                  <AccordionTrigger className="py-5 text-base font-semibold text-neutral-950 sm:text-lg">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent forceMount className="pb-5">
                    <RichText
                      text={item.answer}
                      className="w-full leading-7 text-neutral-600"
                      paragraphClassName="leading-7"
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}
    </div>
  );
}
