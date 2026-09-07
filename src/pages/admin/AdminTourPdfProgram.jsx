import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, FileText, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";

const SUMMARY_LABELS = {
  days: "дней программы",
  included: "пунктов включено",
  excluded: "пунктов доплат",
  important_info: "важных условий",
  faq: "вопросов и ответов",
};

export default function AdminTourPdfProgram() {
  const { tourId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/tours/${tourId}/pdf-program`);
      setData(response.data);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Не удалось загрузить данные тура");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId]);

  const pdfUrl = useMemo(() => {
    if (!data?.slug) return "";
    return `${API_BASE}/tours/${encodeURIComponent(data.slug)}/program.pdf`;
  }, [data?.slug]);

  if (loading) {
    return (
      <div className="grid min-h-[45vh] place-items-center">
        <Loader2 className="size-7 animate-spin text-[#C2410C]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        Данные тура не найдены.
      </div>
    );
  }

  const program = data.pdf_program || {};
  const summary = data.summary || {};

  return (
    <div className="mx-auto max-w-5xl" data-testid="admin-tour-pdf-program">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/admin/tours"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
          >
            <ArrowLeft className="size-4" /> К списку туров
          </Link>
          <h1 className="mt-2 font-heading text-2xl sm:text-3xl">PDF-программа</h1>
          <p className="mt-1 text-sm text-neutral-500">{data.title}</p>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={load}>
            <RefreshCw className="mr-1 size-4" /> Обновить данные
          </Button>
          {pdfUrl && (
            <Button asChild className="bg-[#C2410C] text-white hover:bg-[#9A3412]">
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                <Download className="mr-1 size-4" /> Скачать PDF
              </a>
            </Button>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#C2410C] text-white">
            <FileText className="size-5" />
          </span>
          <div>
            <h2 className="font-heading text-xl">Заполнять PDF отдельно больше не нужно</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-700">
              Файл формируется автоматически из карточки тура: берутся название,
              описание, все дни программы без сокращений, даты и цены, варианты
              размещения, состав стоимости, важная информация и ответы на вопросы.
              Если изменить тур, следующая скачанная программа сразу получит новые данные.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="font-heading text-xl">Что попадёт в файл сейчас</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(SUMMARY_LABELS).map(([key, label]) => (
            <div key={key} className="rounded-xl bg-neutral-50 px-4 py-3">
              <p className="font-heading text-2xl font-bold text-[#C2410C]">
                {summary[key] ?? 0}
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-600">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-neutral-200 pt-5 text-sm text-neutral-600">
          <p>
            <b className="text-neutral-900">Заголовок:</b>{" "}
            {program.header_title || data.title}
          </p>
          <p className="mt-2">
            Чтобы изменить содержимое PDF, вернитесь к списку туров и откройте
            обычное редактирование нужного тура.
          </p>
        </div>
      </section>
    </div>
  );
}
