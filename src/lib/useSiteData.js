import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { isTourShownInCatalog } from "@/lib/tourVisibility";

const EMPTY_DATA = {
  settings: null,
  tours: [],
  articles: [],
  ready: false,
};

let siteDataCache = null;
let siteDataPromise = null;

function loadSiteData() {
  if (siteDataCache) return Promise.resolve(siteDataCache);
  if (siteDataPromise) return siteDataPromise;

  siteDataPromise = Promise.all([
    api.get("/settings").then((response) => response.data).catch(() => ({})),
    api.get("/tours").then((response) => response.data).catch(() => []),
    api.get("/articles").then((response) => response.data).catch(() => []),
  ]).then(([settings, tours, articles]) => {
    siteDataCache = {
      settings,
      tours: Array.isArray(tours) ? tours.filter(isTourShownInCatalog) : [],
      articles: Array.isArray(articles) ? articles : [],
      ready: true,
    };
    siteDataPromise = null;
    return siteDataCache;
  });

  return siteDataPromise;
}

export function invalidateSiteData() {
  siteDataCache = null;
  siteDataPromise = null;
}

export function useSiteData() {
  const [data, setData] = useState(siteDataCache || EMPTY_DATA);

  useEffect(() => {
    let active = true;
    loadSiteData().then((nextData) => {
      if (active) setData(nextData);
    });
    return () => {
      active = false;
    };
  }, []);

  return data;
}
