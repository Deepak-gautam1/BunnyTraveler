// src/components/home/TripFeed.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as UserType } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useTripCache, type CachedTrip } from "@/contexts/TripCacheContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import TripMap from "../discover/TripMap";
import FilterBar, { FilterOptions } from "./FilterBar";
import CommunityHighlights from "./CommunityHighlights";
import EnhancedTripCard from "./EnhancedTripCard";
import PostTripModal from "@/components/trip/PostTripModal";
import LandingPage from "@/components/landing/LandingPage";
import AuthGuard from "@/components/auth/AuthGuard";
import { useBookmarks } from "@/hooks/useBookmarks";
import RecommendationSection from "@/components/home/RecommendationSection";
// ✅ CORRECT - Just import, don't call yet
import { useTripLikes } from "@/hooks/useTripLikes";
import type { TripStatus } from "@/hooks/useTripStatus";

import {
  Plus,
  MapPin,
  List,
  Sparkles,
  ChevronDown,
  Loader2,
  RefreshCw,
  Filter,
  ChevronUp,
  Mountain,
} from "lucide-react";

// Types
type Profile = {
  full_name: string;
  avatar_url: string;
};

type TripParticipant = {
  user_id: string;
  joined_at: string;
};

type Trip = {
  id: number;
  creator_id: string;
  destination: string;
  start_city: string;
  start_date: string;
  end_date: string;
  description: string | null;
  created_at: string | null;
  max_participants: number;
  current_participants: number | null;
  budget_per_person: number | null;
  travel_style: string[] | null;
  status: string | null;
  interested_count?: number | null;
  completed_at?: string | null;
  profiles: Profile | null;
  trip_participants: TripParticipant[];
};

interface TripFeedProps {
  user: UserType | null;
}

const TripFeed = ({ user }: TripFeedProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { toggleBookmark, isBookmarked } = useBookmarks(user);

  // ✅ CORRECT - Call hook INSIDE the component with the correct parameter
  const { isLiked, toggleLike } = useTripLikes(user);
  // ✅ ADD: Get cache functions
  const { getCachedTrips, setCachedTrips, isCacheValid, clearCache } =
    useTripCache();

  // State management
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [activeView, setActiveView] = useState<"map" | "list">("list");

  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    budgetRange: [0, 10000],
    startDate: null,
    endDate: null,
    groupSize: [1, 20],
    travelStyles: [],
    cities: [],
    sortBy: "newest",
  });

  const [authGuard, setAuthGuard] = useState({
    isOpen: false,
    actionType: "join" as "join" | "create" | "chat",
  });

  const TRIPS_PER_PAGE = 5;
  const INITIAL_TRIPS_COUNT = 5;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFiltersToQuery = (query: any, currentFilters: FilterOptions) => {
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.trim();
      query = query.or(
        `destination.ilike.%${searchTerm}%,start_city.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`,
      );
    }

    if (currentFilters.budgetRange[0] > 0) {
      query = query.gte("budget_per_person", currentFilters.budgetRange[0]);
    }
    if (currentFilters.budgetRange[1] < 10000) {
      query = query.lte("budget_per_person", currentFilters.budgetRange[1]);
    }

    if (currentFilters.groupSize[0] > 1) {
      query = query.gte("max_participants", currentFilters.groupSize[0]);
    }
    if (currentFilters.groupSize[1] < 20) {
      query = query.lte("max_participants", currentFilters.groupSize[1]);
    }

    if (currentFilters.startDate) {
      query = query.gte(
        "start_date",
        currentFilters.startDate.toISOString().split("T")[0],
      );
    }
    if (currentFilters.endDate) {
      query = query.lte(
        "end_date",
        currentFilters.endDate.toISOString().split("T")[0],
      );
    }

    if (currentFilters.cities.length > 0) {
      const cityFilters = currentFilters.cities
        .map((city) => `start_city.ilike.%${city}%`)
        .join(",");
      query = query.or(cityFilters);
    }

    if (currentFilters.travelStyles.length > 0) {
      query = query.overlaps("travel_style", currentFilters.travelStyles);
    }

    return query;
  };

  // ✅ HELPER FUNCTION: Check if filters are default
  const hasActiveFilters = useCallback(() => {
    return (
      filters.search !== "" ||
      filters.budgetRange[0] > 0 ||
      filters.budgetRange[1] < 10000 ||
      filters.startDate !== null ||
      filters.endDate !== null ||
      filters.groupSize[0] > 1 ||
      filters.groupSize[1] < 20 ||
      filters.travelStyles.length > 0 ||
      filters.cities.length > 0 ||
      filters.sortBy !== "newest"
    );
  }, [filters]);
  // ✅ UPDATED fetchTrips WITH CACHING
  const fetchTrips = useCallback(
    async (page: number, append: boolean = false) => {
      // Check if we can use cache (only for first page, no filters)
      if (page === 0 && !append && !hasActiveFilters() && isCacheValid()) {
        const cachedData = getCachedTrips();
        if (cachedData) {
          setTrips(cachedData.trips as unknown as Trip[]);
          setTotalTrips(cachedData.totalTrips);
          setCurrentPage(cachedData.currentPage);
          setLoading(false);
          return;
        }
      }

      // Start loading
      if (page === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const from = page * TRIPS_PER_PAGE;
        const to = from + TRIPS_PER_PAGE - 1;

        // Get total count on first page
        if (page === 0) {
          const { count } = await supabase
            .from("trips")
            .select("*", { count: "exact", head: true })
            .eq("status", "active");

          setTotalTrips(count || 0);
        }

        // Build query
        let dataQuery = supabase
          .from("trips")
          .select(
            `
            id,
            creator_id,
            destination,
            start_city,
            start_date,
            end_date,
            description,
            created_at,
            max_participants,
            current_participants,
            budget_per_person,
            travel_style,
            status,
            interested_count,
            profiles!trips_creator_id_fkey(full_name, avatar_url),
            trip_participants(user_id, joined_at)
          `,
          )
          .eq("status", "active")
          .range(from, to);

        // Apply filters
        dataQuery = applyFiltersToQuery(dataQuery, filters);

        // Apply sorting
        switch (filters.sortBy) {
          case "budget":
            dataQuery = dataQuery.order("budget_per_person", {
              ascending: true,
              nullsFirst: false,
            });
            break;
          case "date":
            dataQuery = dataQuery.order("start_date", { ascending: true });
            break;
          case "popularity":
            dataQuery = dataQuery.order("current_participants", {
              ascending: false,
            });
            break;
          case "newest":
          default:
            dataQuery = dataQuery.order("created_at", { ascending: false });
            break;
        }

        const { data, error } = await dataQuery;

        if (error) {
          toast({
            title: "Error loading trips",
            description: "Failed to load trips. Please try again.",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          const newTrips = data as Trip[];

          if (append) {
            setTrips((prev) => {
              const combined = [...prev, ...newTrips];
              return combined;
            });
          } else {
            setTrips(newTrips);
            setCurrentPage(0);

            // ✅ Cache the first page if no filters
            if (page === 0 && !hasActiveFilters()) {
              const totalCount = await supabase
                .from("trips")
                .select("*", { count: "exact", head: true })
                .eq("status", "active");

              setCachedTrips({
                trips: newTrips as unknown as CachedTrip[],
                totalTrips: totalCount.count || newTrips.length,
                currentPage: 0,
                timestamp: Date.now(),
                filters: filters as unknown as Record<string, unknown>,
              });
            }
          }

          setCurrentPage(page);
        }
      } catch {
        // silently fail — toast already shown on query error
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      filters,
      toast,
      getCachedTrips,
      setCachedTrips,
      isCacheValid,
      hasActiveFilters,
    ],
  );

  // ✅ UPDATED - handleCardLike function

  const handleCardLike = async (tripId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Please sign in",
        description: "Sign in to show interest in this trip",
        variant: "destructive",
      });
      return;
    }

    // Get current like status
    const wasLiked = isLiked(tripId);

    // Toggle the like (ONLY ONCE!)
    const nowLiked = await toggleLike(tripId);

    // Update UI based on result
    setTrips((prevTrips) =>
      prevTrips.map((trip) => {
        if (trip.id === tripId) {
          const currentCount = trip.interested_count || 0;
          let newCount = currentCount;

          // Only update if state actually changed
          if (wasLiked && !nowLiked) {
            // Was liked, now unliked - decrease
            newCount = Math.max(currentCount - 1, 0);
          } else if (!wasLiked && nowLiked) {
            // Wasn't liked, now liked - increase
            newCount = currentCount + 1;
          }

          return {
            ...trip,
            interested_count: newCount,
          };
        }
        return trip;
      }),
    );

    // ✅ Update cache with new data
    if (isCacheValid()) {
      const cachedData = getCachedTrips();
      if (cachedData) {
        const updatedTrips = cachedData.trips.map((trip) => {
          if (trip.id === tripId) {
            const currentCount = trip.interested_count || 0;
            return {
              ...trip,
              interested_count: nowLiked
                ? currentCount + 1
                : Math.max(currentCount - 1, 0),
            };
          }
          return trip;
        });

        setCachedTrips({
          ...cachedData,
          trips: updatedTrips,
        });
      }
    }
  };

  const loadMoreTrips = useCallback(async () => {
    if (trips.length < totalTrips && !loadingMore) {
      await fetchTrips(currentPage + 1, true);
    }
  }, [trips.length, totalTrips, loadingMore, currentPage, fetchTrips]);

  const refreshTrips = useCallback(async () => {
    clearCache();
    setCurrentPage(0);
    setTrips([]);
    await fetchTrips(0, false);
  }, [fetchTrips, clearCache]);
  // ✅ UPDATED handleFiltersChange - Clear cache when filters change
  const handleFiltersChange = useCallback(
    (newFilters: FilterOptions) => {
      if (JSON.stringify(filters) !== JSON.stringify(newFilters)) {
        clearCache();
      }
      setFilters(newFilters);
      setCurrentPage(0);
      setTrips([]);
    },
    [filters, clearCache],
  );
  useEffect(() => {
    fetchTrips(0, false);
  }, [fetchTrips]);

  const handlePostTrip = () => {
    if (!user) {
      toast({
        title: "Hey traveler! 🚀",
        description:
          "You need an account to create trips. Sign in to get started!",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSignInModal(true)}
          >
            Sign In
          </Button>
        ),
      });
      return;
    }
    setIsPostModalOpen(true);
  };

  const handleTripClick = (trip: Trip) => {
    setSelectedTrip(trip);
    navigate(`/trip/${trip.id}`);
  };

  const handleRecommendationClick = (tripId: number) => {
    navigate(`/trip/${tripId}`);
  };

  const handleTripChat = (_tripId: string | number) => {
    if (!user) {
      setAuthGuard({ isOpen: true, actionType: "chat" });
      return;
    }
  };

  const handleLocationSelect = (_location: {
    lat: number;
    lng: number;
    address: string;
  }) => {};

  const clearAllFilters = useCallback(() => {
    handleFiltersChange({
      search: "",
      budgetRange: [0, 10000],
      startDate: null,
      endDate: null,
      groupSize: [1, 20],
      travelStyles: [],
      cities: [],
      sortBy: "newest",
    });
  }, [handleFiltersChange]);

  const isEndingSoon = (endDate: string) => {
    const today = new Date();
    const tripEnd = new Date(endDate);
    const daysUntilEnd = Math.ceil(
      (tripEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilEnd <= 3 && daysUntilEnd >= 0;
  };

  const hasMore = trips.length < totalTrips && totalTrips > 0;

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden relative">
      <main className="pb-20 w-full max-w-[100vw]">
        <div className="px-4 pb-4">
          <div className="gradient-warm rounded-2xl p-6 text-center space-y-2 shadow-soft">
            <h2 className="text-lg font-semibold text-white">
              🏔️ Discover Your Next Adventure
            </h2>
            <p className="text-sm text-white/90">
              {user
                ? "Connect with fellow travelers and explore incredible destinations together!"
                : "Join thousands of travelers already exploring together. Sign in when ready to join the fun!"}
            </p>
            {!user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSignInModal(true)}
                className="mt-3 bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Sign In to Join
              </Button>
            )}
          </div>
        </div>

        {user && (
          <RecommendationSection
            user={user}
            onTripClick={handleRecommendationClick}
          />
        )}

        <div className="px-4 mb-4">
          <Tabs
            value={activeView}
            onValueChange={(value) => setActiveView(value as "map" | "list")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="map" className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Map View</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center space-x-2">
                <List className="w-4 h-4" />
                <span>List View</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeView === "map" && (
          <div className="px-4 mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {trips.length} trips on map
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Click markers for details
                  </Badge>
                  {hasMore && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-blue-100 text-blue-800"
                    >
                      +{totalTrips - trips.length} more available
                    </Badge>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshTrips}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh Map
                </Button>
              </div>

              <TripMap
                trips={trips.map((t) => ({
                  ...t,
                  current_participants: t.current_participants ?? 0,
                }))}
                onTripSelect={(trip) => {
                  const original = trips.find((t) => t.id === trip.id) ?? null;
                  setSelectedTrip(original);
                  navigate(`/trip/${trip.id}`);
                }}
                onLocationSelect={handleLocationSelect}
                selectedTrip={
                  selectedTrip
                    ? {
                        ...selectedTrip,
                        current_participants:
                          selectedTrip.current_participants ?? 0,
                      }
                    : null
                }
                user={user}
                height="600px"
                className="rounded-2xl overflow-hidden shadow-soft border"
              />

              <div className="flex justify-center items-center space-x-3 pt-6">
                {hasMore && (
                  <Button
                    onClick={loadMoreTrips}
                    disabled={loadingMore}
                    variant="outline"
                    size="default"
                    className="text-accent border-accent hover:bg-accent hover:text-white transition-all duration-300 min-w-[240px] hover-scale shadow-sm"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Loading Adventures...</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        <span>Load More on Map</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {Math.min(TRIPS_PER_PAGE, totalTrips - trips.length)}{" "}
                          more
                        </Badge>
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground bg-muted/50 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span>Adventure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span>Relaxation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                  <span>Cultural</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span>Luxury</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span>Other</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 mb-6">
          <FilterBar
            onFiltersChange={handleFiltersChange}
            totalResults={totalTrips}
          />
        </div>

        <div className="px-2 md:px-4 space-y-3 md:space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center justify-between md:justify-start md:space-x-3">
              <h3 className="text-base md:text-lg font-semibold flex items-center space-x-2">
                <Mountain className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                <span>Active Adventures</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshTrips}
                disabled={loading}
                className="flex items-center space-x-1 h-8 md:h-9 px-2 md:px-3"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden md:inline text-sm">Refresh</span>
              </Button>
            </div>

            <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs flex items-center gap-1 px-2 py-1"
              >
                <MapPin className="w-3 h-3" />
                <span className="hidden sm:inline">
                  {totalTrips} adventures
                </span>
                <span className="sm:hidden">{totalTrips}</span>
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-1">
                Page {currentPage + 1}
              </Badge>
              {hasMore && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-800 px-2 py-1"
                >
                  More Available
                </Badge>
              )}
            </div>
          </div>

          {loading && trips.length === 0 ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-sm md:text-base text-muted-foreground">
                Loading adventures...
              </p>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Filter className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-base md:text-lg mb-2">
                No trips found
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                Try adjusting your filters or be the first to create a trip!
              </p>
              <Button
                variant="outline"
                onClick={clearAllFilters}
                size="sm"
                className="text-sm"
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {trips.map((trip) => {
                const participantCount = trip.current_participants || 0;

                const enhancedTrip = {
                  id: trip.id,
                  destination: trip.destination,
                  startDate: trip.start_date,
                  endDate: trip.end_date,
                  startCity: trip.start_city,
                  description: trip.description || "No description provided.",
                  creator: {
                    id: trip.creator_id,
                    name: trip.profiles?.full_name || "A Wanderer",
                    avatar: trip.profiles?.avatar_url || "",
                    rating: 4.8,
                    verificationBadges: ["verified"],
                    isHost: true,
                  },
                  vibe: trip.travel_style || ["Adventure"],
                  groupSize: {
                    current: participantCount,
                    max: trip.max_participants,
                  },
                  interestedCount: trip.interested_count || 0, // ✅ USE interested_count
                  status: (trip.status ?? "planning") as TripStatus,
                  completed_at: trip.completed_at,
                  isFemaleOnly: false,
                  isInstantJoin: true,
                  postedAt: trip.created_at ?? new Date().toISOString(),
                };

                return (
                  <div key={trip.id} className="relative">
                    {isEndingSoon(trip.end_date) && (
                      <Badge className="absolute top-2 md:top-4 left-2 md:left-4 z-10 bg-orange-500 text-white text-xs px-2 py-1">
                        ⏰{" "}
                        {Math.ceil(
                          (new Date(trip.end_date).getTime() -
                            new Date().getTime()) /
                            (1000 * 60 * 60 * 24),
                        )}{" "}
                        days
                      </Badge>
                    )}

                    <EnhancedTripCard
                      {...enhancedTrip}
                      isBookmarked={isBookmarked(trip.id)}
                      onBookmarkClick={() => toggleBookmark(trip.id)}
                      onClick={() => handleTripClick(trip)}
                      onChatClick={() => handleTripChat(trip.id)}
                      isLiked={isLiked(trip.id)}
                      onLikeClick={(e) => handleCardLike(trip.id, e)}
                      onStatusChange={() => refreshTrips()}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-3 pt-4 md:pt-6">
            {hasMore && (
              <Button
                onClick={loadMoreTrips}
                disabled={loadingMore}
                variant="outline"
                size="default"
                className="w-full md:w-auto text-accent border-accent hover:bg-accent hover:text-white transition-all duration-300 md:min-w-[240px] hover-scale shadow-sm h-10 md:h-11"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    <span className="text-sm md:text-base">Load More</span>
                    <Badge
                      variant="secondary"
                      className="ml-2 text-xs px-1.5 py-0.5"
                    >
                      {Math.min(TRIPS_PER_PAGE, totalTrips - trips.length)}
                    </Badge>
                  </>
                )}
              </Button>
            )}

            {trips.length > INITIAL_TRIPS_COUNT && (
              <Button
                onClick={() => {
                  setTrips(trips.slice(0, INITIAL_TRIPS_COUNT));
                  setCurrentPage(0);
                }}
                variant="ghost"
                size="default"
                className="w-full md:w-auto text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all duration-300 h-10 md:h-11"
              >
                <ChevronUp className="w-4 h-4 mr-2" />
                <span className="text-sm md:text-base">Show Less</span>
              </Button>
            )}
          </div>

          {trips.length > 0 && totalTrips > TRIPS_PER_PAGE && (
            <div className="flex justify-center pt-3 md:pt-4">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span className="hidden sm:inline">
                  Showing {trips.length} of {totalTrips} adventures
                </span>
                <span className="sm:hidden">
                  {trips.length}/{totalTrips}
                </span>
                <div className="w-16 md:w-24 bg-muted rounded-full h-1">
                  <div
                    className="bg-accent h-1 rounded-full transition-all duration-300"
                    style={{ width: `${(trips.length / totalTrips) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {!hasMore && trips.length > 0 && (
            <div className="text-center pt-4 md:pt-6 pb-4 px-4">
              <div className="inline-flex items-center px-3 md:px-4 py-2 rounded-full bg-muted text-muted-foreground text-xs md:text-sm">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                <span className="hidden sm:inline">
                  You've seen all {totalTrips} adventures! Check back later for
                  more.
                </span>
                <span className="sm:hidden">
                  All {totalTrips} adventures shown
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 mt-8">
          <CommunityHighlights />
        </div>
      </main>
      <div className="hidden md:block fixed bottom-6 right-6 z-30">
        <Button
          variant="default"
          onClick={handlePostTrip}
          className="animate-pulse-glow shadow-glow bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Plus className="w-6 h-6" />
        </Button>
        <div className="absolute -top-2 -left-12 text-xs font-medium text-muted-foreground animate-bounce-gentle">
          Post your trip!
        </div>
      </div>
      <PostTripModal
        open={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onTripCreated={refreshTrips}
      />
      {showSignInModal && (
        <div className="fixed inset-0 z-50 bg-background animate-fade-in">
          <LandingPage onSkipForNow={() => setShowSignInModal(false)} />
          <Button
            variant="ghost"
            onClick={() => setShowSignInModal(false)}
            className="absolute top-4 left-4 hover-scale"
          >
            ← Back to Browse
          </Button>
        </div>
      )}
      <AuthGuard
        isOpen={authGuard.isOpen}
        onClose={() => setAuthGuard({ ...authGuard, isOpen: false })}
        user={user}
        actionType={authGuard.actionType}
      />
    </div>
  );
};

export default TripFeed;
