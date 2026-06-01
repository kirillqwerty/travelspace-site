import { useSiteData } from "@/lib/useSiteData";
import { Phone, Mail, MapPin, Clock, BadgeCheck } from "lucide-react";
import LeadForm from "@/components/LeadForm";

export default function Contacts() {
  const { settings, tours } = useSiteData();
  if (!settings) return null;

  return (
    <div className="section-container pt-32 lg:pt-36 pb-16 lg:pb-24" data-testid="contacts-page">
      <p className="overline text-[#C2410C]">Контакты</p>
      <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl mt-3">
        Свяжитесь с нами
      </h1>

      <div className="mt-12 grid lg:grid-cols-2 gap-10">
        <div className="space-y-6 text-neutral-800">
          <div className="rounded-2xl border border-neutral-200 p-6 space-y-4">
            <Row icon={Phone} label="Телефон">
              <a
                href={`tel:${settings.phone_link}`}
                className="hover:text-[#C2410C]"
              >
                {settings.phone}
              </a>
            </Row>
            <Row icon={Mail} label="Email">
              <a
                href={`mailto:${settings.email}`}
                className="hover:text-[#C2410C]"
              >
                {settings.email}
              </a>
            </Row>
            <Row icon={MapPin} label="Офис">
              {settings.address}
            </Row>
            <Row icon={Clock} label="Режим работы">
              {settings.work_hours}
            </Row>
          </div>

          {/* Personalization block (moved here from home per requirements doc) */}
          <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-6">
            <p className="overline text-[#C2410C]">Помочь с выбором</p>
            <h2 className="font-heading text-2xl sm:text-3xl mt-2">
              Подберём идеальный тур по вашему запросу
            </h2>
            <p className="text-sm text-neutral-600 mt-3 max-w-md leading-relaxed">
              Оставьте телефон — мы перезвоним в течение часа в рабочее время и
              расскажем о ближайших датах.
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-neutral-700">
              {[
                "Перезвоним в рабочее время в течение часа",
                "Без навязчивых продаж — рассказываем как есть",
                "Подберём, даже если ещё не решили, куда хотите",
              ].map((x) => (
                <p key={x} className="flex items-start gap-3">
                  <BadgeCheck className="size-5 text-[#C2410C] mt-0.5 shrink-0" />
                  <span>{x}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-neutral-200 aspect-[16/10]">
            <iframe
              title="Карта"
              src="https://yandex.ru/map-widget/v1/?ll=27.561481%2C53.902284&z=12"
              className="w-full h-full"
              loading="lazy"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-neutral-200 p-6 sm:p-8 lg:sticky lg:top-32 lg:self-start">
          <h2 className="font-heading text-2xl">Напишите нам</h2>
          <p className="text-sm text-neutral-600 mt-1">
            Менеджер свяжется в течение часа в рабочее время.
          </p>
          <div className="mt-5">
            <LeadForm tours={tours} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="size-9 rounded-xl grid place-items-center bg-orange-50 text-[#C2410C]">
        <Icon className="size-4" />
      </span>
      <div className="flex-1">
        <p className="overline text-neutral-500">{label}</p>
        <p className="mt-1 text-sm">{children}</p>
      </div>
    </div>
  );
}
