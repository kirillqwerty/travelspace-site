import {
  CreditCard,
  FileCheck,
  MessageSquare,
  Phone,
  BadgeCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

const STEPS = [
  {
    icon: MessageSquare,
    t: "Оставьте заявку",
    d: "На сайте, в мессенджере или по телефону — как вам удобнее.",
  },
  {
    icon: Phone,
    t: "Поговорите с менеджером",
    d: "Уточняем детали тура, даты, количество туристов, особые пожелания.",
  },
  {
    icon: FileCheck,
    t: "Заключаем договор",
    d: "Подписываем договор, выдаём номер договора для оплаты через ЕРИП.",
  },
  {
    icon: CreditCard,
    t: "Оплата через ЕРИП",
    d: "Платите в любом банке Беларуси или мобильном приложении.",
  },
  {
    icon: BadgeCheck,
    t: "Выезд в путешествие",
    d: "Получаете памятку, сопровождение менеджера и едете отдыхать.",
  },
];

export default function Payment() {
  return (
    <div className="section-container section-pad" data-testid="payment-page">
      <p className="overline text-[#C2410C]">Оплата</p>
      <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mt-3 max-w-3xl">
        Оплата тура через ЕРИП
      </h1>
      <p className="text-neutral-700 mt-4 max-w-2xl leading-relaxed">
        Бронирование и оплата происходят после общения с менеджером и подписания
        договора. Сам платёж проводится через систему ЕРИП — самым удобным для
        вас способом.
      </p>

      <div className="mt-12 grid md:grid-cols-2 gap-6">
        {STEPS.map((s, i) => (
          <div
            key={s.t}
            className="rounded-2xl border border-neutral-200 p-6 relative"
          >
            <span className="absolute -top-3 left-6 font-heading text-xs uppercase tracking-wider bg-[#C2410C] text-white px-2 py-1 rounded">
              Шаг {i + 1}
            </span>
            <span className="size-10 rounded-xl bg-orange-50 grid place-items-center text-[#C2410C] mt-4">
              <s.icon className="size-5" />
            </span>
            <h3 className="font-heading text-xl mt-4">{s.t}</h3>
            <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
              {s.d}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-2xl bg-neutral-50 border border-neutral-200 p-6 sm:p-8">
        <h2 className="font-heading text-2xl">Как оплатить через ЕРИП</h2>
        <ol className="mt-4 space-y-2.5 text-sm text-neutral-700 list-decimal pl-5">
          <li>Зайдите в приложение интернет-банкинга или банкомат.</li>
          <li>Выберите раздел «ЕРИП» / «Система Расчёт».</li>
          <li>Перейдите: Туризм → Туроператоры → TRAVELSPACE (демо).</li>
          <li>Введите номер договора, выданный менеджером.</li>
          <li>Подтвердите сумму и проведите оплату.</li>
        </ol>
        <p className="text-xs text-neutral-500 mt-4">
          Возникли вопросы по оплате?{" "}
          <Link to="/contacts" className="underline text-[#C2410C]">
            Свяжитесь с менеджером
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
