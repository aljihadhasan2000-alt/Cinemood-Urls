export function getCanonicalUrl(slug: string): string {
  const env = (import.meta as any).env;
  const envUrl = env ? env.VITE_APP_URL : undefined;
  if (envUrl) {
    const cleanEnvUrl = envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
    return `${cleanEnvUrl}/p/${slug}`;
  }

  const hostname = window.location.hostname;
  const isAistudioOrLocal = 
    hostname.includes("localhost") || 
    hostname.includes("127.0.0.1") || 
    hostname.includes("ais-dev") || 
    hostname.includes("ais-pre") || 
    hostname.includes("run.app");

  if (!isAistudioOrLocal) {
    return `${window.location.origin}/p/${slug}`;
  }

  return `https://cinemoodurls.site/p/${slug}`;
}

export function getCanonicalBaseUrl(): string {
  const env = (import.meta as any).env;
  const envUrl = env ? env.VITE_APP_URL : undefined;
  if (envUrl) {
    return envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  }

  const hostname = window.location.hostname;
  const isAistudioOrLocal = 
    hostname.includes("localhost") || 
    hostname.includes("127.0.0.1") || 
    hostname.includes("ais-dev") || 
    hostname.includes("ais-pre") || 
    hostname.includes("run.app");

  if (!isAistudioOrLocal) {
    return window.location.origin;
  }

  return "https://cinemoodurls.site";
}
