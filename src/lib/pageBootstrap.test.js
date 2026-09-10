import {
  readPageBootstrap, preserveServerPage, completePageMount, publicNavigationUrl,
} from "./pageBootstrap";

afterEach(() => {
  document.body.innerHTML = "";
  window.history.replaceState({}, "", "/");
});

test.each(["/admin", "/admin/", "/admin/login", "/admin/tours", "/admin/settings"])(
  "%s discards a legacy SEO snapshot without hiding the admin interface", (path) => {
    window.history.replaceState({}, "", path);
    document.body.innerHTML = '<div id="initial-load-cover"></div><div id="root" hidden><div data-seo-prerender="true">Страница не найдена</div></div>';
    preserveServerPage();
    expect(document.getElementById("root").hidden).toBe(false);
    expect(document.querySelector("[data-seo-prerender]")).toBeNull();
    expect(document.getElementById("initial-load-cover")).toBeNull();
  },
);

test("server content remains visible until the actual page commits", () => {
  document.body.innerHTML = '<div id="initial-load-cover"></div><div id="root"><div data-seo-prerender="true"><h1>Тур в Грузию</h1><p>Полная программа</p></div></div>';
  preserveServerPage();
  const root = document.getElementById("root");
  const snapshot = document.querySelector("[data-seo-prerender]");
  root.textContent = "Suspense fallback";
  expect(root.hidden).toBe(true);
  expect(snapshot.parentElement).toBe(document.body);
  expect(snapshot.hidden).toBe(false);
  expect(snapshot.textContent).toContain("Полная программа");
  expect(document.getElementById("initial-load-cover")).not.toBeNull();
  root.innerHTML = "<h1>Тур в Грузию</h1><p>Полная программа</p>";
  completePageMount();
  expect(root.hidden).toBe(false);
  expect(document.querySelector("[data-seo-prerender]")).toBeNull();
  expect(document.getElementById("initial-load-cover")).toBeNull();
  expect(document.querySelectorAll("h1")).toHaveLength(1);
});

test("bootstrap accepts supported data and rejects broken or unknown versions", () => {
  const script = document.createElement("script");
  script.id = "page-bootstrap";
  script.type = "application/json";
  document.body.append(script);
  for (const value of ["{", '{"version":2}', "null"]) {
    script.textContent = value;
    expect(readPageBootstrap()).toBeNull();
  }
  const data = { version: 1, path: "/tours/test", seo: { title: "Тур" }, site: {} };
  script.textContent = JSON.stringify(data);
  expect(readPageBootstrap()).toEqual(data);
});

function linkEvent(href, props = {}, target = "") {
  const link = document.createElement("a");
  link.href = href;
  link.target = target;
  return { target: link, button: 0, ...props };
}

test("public links request a complete document, but same-page anchors stay local", () => {
  const location = new URL("http://localhost/tours/one");
  expect(publicNavigationUrl(linkEvent("/tours/two"), location)).toBe("http://localhost/tours/two");
  expect(publicNavigationUrl(linkEvent("/blog/article"), location)).toBe("http://localhost/blog/article");
  expect(publicNavigationUrl(linkEvent("/tours/one#dates"), location)).toBeNull();
  expect(publicNavigationUrl(linkEvent("/admin"), location)).toBeNull();
  expect(publicNavigationUrl(linkEvent("https://example.com/tours/two"), location)).toBeNull();
  expect(publicNavigationUrl(linkEvent("/tours/two", {}, "_blank"), location)).toBeNull();
  for (const props of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }, { defaultPrevented: true }]) {
    expect(publicNavigationUrl(linkEvent("/tours/two", props), location)).toBeNull();
  }
  const download = linkEvent("/tours/two");
  download.target.setAttribute("download", "program.pdf");
  expect(publicNavigationUrl(download, location)).toBeNull();
});
