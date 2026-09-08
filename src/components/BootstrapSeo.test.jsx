import { act } from "react";
import { createRoot } from "react-dom/client";
import { Helmet, HelmetProvider } from "react-helmet-async";
import BootstrapSeo from "./BootstrapSeo";
import AppStartupBoundary from "./AppStartupBoundary";
import { Seo } from "./Seo";

let mockReady = false;
const mockListeners = new Set();
jest.mock("@/lib/pageBootstrap", () => ({
  isPageMounted: () => mockReady,
  subscribePageMount: (callback) => { mockListeners.add(callback); return () => mockListeners.delete(callback); },
  getPageBootstrap: () => ({ path: "/tours/one", seo: {
    title: "Готовый тур", description: "Программа, даты и стоимость", noIndex: false,
    canonical: "https://travelspace.by/tours/one",
  } }),
}));

let root, container;
const flushHead = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 40)); });
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockReady = false;
  mockListeners.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  await flushHead();
  document.body.innerHTML = "";
});

test("analytics Helmet cannot remove SEO while a route is still loading", async () => {
  await act(async () => root.render(<HelmetProvider><BootstrapSeo />
    <Helmet><meta name="google-site-verification" content="synthetic" /></Helmet>
    <p>Pending lazy route</p>
  </HelmetProvider>));
  await flushHead();
  expect(document.title).toBe("Готовый тур");
  expect(document.querySelector('meta[name="robots"]').content).toBe("index, follow");
  expect(document.querySelector('meta[name="description"]').content).toBe("Программа, даты и стоимость");
  await act(async () => {
    root.render(<HelmetProvider><BootstrapSeo /><Seo title="Готовый тур" description="Программа, даты и стоимость" path="/tours/one" /></HelmetProvider>);
    mockReady = true;
    mockListeners.forEach((listener) => listener());
  });
  await flushHead();
  expect(document.title).toBe("Готовый тур");
  expect(document.querySelectorAll('meta[name="robots"]')).toHaveLength(1);
  expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
});

test("a failed lazy route retains the server document and its metadata", async () => {
  const snapshot = document.createElement("div");
  snapshot.dataset.seoPrerender = "true";
  snapshot.textContent = "Полная программа тура";
  container.before(snapshot);
  const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
  function BrokenRoute() { throw new Error("Synthetic chunk failure"); }
  try {
    await act(async () => root.render(<HelmetProvider><BootstrapSeo />
      <AppStartupBoundary><BrokenRoute /></AppStartupBoundary>
    </HelmetProvider>));
    await flushHead();
    expect(snapshot.isConnected).toBe(true);
    expect(document.title).toBe("Готовый тур");
    expect(document.querySelector('meta[name="robots"]').content).toBe("index, follow");
  } finally { errorLog.mockRestore(); }
});
