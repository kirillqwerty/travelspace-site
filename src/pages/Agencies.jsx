import LeadForm from "@/components/LeadForm";
import { Bus, Users, ShieldCheck, BadgeCheck } from "lucide-react";

export default function Agencies() {
  return (
    <div data-testid="agencies-page">
      <section className="relative h-[45vh] overflow-hidden">
        <img
          src="https://images.pexels.com/photos/14749518/pexels-photo-14749518.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1600"
          alt="Агентствам"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
        <div className="relative h-full section-container flex flex-col justify-end pb-10 text-white">
          <p className="overline text-white/85">Агентствам</p>
          <h1 className="font-heading text-4xl lg:text-6xl mt-2 max-w-3xl">Работаем с турагентствами по всей Беларуси</h1>
        </div>
      </section>

      <section className="section-container py-14 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <p className="text-lg text-neutral-700 leading-relaxed">
            Сотрудничаем с агентствами на прозрачных условиях: фиксированные комиссии, оперативные подтверждения,
            готовые рекламные материалы и поддержка вашего менеджера на каждом этапе.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { i: Bus, t: "Гарантированные блок-места", d: "Закрепляем места под ваше агентство на пиковые даты." },
              { i: Users, t: "Поддержка от профильного менеджера", d: "Один человек ведёт ваши группы — без передачи между отделами." },
              { i: BadgeCheck, t: "Готовые материалы", d: "Программы, фото, описания, презентации — берите и продавайте." },
              { i: ShieldCheck, t: "Договор и закрывающие документы", d: "Работаем по официальному договору, с полной отчётностью." },
            ].map((b) => (
              <div key={b.t} className="rounded-2xl border border-neutral-200 p-5">
                <span className="size-9 rounded-xl bg-orange-50 grid place-items-center text-[#C2410C]">
                  <b.i className="size-4" />
                </span>
                <h3 className="font-heading text-xl mt-3">{b.t}</h3>
                <p className="text-sm text-neutral-600 mt-1.5">{b.d}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-2xl border border-neutral-200 p-6 sm:p-8 bg-neutral-50">
            <h2 className="font-heading text-2xl">Заявка от агентства</h2>
            <p className="text-sm text-neutral-600 mt-1">Заполните форму — ваш персональный менеджер свяжется в течение рабочего дня.</p>
            <div className="mt-5">
              <LeadForm variant="agency" ctaLabel="Отправить заявку" />
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
