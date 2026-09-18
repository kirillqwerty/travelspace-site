import { useEffect, useLayoutEffect, useState } from "react";
import { api } from "@/lib/api";
import { completePageMount, getPageBootstrap, invalidatePageBootstrap } from "@/lib/pageBootstrap";

function initialState(kind, slug) {
  const path = `${kind === "articles" ? "/blog" : `/${kind}`}/${slug}`;
  const page = getPageBootstrap(path);
  return { key: `${kind}/${slug}`, record: page?.record?.slug === slug ? page.record : null,
    notFound: page?.status === 404, failed: false };
}

export function usePublicRecord(kind, slug) {
  const key = `${kind}/${slug}`;
  const [state, setState] = useState(() => initialState(kind, slug));
  const [attempt, setAttempt] = useState(0);
  // Never render a previous URL's record while the new effect is starting.
  const current = state.key === key ? state : initialState(kind, slug);

  useEffect(() => {
    let active = true;
    let controller;
    let sequence = 0;
    const initial = initialState(kind, slug);
    setState(initial);
    const request = () => {
      controller?.abort();
      controller = new AbortController();
      const requestId = ++sequence;
      api.get(`/${kind}/${encodeURIComponent(slug)}`, { signal: controller.signal }).then(({ data }) => {
        if (!active || requestId !== sequence) return;
        if (!data || data.slug !== slug) throw new Error("Unexpected page response");
        if (getPageBootstrap()) invalidatePageBootstrap();
        setState({ key, record: data, notFound: false, failed: false });
      }).catch((error) => {
        if (!active || requestId !== sequence || controller.signal.aborted) return;
        const notFound = error.response?.status === 404 || error.response?.status === 410;
        if (notFound && getPageBootstrap()) invalidatePageBootstrap();
        setState((previous) => ({ key,
          record: notFound ? null : previous.key === key ? previous.record : null,
          notFound, failed: !notFound }));
      });
    };
    // A direct visit already has complete data. Revalidate only on a later focus
    // or explicit retry, without clearing the visible record while waiting.
    if ((!initial.record && !initial.notFound) || attempt > 0) request();
    window.addEventListener("focus", request);
    return () => { active = false; controller?.abort(); window.removeEventListener("focus", request); };
  }, [kind, slug, key, attempt]);

  useLayoutEffect(() => {
    if (current.record || current.notFound) completePageMount();
  }, [current.record, current.notFound]);

  return { ...current, retry: () => setAttempt((value) => value + 1) };
}
