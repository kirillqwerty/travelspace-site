import PageSeo from "@/components/PageSeo";
import StaticPageIntro from "@/components/StaticPageIntro";

export default function Legal() {
  return (
    <div
      className="section-container section-pad max-w-3xl"
      data-testid="legal-page"
    >
      <PageSeo
        pageKey="legal"
        path="/legal"
        title="Юридическая информация | TRAVELSPACE"
        description="Политика конфиденциальности, согласие на обработку персональных данных, публичный договор и реквизиты TRAVELSPACE."
      />
      <StaticPageIntro
        pageKey="legal"
        overline="Документы"
        heading="Юридическая информация"
        headingClassName=""
      />

      <section className="mt-12 prose prose-neutral max-w-none">
        <h2 className="font-heading text-2xl">Политика конфиденциальности</h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Мы собираем минимум данных, необходимых для обработки вашей заявки:
          имя, телефон, выбранное направление, комментарий. Данные используются
          исключительно для связи с вами и заключения договора. Мы не передаём
          их третьим лицам, не используем для нерелевантных рассылок и храним
          столько, сколько необходимо для оказания услуги.
        </p>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Вы вправе в любой момент запросить удаление своих данных, написав на
          e-mail компании.
        </p>

        <h2 className="font-heading text-2xl mt-10" id="offer">
          Публичный договор
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Условия оказания туристических услуг, права и обязанности сторон,
          порядок оплаты, отмены тура и возврата средств описаны в публичном
          договоре оказания туристических услуг.
        </p>
        <p>
          <a
            href="/public-contract.pdf"
            target="_blank"
            rel="noreferrer"
            className="not-prose inline-flex items-center justify-center rounded-full bg-[#C2410C] px-6 py-3 text-sm font-bold text-white no-underline transition hover:bg-[#9A3412]"
          >
            Открыть публичный договор
          </a>
        </p>

        <h2 className="font-heading text-2xl mt-10">
          Согласие на обработку персональных данных
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Отправляя заявку, вы подтверждаете согласие на сбор, хранение и
          обработку указанных вами персональных данных в целях оказания услуг и
          связи с вами.
        </p>

        <h2 className="font-heading text-2xl mt-10">Реквизиты компании</h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          ООО «Пространство Путешествий». УНП 193738609. Зарегистрированы в
          реестре субъектов туристической деятельности РБ, №1310.
        </p>
      </section>
    </div>
  );
}
