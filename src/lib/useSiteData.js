import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Cached site-level data used across the site.
 * - settings: company settings
 * - tours: list of public tours (replaces former "directions")
 * - specialists: managers grouped by region_slug
 */
export function useSiteData() {
  const [data, setData] = useState({
    settings: null,
    tours: [],
    specialists: [],
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
    ]).then(([settings, tours, specialists]) => {
      if (cancelled) return;
      setData({ settings, tours, specialists, ready: true });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
