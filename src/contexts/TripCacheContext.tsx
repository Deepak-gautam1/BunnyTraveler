// src/contexts/TripCacheContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { DbTrip } from "@/types/database";
import type { ProfileSnippet } from "@/types/database";

// Trip as stored in cache — the DB row plus joined relations
export type CachedTrip = DbTrip & {
  profiles: ProfileSnippet | null;
  trip_participants: { user_id: string; joined_at: string | null }[];
};

type ActiveFilters = Record<string, unknown>;

interface CacheData {
  trips: CachedTrip[];
  totalTrips: number;
  currentPage: number;
  timestamp: number;
  filters: ActiveFilters;
}

interface TripCacheContextType {
  getCachedTrips: () => CacheData | null;
  setCachedTrips: (data: CacheData) => void;
  clearCache: () => void;
  isCacheValid: () => boolean;
}

const TripCacheContext = createContext<TripCacheContextType | undefined>(
  undefined,
);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const TripCacheProvider = ({ children }: { children: ReactNode }) => {
  const [cache, setCache] = useState<CacheData | null>(null);

  const getCachedTrips = useCallback(() => cache, [cache]);

  const setCachedTrips = useCallback((data: CacheData) => {
    setCache({ ...data, timestamp: Date.now() });
  }, []);

  const clearCache = useCallback(() => {
    setCache(null);
  }, []);

  const isCacheValid = useCallback(() => {
    if (!cache) return false;
    return Date.now() - cache.timestamp < CACHE_DURATION;
  }, [cache]);

  return (
    <TripCacheContext.Provider
      value={{ getCachedTrips, setCachedTrips, clearCache, isCacheValid }}
    >
      {children}
    </TripCacheContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTripCache = () => {
  const context = useContext(TripCacheContext);
  if (!context) {
    throw new Error("useTripCache must be used within TripCacheProvider");
  }
  return context;
};
