import { useSiteData } from "@/lib/useSiteData";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  BadgeCheck,
  ExternalLink,
  Navigation,
} from "lucide-react";
import LeadForm from "@/components/LeadForm";
import PageSeo from "@/components/PageSeo";
import StaticPageIntro from "@/components/StaticPageIntro";

const DEFAULT_PHONES = [
  {
    label: "Грузия и Дагестан",
    phone: "636-99-11",
    link: "+375296369911",
  },
  {
    label: "Питер и Карелия",
    phone: "636-22-99",
    link: "+375296362299",
  },
];

const phoneTel = (phone) => String(phone || "").replace(/[^\d]/g, "");

function getContactPhones(settings) {
  if (
    Array.isArray(settings?.contact_phones) &&
    settings.contact_phones.length
  ) {
    return settings.contact_phones.filter((item) => item?.phone);
  }

  if (Array.isArray(settings?.header_phones) && settings.header_phones.length) {
    return settings.header_phones.filter((item) => item?.phone);
  }

  if (settings?.phone) {
    return [
      {
        label: "Общий номер",
        phone: settings.phone,
        link: settings.phone_link || settings.phone,
      },
    ];
  }

  return DEFAULT_PHONES;
}

function buildMapData(settings) {
  const address = settings?.address || "Минск, Площадь Свободы 23, офис 16А";
  const encoded = encodeURIComponent(address);

  return {
    iframeSrc:
      settings?.map_embed_url ||
      settings?.map_iframe_url ||
      `https://yandex.ru/map-widget/v1/?text=${encoded}&z=16`,
    mapUrl: settings?.map_url || `https://yandex.ru/maps/?text=${encoded}&z=16`,
    routeUrl:
      settings?.map_route_url ||
      `https://yandex.ru/maps/?rtext=~${encoded}&rtt=auto`,
  };
}

export default function Contacts() {
  const { settings, tours } = useSiteData();
  if (!settings) return null;

  const contactPhones = getContactPhones(settings);
  const map = buildMapData(settings);

  return (
    <div
      className="section-container pt-32 lg:pt-36 pb-16 lg:pb-24"
      data-testid="contacts-page"
    >
      <PageSeo
        pageKey="contacts"
        path="/contacts"
        title="Контакты TRAVELSPACE"
        description="Свяжитесь с TRAVELSPACE: телефоны, email, офис, режим работы и форма заявки на подбор тура."
      />
      <StaticPageIntro
        pageKey="contacts"
        overline="Контакты"
        heading="Свяжитесь с нами"
        headingClassName=""
      />

      <div className="mt-12 grid lg:grid-cols-2 gap-10">
        <div className="space-y-6 text-neutral-800">
          <div className="rounded-2xl border border-neutral-200 p-6 space-y-4">
            <Row icon={Phone} label="Телефоны">
              <div className="space-y-2">
                {contactPhones.map((item, index) => (
                  <a
                    key={`${item.link || item.phone}-${index}`}
                    href={`tel:${phoneTel(item.link || item.phone)}`}
                    className="block rounded-xl bg-orange-50/60 px-3 py-2 transition hover:bg-orange-100 hover:text-[#C2410C]"
                  >
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                      {item.label || "Менеджер"}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold text-neutral-900">
                      A1/MTS: {item.phone}
                    </span>
                  </a>
                ))}
              </div>
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

          <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-white">
            <div className="aspect-[16/10] bg-neutral-100">
              <iframe
                src={map.iframeSrc}
                width="100%"
                height="100%"
                title="Карта офиса TRAVELSPACE"
                className="h-full w-full"
              ></iframe>
            </div>
            <div className="flex flex-col gap-2 border-t border-neutral-200 p-3 sm:flex-row">
              <a
                href={map.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium hover:border-[#C2410C] hover:text-[#C2410C]"
              >
                <ExternalLink className="size-4" /> Открыть на карте
              </a>
              <a
                href={map.routeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#C2410C] px-4 py-2 text-sm font-medium text-white hover:bg-[#9A3412]"
              >
                <Navigation className="size-4" /> Построить маршрут
              </a>
            </div>
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
        <div className="mt-1 text-sm">{children}</div>
      </div>
    </div>
  );
}
