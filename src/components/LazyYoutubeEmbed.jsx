import { useState } from "react";
import { Play } from "lucide-react";
import {
  getYoutubeEmbedUrl,
  getYoutubeThumbnail,
  getYoutubeVideoId,
} from "@/lib/youtube";

export default function LazyYoutubeEmbed({ value, title, className = "" }) {
  const [playing, setPlaying] = useState(false);
  const videoId = getYoutubeVideoId(value);

  if (!videoId) return null;

  const accessibleTitle = title || "Видео TRAVELSPACE";

  return (
    <div
      className={`relative aspect-video overflow-hidden rounded-2xl bg-neutral-950 shadow-sm ${className}`.trim()}
      data-testid="lazy-youtube-embed"
    >
      {playing ? (
        <iframe
          src={getYoutubeEmbedUrl(videoId)}
          title={accessibleTitle}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 w-full"
          aria-label={`Воспроизвести: ${accessibleTitle}`}
        >
          <img
            src={getYoutubeThumbnail(videoId)}
            alt=""
            width="1280"
            height="720"
            className="h-full w-full object-cover opacity-90 transition group-hover:opacity-75"
            loading="lazy"
            decoding="async"
          />
          <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#C2410C] text-white shadow-xl transition group-hover:scale-105">
            <Play className="ml-1 size-7 fill-current" aria-hidden="true" />
          </span>
        </button>
      )}
    </div>
  );
}
