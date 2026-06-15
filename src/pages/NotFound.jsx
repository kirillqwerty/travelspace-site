import { Link } from "react-router-dom";
import PageSeo from "@/components/PageSeo";

export default function NotFound() {
  return (
    <div className="section-container py-32 text-center" data-testid="notfound-page">
      <PageSeo title="Страница не найдена | TRAVELSPACE" description="Страница не найдена." path="/404" noIndex />
      <p className="font-heading text-7xl lg:text-8xl text-[#C2410C]">404</p>
      <h1 className="font-heading text-3xl sm:text-4xl mt-3">Эту страницу мы пока не отметили на карте</h1>
      <p className="text-neutral-600 mt-3 max-w-md mx-auto">Похоже, маршрут выбран неверно. Давайте вернёмся к проверенным направлениям.</p>
      <Link to="/" className="inline-block mt-8 rounded-full bg-[#C2410C] hover:bg-[#9A3412] text-white px-6 py-3 text-sm font-medium">
        На главную
      </Link>
    </div>
  );
}
