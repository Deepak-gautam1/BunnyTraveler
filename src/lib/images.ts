// src/lib/images.ts

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const STORAGE_BUCKET = "destination-images";

// ✅ Cache the image URLs in memory for the session
const imageUrlCache = new Map<string, string>();

export const getDestinationImage = (name: string): string => {
  // Check memory cache first
  const cacheKey = name.toLowerCase();
  if (imageUrlCache.has(cacheKey)) {
    return imageUrlCache.get(cacheKey)!;
  }

  // Generate URL
  const filename = name.toLowerCase().replace(/\s+/g, "-");
  const actualFilename = filename === "amritsar" ? "amristar" : filename;

  // ✅ Add cache-control hint (1 year cache)
  const url = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${actualFilename}.jpg`;

  // Store in memory cache
  imageUrlCache.set(cacheKey, url);

  return url;
};

// Preload critical images
export const preloadDestinationImages = (destinations: string[]) => {
  destinations.forEach((dest) => {
    const img = new Image();
    img.src = getDestinationImage(dest);
  });
};

// Fallback image
export const generateFallbackImage = (name: string, emoji: string) => {
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fb923c;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#grad)"/>
      <text x="50%" y="45%" font-size="140" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
      <text x="50%" y="65%" font-size="36" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-weight="600">${name}</text>
    </svg>
  `)}`;
};
