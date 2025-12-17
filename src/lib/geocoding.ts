// src/lib/geocoding.ts

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface CityCache {
  [city: string]: Coordinates;
}

// Hardcoded coordinates for popular Indian cities (faster, no API needed)
const INDIAN_CITIES_COORDS: CityCache = {
  // Major Cities
  mumbai: { latitude: 19.076, longitude: 72.8777 },
  delhi: { latitude: 28.7041, longitude: 77.1025 },
  bangalore: { latitude: 12.9716, longitude: 77.5946 },
  bengaluru: { latitude: 12.9716, longitude: 77.5946 },
  hyderabad: { latitude: 17.385, longitude: 78.4867 },
  ahmedabad: { latitude: 23.0225, longitude: 72.5714 },
  chennai: { latitude: 13.0827, longitude: 80.2707 },
  kolkata: { latitude: 22.5726, longitude: 88.3639 },
  pune: { latitude: 18.5204, longitude: 73.8567 },
  jaipur: { latitude: 26.9124, longitude: 75.7873 },

  // Tourist Destinations
  goa: { latitude: 15.2993, longitude: 74.124 },
  manali: { latitude: 32.2396, longitude: 77.1887 },
  shimla: { latitude: 31.1048, longitude: 77.1734 },
  "leh-ladakh": { latitude: 34.1526, longitude: 77.577 },
  leh: { latitude: 34.1526, longitude: 77.577 },
  ladakh: { latitude: 34.1526, longitude: 77.577 },
  rishikesh: { latitude: 30.0869, longitude: 78.2676 },
  varanasi: { latitude: 25.3176, longitude: 82.9739 },
  darjeeling: { latitude: 27.036, longitude: 88.2627 },
  ooty: { latitude: 11.4102, longitude: 76.695 },
  udaipur: { latitude: 24.5854, longitude: 73.7125 },
  kerala: { latitude: 10.8505, longitude: 76.2711 },
  kochi: { latitude: 9.9312, longitude: 76.2673 },
  coorg: { latitude: 12.3375, longitude: 75.8069 },
  mysore: { latitude: 12.2958, longitude: 76.6394 },
  mysuru: { latitude: 12.2958, longitude: 76.6394 },
  andaman: { latitude: 11.7401, longitude: 92.6586 },
  "port blair": { latitude: 11.6234, longitude: 92.7266 },
  agra: { latitude: 27.1767, longitude: 78.0081 },
  amritsar: { latitude: 31.634, longitude: 74.8723 },
  kasol: { latitude: 32.01, longitude: 77.3143 },
  pondicherry: { latitude: 11.9416, longitude: 79.8083 },
  puducherry: { latitude: 11.9416, longitude: 79.8083 },
  nainital: { latitude: 29.3803, longitude: 79.4636 },
  ranthambore: { latitude: 26.0173, longitude: 76.5026 },

  // More cities
  srinagar: { latitude: 34.0837, longitude: 74.7973 },
  gangtok: { latitude: 27.3389, longitude: 88.6065 },
  mountabu: { latitude: 24.5926, longitude: 72.7156 },
  lonavala: { latitude: 18.7537, longitude: 73.4086 },
  mahabaleshwar: { latitude: 17.9245, longitude: 73.6578 },
  kodaikanal: { latitude: 10.2381, longitude: 77.4892 },
  munnar: { latitude: 10.0889, longitude: 77.0595 },
  alleppey: { latitude: 9.498, longitude: 76.3388 },
  wayanad: { latitude: 11.6854, longitude: 76.1319 },
  hampi: { latitude: 15.335, longitude: 76.46 },
  khajuraho: { latitude: 24.8318, longitude: 79.9199 },
  ajmer: { latitude: 26.4499, longitude: 74.6399 },
  pushkar: { latitude: 26.4899, longitude: 74.5511 },
};

// In-memory cache for dynamically geocoded cities
let dynamicCache: CityCache = {};

/**
 * Get coordinates for a city
 * First checks hardcoded list, then falls back to API (if implemented)
 */
export async function getCityCoordinates(
  cityName: string
): Promise<Coordinates | null> {
  if (!cityName) return null;

  const normalizedCity = cityName.toLowerCase().trim();

  // Check hardcoded list first
  if (INDIAN_CITIES_COORDS[normalizedCity]) {
    return INDIAN_CITIES_COORDS[normalizedCity];
  }

  // Check dynamic cache
  if (dynamicCache[normalizedCity]) {
    return dynamicCache[normalizedCity];
  }

  // Fallback: Try to geocode using free API (optional)
  try {
    const coords = await geocodeCityViaAPI(cityName);
    if (coords) {
      dynamicCache[normalizedCity] = coords;
      return coords;
    }
  } catch (error) {
    console.warn(`Failed to geocode ${cityName}:`, error);
  }

  return null;
}

/**
 * Optional: Geocode using Nominatim (free, no API key needed)
 * Note: Has rate limits (1 req/sec), use sparingly
 */
async function geocodeCityViaAPI(
  cityName: string
): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cityName + ", India"
      )}&limit=1`,
      {
        headers: {
          "User-Agent": "SafarSquad/1.0", // Required by Nominatim
        },
      }
    );

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error("Geocoding API error:", error);
  }

  return null;
}

/**
 * Batch geocode multiple cities (for initial load)
 */
export async function batchGeocodeCities(
  cities: string[]
): Promise<Map<string, Coordinates>> {
  const results = new Map<string, Coordinates>();

  for (const city of cities) {
    const coords = await getCityCoordinates(city);
    if (coords) {
      results.set(city.toLowerCase(), coords);
    }
    // Add small delay to respect API rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}
