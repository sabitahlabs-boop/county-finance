import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get a working image URL — if the stored URL is an external R2 URL,
 * extract the key and use our proxy endpoint instead.
 * This fixes broken images when R2_PUBLIC_URL is not configured.
 */
export function getProxiedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Already a proxy URL or relative path — use as-is
  if (url.startsWith('/api/') || url.startsWith('/')) return url;
  // Data URL — use as-is
  if (url.startsWith('data:')) return url;
  // External R2 URL — extract the key and use proxy
  try {
    const parsed = new URL(url);
    // Check if it looks like an R2/S3 URL
    if (parsed.hostname.includes('r2.cloudflarestorage.com') || parsed.hostname.includes('r2.dev')) {
      const key = parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;
      if (key) return `/api/storage/proxy?key=${encodeURIComponent(key)}`;
    }
  } catch {
    // Not a valid URL — use as-is
  }
  return url;
}
