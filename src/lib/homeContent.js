export const DEFAULT_HOME_PAGE = {
  h1: "Автобусные туры из Минска",
  intro_title: "Автобусные туры из Минска и Беларуси",
  intro_text:
    "TRAVELSPACE организует автобусные туры из Минска и других городов Беларуси. В программах заранее указаны маршрут, даты, проживание, экскурсии и состав стоимости.\n\nВыберите подходящее направление в каталоге [автобусных туров из Минска](/tours/avtobusnye-iz-minska) — менеджер поможет сравнить программы и оформить поездку.",
  tours_title: "Популярные автобусные туры из Минска",
  directions_title: "Куда можно поехать из Минска на автобусе",
  directions_sections: [
    {
      title: "Экскурсионные туры",
      text: "Для насыщенной поездки подойдут туры в [Санкт-Петербург](/tours/sankt-peterburg), [Дагестан](/tours/dagestan), [Карелию](/tours/kareliya) и [Арктику](/tours/arktika).",
      link_label: "Все экскурсионные туры",
      link_url: "/tours/avtobusnye-iz-minska",
    },
    {
      title: "Автобусные туры на море",
      text: "Автобусные туры на море сочетают организованный выезд, проживание и отдых. Посмотрите программы поездок в [Грузию](/tours/gruziya) и [Абхазию](/tours/abhaziya).",
      link_label: "Выбрать тур на море",
      link_url: "/tours/avtobusnye-iz-minska",
    },
  ],
  faq_title: "Частые вопросы об автобусных турах из Минска",
};

function safeContentUrl(value = "") {
  const url = String(value || "").trim();
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return "";
}

export function getHomePageContent(settings) {
  const configured = settings?.home_page || {};
  const configuredSections = Array.isArray(configured.directions_sections)
    ? configured.directions_sections
        .filter((section) => section?.title || section?.text)
        .map((section) => ({
          title: String(section.title || "").trim(),
          text: String(section.text || "").trim(),
          link_label: String(section.link_label || "").trim(),
          link_url: safeContentUrl(section.link_url),
        }))
    : DEFAULT_HOME_PAGE.directions_sections;

  const content = { ...DEFAULT_HOME_PAGE };
  [
    "h1",
    "intro_title",
    "intro_text",
    "tours_title",
    "directions_title",
    "faq_title",
  ].forEach((key) => {
    const value = configured[key];
    if (typeof value === "string" && value.trim()) content[key] = value.trim();
  });

  return {
    ...content,
    directions_sections: configuredSections.length
      ? configuredSections
      : DEFAULT_HOME_PAGE.directions_sections,
  };
}
