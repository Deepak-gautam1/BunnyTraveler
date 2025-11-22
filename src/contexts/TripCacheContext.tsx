// src/contexts/TripCacheContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

type Trip = {
  id: number;
  creator_id: string;
  destination: string;
  start_city: string;
  start_date: string;
  end_date: string;
  description: string | null;
  created_at: string;
  max_participants: number;
  current_participants: number;
  budget_per_person: number | null;
  travel_style: string[] | null;
  status: string;
  interested_count?: number;
  completed_at?: string | null;
  profiles: any;
  trip_participants: any[];
};

interface CacheData {
  trips: Trip[];
  totalTrips: number;
  currentPage: number;
  timestamp: number;
  filters: any;
}

interface TripCacheContextType {
  getCachedTrips: () => CacheData | null;
  setCachedTrips: (data: CacheData) => void;
  clearCache: () => void;
  isCacheValid: () => boolean;
}

const TripCacheContext = createContext<TripCacheContextType | undefined>(
  undefined
);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const TripCacheProvider = ({ children }: { children: ReactNode }) => {
  const [cache, setCache] = useState<CacheData | null>(null);

  const getCachedTrips = useCallback(() => {
    return cache;
  }, [cache]);

  const setCachedTrips = useCallback((data: CacheData) => {
    console.log("📦 Caching trips:", data.trips.length);
    setCache({
      ...data,
      timestamp: Date.now(),
    });
  }, []);

  const clearCache = useCallback(() => {
    console.log("🗑️ Clearing cache");
    setCache(null);
  }, []);

  const isCacheValid = useCallback(() => {
    if (!cache) return false;
    const age = Date.now() - cache.timestamp;
    const valid = age < CACHE_DURATION;
    console.log(`⏰ Cache age: ${Math.round(age / 1000)}s, valid: ${valid}`);
    return valid;
  }, [cache]);

  return (
    <TripCacheContext.Provider
      value={{ getCachedTrips, setCachedTrips, clearCache, isCacheValid }}
    >
      {children}
    </TripCacheContext.Provider>
  );
};

export const useTripCache = () => {
  const context = useContext(TripCacheContext);
  if (!context) {
    throw new Error("useTripCache must be used within TripCacheProvider");
  }
  return context;
};
