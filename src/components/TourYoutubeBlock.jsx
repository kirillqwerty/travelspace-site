import LazyYoutubeEmbed from "@/components/LazyYoutubeEmbed";
import { getYoutubeVideoId } from "@/lib/youtube";

export default function TourYoutubeBlock({ value, title, children }) {
  const videoId = getYoutubeVideoId(value);
  if (!videoId) return null;
  const heading = String(title || "").trim() || "Видео о туре";

  return (
    <section data-testid="tour-youtube" className="min-w-0">
      {children}
      <p className="overline text-[#C2410C]">Путешествие в кадре</p>
      <h2 className="font-heading mt-2 mb-6 break-words text-3xl leading-tight sm:text-4xl">
        {heading}
      </h2>
      <LazyYoutubeEmbed key={videoId} value={videoId} title={heading} />
    </section>
  );
}
