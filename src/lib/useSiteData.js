import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { isTourShownInCatalog } from "@/lib/tourVisibility";

export function useSiteData() {
  const [data, setData] = useState({
    settings: null,
    tours: [],
    specialists: [],
    articles: [],
    ready: false,
  });

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api
        .get("/settings")
        .then((r) => r.data)
        .catch(() => ({})),
      api
        .get("/tours")
        .then((r) => r.data)
        .catch(() => []),
      api
        .get("/specialists")
        .then((r) => r.data)
        .catch(() => []),
      api
        .get("/articles")
        .then((r) => r.data)
        .catch(() => []),
    ]).then(([settings, tours, specialists, articles]) => {
      if (cancelled) return;

      setData({
        settings,
        tours: Array.isArray(tours) ? tours.filter(isTourShownInCatalog) : [],
        specialists,
        articles,
        ready: true,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
