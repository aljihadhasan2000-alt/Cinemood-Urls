import { BASE_URL } from "./utils/baseUrl";

export function getCanonicalBaseUrl(): string {
  // Fallback to cinemoodurls.site if the current URL is localhost/development/preview/temp
  const isTempOrLocal =
    BASE_URL.includes("localhost") ||
    BASE_URL.includes("127.0.0.1") ||
    BASE_URL.includes("ais-dev") ||
    BASE_URL.includes("ais-pre") ||
    BASE_URL.includes("run.app") ||
    BASE_URL.includes("vercel.app");

  if (isTempOrLocal) {
    return "https://cinemoodurls.site";
  }

  return BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
}

export function getCanonicalUrl(slug: string): string {
  const base = getCanonicalBaseUrl();
  return `${base}/${slug}`;
}

