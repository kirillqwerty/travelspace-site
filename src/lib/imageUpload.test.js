import { api } from "./api";
import { compressImage, uploadImage, hasPendingUploads, normalizeImageItems, normalizeRecordImages } from "./imageUpload";
jest.mock("./api", () => ({ api: { post: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
  URL.createObjectURL = jest.fn(() => "blob:fixture");
  URL.revokeObjectURL = jest.fn();
  global.Image = class { constructor() { this.width = 4000; this.height = 3000; } set src(value) { Promise.resolve().then(() => this.onload()); } };
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({ drawImage: jest.fn() }));
  HTMLCanvasElement.prototype.toBlob = jest.fn((callback, type) => callback(new Blob(["image bytes"], { type })));
});

test.each(["image/jpeg", "image/png", "image/webp"])("uploads %s with the actual output type and clears pending state", async (type) => {
  api.post.mockResolvedValue({ data: { url: "/uploads/photo.webp" } });
  const request = uploadImage(new File(["image"], "photo.png", { type }));
  expect(hasPendingUploads()).toBe(true);
  expect(await request).toBe("/uploads/photo.webp");
  expect(hasPendingUploads()).toBe(false);
  const file = api.post.mock.calls[0][1].get("file");
  expect(file.type).toBe(type === "image/jpeg" ? type : "image/webp");
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fixture");
});

test("decode failure releases the object URL and upload lock", async () => {
  global.Image = class { set src(value) { Promise.resolve().then(() => this.onerror()); } };
  await expect(uploadImage(new File(["bad"], "bad.png", { type: "image/png" }))).rejects.toThrow("Не удалось прочитать");
  expect(URL.revokeObjectURL).toHaveBeenCalled();
  expect(hasPendingUploads()).toBe(false);
  expect(api.post).not.toHaveBeenCalled();
});

test("null encoder output is rejected instead of uploading a file containing null", async () => {
  HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => callback(null));
  await expect(compressImage(new File(["image"], "photo.png", { type: "image/png" }))).rejects.toThrow("Не удалось обработать");
});

test("network errors release the lock and allow retry", async () => {
  api.post.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ data: { url: "/uploads/retry.webp" } });
  const file = new File(["image"], "photo.png", { type: "image/png" });
  await expect(uploadImage(file)).rejects.toThrow("offline");
  expect(hasPendingUploads()).toBe(false);
  expect(await uploadImage(file)).toBe("/uploads/retry.webp");
});

test("empty photo slots are removed together with their own ALT text", () => {
  expect(normalizeImageItems(["", "/second.png", "", "/fourth.png"], ["empty", "second", "empty", "fourth"]))
    .toEqual({ image: "/second.png", images: ["/second.png", "/fourth.png"], image_alts: ["second", "fourth"] });
});

test("nested hotel, room and program galleries keep images paired with ALT on save and reopen", () => {
  const record = { program: [{ images: ["", "/day.png"], image_alts: ["empty", "day"], image: "" }], chains: [{ hotels: [{ images: ["", "/hotel.png"], image_alts: ["empty", "hotel"], rooms: [{ gallery: ["", "/room.png"], gallery_alts: ["empty", "room"] }] }] }] };
  const saved = normalizeRecordImages(record);
  expect(saved.program[0]).toEqual({ images: ["/day.png"], image_alts: ["day"], image: "/day.png" });
  expect(saved.chains[0].hotels[0].image_alts).toEqual(["hotel"]);
  expect(saved.chains[0].hotels[0].rooms[0].gallery_alts).toEqual(["room"]);
  expect(normalizeRecordImages(saved)).toEqual(saved);
  expect(record.program[0].images).toHaveLength(2);
});
