// src/lib/imageCache.ts

import { getCookie, setCookie, COOKIE_KEYS } from "./cookies";

interface CachedImage {
  url: string;
  cachedAt: number;
  size?: number;
}

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_NAME = "safarsquad-images-v1";

class ImageCacheManager {
  private memoryCache = new Map<string, string>();

  constructor() {
    this.initCache();
  }

  private initCache() {
    // Check if images were previously cached
    const cachedData = getCookie<Record<string, CachedImage>>(
      COOKIE_KEYS.IMAGES_CACHED
    );
    const lastCheck = getCookie<number>(COOKIE_KEYS.LAST_IMAGE_CHECK);

    if (cachedData && lastCheck) {
      const now = Date.now();
      if (now - lastCheck < CACHE_DURATION) {
        Object.entries(cachedData).forEach(([key, value]) => {
          this.memoryCache.set(key, value.url);
        });
      }
    }
  }

  // Preload and cache images
  async preloadImages(
    imageUrls: { name: string; url: string }[]
  ): Promise<void> {


    const cacheData: Record<string, CachedImage> = {};
    const promises = imageUrls.map(async ({ name, url }) => {
      try {
        // Try to use Cache API (if available)
        if ("caches" in window) {
          const cache = await caches.open(CACHE_NAME);
          const response = await fetch(url);

          if (response.ok) {
            await cache.put(url, response.clone());
            this.memoryCache.set(name, url);
            cacheData[name] = {
              url,
              cachedAt: Date.now(),
              size: parseInt(response.headers.get("content-length") || "0"),
            };
          }
        } else {
          // Fallback: Just preload the image
          await this.preloadImage(url);
          this.memoryCache.set(name, url);
          cacheData[name] = { url, cachedAt: Date.now() };
        }
      } catch {
        // silently skip failed cache entries
      }
    });

    await Promise.all(promises);

    // Save cache metadata
    setCookie(COOKIE_KEYS.IMAGES_CACHED, cacheData, 7);
    setCookie(COOKIE_KEYS.LAST_IMAGE_CHECK, Date.now(), 7);


  }

  private preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  }

  // Get from cache
  getCachedUrl(name: string): string | null {
    return this.memoryCache.get(name) || null;
  }

  // Check if image is cached
  isCached(name: string): boolean {
    return this.memoryCache.has(name);
  }

  // Clear cache
  async clearCache(): Promise<void> {
    this.memoryCache.clear();
    setCookie(COOKIE_KEYS.IMAGES_CACHED, {}, 0);
    setCookie(COOKIE_KEYS.LAST_IMAGE_CHECK, 0, 0);

    if ("caches" in window) {
      await caches.delete(CACHE_NAME);
    }


  }

  // Get cache stats
  getCacheStats() {
    const cachedData =
      getCookie<Record<string, CachedImage>>(COOKIE_KEYS.IMAGES_CACHED) || {};
    const totalSize = Object.values(cachedData).reduce(
      (sum, img) => sum + (img.size || 0),
      0
    );

    return {
      count: Object.keys(cachedData).length,
      size: totalSize,
      sizeFormatted: this.formatBytes(totalSize),
      lastCheck: getCookie<number>(COOKIE_KEYS.LAST_IMAGE_CHECK),
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}

// ✅ Export a singleton instance (not the class)
export const imageCacheManager = new ImageCacheManager();
