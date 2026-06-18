import { Link } from "react-router-dom";
import { CheckCircle2, Home, RotateCcw } from "lucide-react";
import PageSeo from "@/components/PageSeo";

export default function Thanks() {
  return (
    <div
      className="section-container pt-32 lg:pt-36 pb-16 lg:pb-24"
      data-testid="thanks-page"
    >
      <PageSeo
        pageKey="thanks"
        path="/thanks"
        title="Спасибо за заявку | TRAVELSPACE"
        description="Спасибо за заявку. Менеджер TRAVELSPACE свяжется с вами в ближайшее время."
      />

      <div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="relative bg-neutral-950 px-6 py-12 text-center text-white sm:px-10 lg:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.35),transparent_42%),linear-gradient(135deg,rgba(194,65,12,0.65),transparent_48%)]" />
          <div className="relative mx-auto grid size-16 place-items-center rounded-full bg-white text-[#C2410C] shadow-xl shadow-orange-950/20">
            <CheckCircle2 className="size-9" />
          </div>
          <p className="relative mt-6 text-orange-200">Заявка отправлена</p>
          <h1 className="relative mt-3 font-heading text-4xl sm:text-5xl lg:text-6xl">
            Спасибо!
          </h1>
          <p className="relative mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            Мы получили вашу заявку. Менеджер TRAVELSPACE свяжется с вами в ближайшее время.
          </p>
        </div>

        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <div className="rounded-3xl border border-orange-100 bg-orange-50 px-5 py-5 text-center sm:px-7">
            <p className="text-base font-semibold leading-relaxed text-neutral-900 sm:text-lg">
              Если в течение часа мы Вам не перезвоним, пожалуйста оставьте еще раз заявку, скорее всего Вы ошиблись в номере
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 px-6 py-3 text-sm font-bold text-neutral-900 transition hover:border-[#C2410C] hover:text-[#C2410C]"
            >
              <Home className="size-4" /> На главную
            </Link>
            <Link
              to="/tours"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C2410C] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#9A3412]"
            >
              <RotateCcw className="size-4" /> Посмотреть туры
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
