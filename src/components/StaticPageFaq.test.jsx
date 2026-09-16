import { getStaticPageFaqConfig } from "@/lib/staticPageFaq";

const settings = {
  seo_pages: {
    home: {
      path: "/",
      faq_items: [{ question: "Устаревший вопрос", answer: "Ответ" }],
    },
    about: {
      path: "/about",
      faq_items: [{ question: "Вопрос о компании", answer: "Ответ" }],
    },
  },
};

test("never renders the legacy static FAQ on the homepage", () => {
  expect(getStaticPageFaqConfig(settings, "/")).toBeNull();
});

test("keeps additional FAQ available on other static pages", () => {
  expect(getStaticPageFaqConfig(settings, "/about")).toEqual(
    settings.seo_pages.about,
  );
});
