const configuredApi = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

/**
 * When VITE_API_BASE_URL is not set (Vercel deployment mode):
 * - API URLs remain relative (e.g., /api/auth/login)
 * - Vercel's /api/* rewrite in vercel.json proxies them to the backend
 * - This is the intended behavior and requires no warning
 */

export function apiUrl(path: string): string {
  if (!configuredApi || /^https?:\/\//i.test(path)) return path;
  return `${configuredApi}${path}`;
}

export const API_BASE_URL = configuredApi;
