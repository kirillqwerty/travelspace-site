import {
  getYoutubeEmbedUrl,
  getYoutubeThumbnail,
  getYoutubeVideoId,
} from "@/lib/youtube";

describe("YouTube URL normalization", () => {
  test.each([
    ["dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=12", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    [
      '<iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0"></iframe>',
      "dQw4w9WgXcQ",
    ],
  ])("extracts an ID from %s", (value, expected) => {
    expect(getYoutubeVideoId(value)).toBe(expected);
  });

  test("rejects arbitrary HTML and non-YouTube URLs", () => {
    expect(getYoutubeVideoId('<script>alert("x")</script>')).toBe("");
    expect(getYoutubeVideoId("https://example.com/dQw4w9WgXcQ")).toBe("");
  });

  test("builds privacy-enhanced lazy embed assets", () => {
    expect(getYoutubeEmbedUrl("dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
    );
    expect(getYoutubeThumbnail("dQw4w9WgXcQ")).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
  });
});
