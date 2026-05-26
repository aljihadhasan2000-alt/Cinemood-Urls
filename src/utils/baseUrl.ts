// src/utils/baseUrl.ts

// Production-safe base URL detection
export const BASE_URL =
  (import.meta as any).env?.VITE_APP_URL ||
  (typeof process !== "undefined" && process?.env?.APP_URL) ||
  (typeof window !== "undefined" && window?.location?.origin) ||
  "https://cinemoodurls.site";
