import { useSyncExternalStore } from "react";
import { api } from "./api";

let pending = 0;
const listeners = new Set();
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };
export const hasPendingUploads = () => pending > 0;
export const usePendingUploads = () => useSyncExternalStore(subscribe, hasPendingUploads, () => false);
const notify = () => listeners.forEach((listener) => listener());

export function normalizeImageItems(images, alts = []) {
  const pairs = (Array.isArray(images) ? images : []).map((image, index) => ({ image: String(image || "").trim(), alt: String(alts[index] || "").trim() })).filter((item) => item.image);
  return { images: pairs.map((item) => item.image), image_alts: pairs.map((item) => item.alt), image: pairs[0]?.image || "" };
}

export function normalizeRecordImages(value) {
  if (Array.isArray(value)) return value.map(normalizeRecordImages);
  if (!value || typeof value !== "object") return value;
  const result = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeRecordImages(item)]));
  for (const key of ["images", "gallery"]) {
    if (!Array.isArray(value[key])) continue;
    const altKey = key === "images" ? "image_alts" : "gallery_alts";
    const normalized = normalizeImageItems(value[key], value[altKey]);
    result[key] = normalized.images;
    if (Array.isArray(value[altKey])) result[altKey] = normalized.image_alts;
    if (key === "images" && "image" in value) result.image = normalized.image;
  }
  return result;
}

export async function compressImage(file, maxSize = 1920) {
  if (!file?.type?.startsWith("image/")) throw new Error("Можно загружать только изображения");
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Не удалось прочитать фото. Выберите JPG, PNG или WebP."));
      image.src = objectUrl;
    });
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Браузер не смог обработать изображение");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // WebP preserves transparency; JPEG made transparent PNGs black.
    const type = file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.85));
    if (!blob || !blob.size) throw new Error("Не удалось обработать изображение");
    if (blob.size > 2 * 1024 * 1024) throw new Error("Изображение после сжатия больше 2 МБ. Выберите фото меньшего размера.");
    const extension = { "image/jpeg": "jpg", "image/webp": "webp", "image/png": "png" }[blob.type] || "png";
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${extension}`, { type: blob.type });
  } finally { URL.revokeObjectURL(objectUrl); }
}

export async function uploadImage(file) {
  pending++;
  notify();
  try {
    const prepared = await compressImage(file);
    const data = new FormData();
    data.append("file", prepared);
    const response = await api.post("/admin/upload", data, { headers: { "Content-Type": "multipart/form-data" } });
    if (!response.data?.url) throw new Error("Сервер не вернул адрес изображения");
    return response.data.url;
  } finally { pending--; notify(); }
}
