import axios from "axios";

const rawBackendUrl = process.env.REACT_APP_BACKEND_URL;
const defaultBackendUrl = process.env.NODE_ENV === "production" ? "" : "http://localhost:8000";

export const BACKEND_URL = (rawBackendUrl ?? defaultBackendUrl).replace(/\/$/, "");
export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

let adminCsrfToken = "";

export function setAdminCsrfToken(value) {
  adminCsrfToken = typeof value === "string" ? value : "";
}

export function clearAdminCsrfToken() {
  adminCsrfToken = "";
}

api.interceptors.request.use((config) => {
  const method = String(config.method || "get").toUpperCase();
  if (adminCsrfToken && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    config.headers["X-CSRF-Token"] = adminCsrfToken;
  }
  return config;
});

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Что-то пошло не так. Попробуйте ещё раз.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
