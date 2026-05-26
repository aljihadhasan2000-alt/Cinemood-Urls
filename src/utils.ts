export function getCanonicalBaseUrl(): string {
  const env = (import.meta as any).env || {};
  // Prioritize typical environment variables for production URL
  const envUrl = env.VITE_APP_URL || env.NEXT_PUBLIC_APP_URL || env.APP_URL;
  if (envUrl) {
    return envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  }

  // Fallback seamlessly to window.location.origin to support any custom domain, routing, and instant in-situ preview
  if (typeof window !== "undefined" && window.location && window.location.origin) {
    return window.location.origin;
  }

  return "https://cinemoodurls.site";
}

export function getCanonicalUrl(slug: string): string {
  const base = getCanonicalBaseUrl();
  return `${base}/p/${slug}`;
}
