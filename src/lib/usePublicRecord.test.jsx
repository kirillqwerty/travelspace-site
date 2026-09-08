import { act } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { Seo } from "@/components/Seo";
import { api } from "@/lib/api";
import { getPageBootstrap } from "@/lib/pageBootstrap";
import { usePublicRecord } from "./usePublicRecord";

let mockBootstrap = null;
jest.mock("@/lib/api", () => ({ api: { get: jest.fn() } }));
jest.mock("@/lib/pageBootstrap", () => ({
  getPageBootstrap: (path = global.window.location.pathname) => mockBootstrap?.path === path ? mockBootstrap : null,
  invalidatePageBootstrap: () => { mockBootstrap = null; },
  completePageMount: jest.fn(),
}));

let root, container, latest;
const record = (slug = "one") => ({ slug, title: `Тур ${slug}`, description: "Полная программа и цены", seo_noindex: false });
function seed(kind = "tours", noIndex = false) {
  const path = `/${kind === "tours" ? "tours" : "blog"}/one`;
  window.history.replaceState({}, "", path);
  mockBootstrap = { path, status: 200, record: { ...record(), seo_noindex: noIndex },
    seo: { title: "Название с сервера", description: "Описание с сервера", noIndex,
      canonical: `https://travelspace.by${path}`, image: "https://travelspace.by/og-image.jpg" } };
}

function Page({ kind = "tours", slug = "one" }) {
  latest = usePublicRecord(kind, slug);
  const path = `/${kind === "tours" ? "tours" : "blog"}/${slug}`;
  if (latest.notFound) return <><Seo title="Не найдено" path={path} noIndex /><h1>Не найдено</h1></>;
  if (!latest.record) return <p>{latest.failed ? "Ошибка сети" : "Ожидание"}</p>;
  return <><Seo serverSeo={getPageBootstrap(path)?.seo} title={latest.record.title}
    description={latest.record.description} path={path} noIndex={latest.record.seo_noindex} />
    <h1>{latest.record.title}</h1><p>{latest.record.description}</p></>;
}

const flushHead = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 40)); });
async function render(props = {}) {
  await act(async () => root.render(<HelmetProvider><Page {...props} /></HelmetProvider>));
  await flushHead();
}
async function focus() {
  await act(async () => window.dispatchEvent(new Event("focus")));
  await flushHead();
}
const robots = () => document.querySelector('meta[name="robots"]')?.content;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  mockBootstrap = null;
  api.get.mockReset();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  await flushHead();
  container.remove();
});

test.each(["tours", "articles"])("%s uses the server record immediately without a loading request", async (kind) => {
  seed(kind);
  await render({ kind });
  expect(api.get).not.toHaveBeenCalled();
  expect(container.querySelector("h1").textContent).toBe("Тур one");
  expect(container.textContent).not.toContain("Ожидание");
  expect(document.title).toBe("Название с сервера");
  expect(document.querySelector('meta[name="description"]').content).toBe("Описание с сервера");
  expect(robots()).toBe("index, follow");
  expect(document.querySelectorAll('meta[name="robots"]')).toHaveLength(1);
});

test("network errors keep the complete initial record and indexable metadata", async () => {
  seed();
  await render();
  api.get.mockRejectedValue({ response: { status: 503 } });
  await focus();
  expect(latest.failed).toBe(true);
  expect(latest.notFound).toBe(false);
  expect(container.textContent).toContain("Полная программа");
  expect(document.title).toBe("Название с сервера");
  expect(robots()).toBe("index, follow");
});

test("an intentional noindex is retained, including during a network failure", async () => {
  seed("tours", true);
  await render();
  expect(robots()).toBe("noindex, follow");
  api.get.mockRejectedValue(new Error("offline"));
  await focus();
  expect(robots()).toBe("noindex, follow");
  expect(container.querySelector("h1")).not.toBeNull();
});

test("a confirmed 404 clears the record and marks the missing page noindex", async () => {
  seed();
  await render();
  api.get.mockRejectedValue({ response: { status: 404 } });
  await focus();
  expect(latest.notFound).toBe(true);
  expect(latest.record).toBeNull();
  expect(container.textContent).toBe("Не найдено");
  expect(robots()).toBe("noindex, follow");
});

test("a server-side 404 does not briefly fetch or display loading", async () => {
  seed();
  mockBootstrap = { ...mockBootstrap, status: 404, record: null };
  await render();
  expect(api.get).not.toHaveBeenCalled();
  expect(latest.notFound).toBe(true);
  expect(robots()).toBe("noindex, follow");
});

test("without bootstrap a slow or failed request does not invent noindex or a 404", async () => {
  let reject;
  api.get.mockReturnValue(new Promise((resolve, rejectRequest) => { reject = rejectRequest; }));
  await render();
  expect(latest.notFound).toBe(false);
  expect(robots() || "").not.toContain("noindex");
  await act(async () => reject(new Error("offline")));
  expect(latest.failed).toBe(true);
  expect(latest.notFound).toBe(false);
  expect(robots() || "").not.toContain("noindex");
  api.get.mockResolvedValue({ data: record() });
  await act(async () => latest.retry());
  expect(latest.record.slug).toBe("one");
});

test("a late response from a previous slug cannot replace the current page", async () => {
  let finishOne, finishTwo;
  api.get.mockImplementation((url) => new Promise((resolve) => {
    if (url === "/tours/one") finishOne = resolve;
    else finishTwo = resolve;
  }));
  await render({ slug: "one" });
  const firstSignal = api.get.mock.calls[0][1].signal;
  await render({ slug: "two" });
  expect(firstSignal.aborted).toBe(true);
  await act(async () => finishTwo({ data: record("two") }));
  await act(async () => finishOne({ data: record("one") }));
  expect(latest.record.slug).toBe("two");
  expect(container.querySelector("h1").textContent).toBe("Тур two");
});
