export default function Legal() {
  return (
    <div className="section-container section-pad max-w-3xl" data-testid="legal-page">
      <p className="overline text-[#C2410C]">Документы</p>
      <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mt-3">Юридическая информация</h1>

      <section className="mt-12 prose prose-neutral max-w-none">
        <h2 className="font-heading text-2xl">Политика конфиденциальности</h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Мы собираем минимум данных, необходимых для обработки вашей заявки: имя, телефон, выбранное направление,
          комментарий. Данные используются исключительно для связи с вами и заключения договора. Мы не передаём их
          третьим лицам, не используем для нерелевантных рассылок и храним столько, сколько необходимо для оказания
          услуги.
        </p>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Вы вправе в любой момент запросить удаление своих данных, написав на e-mail компании.
        </p>

        <h2 className="font-heading text-2xl mt-10" id="offer">Публичный договор</h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Условия оказания туристических услуг, права и обязанности сторон, порядок отмены и возврата средств
          описаны в договоре, который вы заключаете с менеджером перед оплатой. Демо-версия документа доступна по
          запросу.
        </p>

        <h2 className="font-heading text-2xl mt-10">Согласие на обработку персональных данных</h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          Отправляя заявку, вы подтверждаете согласие на сбор, хранение и обработку указанных вами персональных
          данных в целях оказания услуг и связи с вами.
        </p>

        <h2 className="font-heading text-2xl mt-10">Реквизиты компании</h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          ООО «Туроператор» (демо-данные). УНП 100000000. Юридический и фактический адрес: г. Минск, ул. Туристическая, 12.
        </p>
      </section>
    </div>
  );
}
