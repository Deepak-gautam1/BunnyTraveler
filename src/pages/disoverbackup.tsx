// src/pages/DiscoverPage.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion"; // ✅ Added for animations
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card"; // ✅ Used for containerization
import { useToast } from "@/hooks/use-toast";
import {
  List,
  Map as MapIcon,
  RefreshCw,
  Filter,
  Sparkles,
  Plus,
  Loader2,
  MapPin,
  Search,
} from "lucide-react";

import TripMap from "@/components/discover/TripMap";
import MapFilters from "@/components/discover/MapFilters";
import FilterBar, { FilterOptions } from "@/components/home/FilterBar";
import PopularDestinations from "@/components/discover/PopularDestinations";
import EnhancedTripCard from "@/components/home/EnhancedTripCard";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useBookmarks } from "@/hooks/useBookmarks";
import { setCookie, getCookie, COOKIE_KEYS } from "@/lib/cookies";
import { POPULAR_CITIES } from "@/lib/constants";
// --- Types (Kept same) ---
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
  created_at: string;
  max_participants: number;
  current_participants: number;
  budget_per_person: number | null;
  travel_style: string[] | null;
  status: string;
  profiles: Profile | null;
  trip_participants: TripParticipant[];
};

interface DiscoverPageProps {
  user: User | null;
}

const DiscoverPage = ({ user }: DiscoverPageProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    location,
    getCurrentLocation,
    error: locationError,
  } = useGeolocation();

  const { toggleBookmark, isBookmarked } = useBookmarks(user);

  const [viewMode, setViewMode] = useState<"list" | "map">(() => {
    return (getCookie(COOKIE_KEYS.VIEW_MODE) as "list" | "map") || "list";
  });
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

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

  const [mapFilters, setMapFilters] = useState(() => {
    const saved = getCookie(COOKIE_KEYS.MAP_FILTERS);
    return (
      saved || {
        searchRadius: 50,
        locationFilter: "",
        nearbySearch: false,
      }
    );
  });

  const TRIPS_PER_PAGE = 9; // Changed to 9 for better grid alignment (3x3)

  // --- Effects (Kept same logic) ---
  useEffect(() => {
    setCookie(COOKIE_KEYS.VIEW_MODE, viewMode, 30);
  }, [viewMode]);

  useEffect(() => {
    setCookie(COOKIE_KEYS.MAP_FILTERS, mapFilters, 7);
  }, [mapFilters]);

  const fetchAllTrips = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trips")
        .select(
          `
          *,
          profiles!trips_creator_id_fkey(full_name, avatar_url),
          trip_participants(user_id, joined_at)
        `
        )
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setAllTrips(data as any);
    } catch (err) {
      console.error("Unexpected error fetching trips:", err);
      toast({
        title: "Error",
        description: "Failed to load trips.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = useMemo(() => {
    let result = [...allTrips];

    // ✅ SEARCH FILTER - Must check destination AND start_city
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase().trim();
      result = result.filter((trip) => {
        const destination = trip.destination?.toLowerCase() || "";
        const startCity = trip.start_city?.toLowerCase() || "";
        const description = trip.description?.toLowerCase() || "";
        const creatorName = trip.profiles?.full_name?.toLowerCase() || "";

        return (
          destination.includes(searchTerm) ||
          startCity.includes(searchTerm) ||
          description.includes(searchTerm) ||
          creatorName.includes(searchTerm)
        );
      });
    }

    // Budget Filter
    if (filters.budgetRange[0] > 0 || filters.budgetRange[1] < 10000) {
      result = result.filter((trip) => {
        if (!trip.budget_per_person) return filters.budgetRange[0] === 0;
        return (
          trip.budget_per_person >= filters.budgetRange[0] &&
          (filters.budgetRange[1] >= 10000 ||
            trip.budget_per_person <= filters.budgetRange[1])
        );
      });
    }

    // Group Size Filter
    result = result.filter(
      (trip) =>
        trip.max_participants >= filters.groupSize[0] &&
        trip.max_participants <= filters.groupSize[1]
    );

    // Date Filters
    if (filters.startDate) {
      result = result.filter(
        (trip) => new Date(trip.start_date) >= filters.startDate!
      );
    }
    if (filters.endDate) {
      result = result.filter(
        (trip) => new Date(trip.end_date) <= filters.endDate!
      );
    }

    // Travel Styles Filter
    if (filters.travelStyles.length > 0) {
      result = result.filter(
        (trip) =>
          trip.travel_style &&
          filters.travelStyles.some((style) =>
            trip.travel_style!.includes(style)
          )
      );
    }

    // ✅ Cities Filter - Only apply if NO search active
    if (filters.cities.length > 0 && !filters.search) {
      result = result.filter((trip) =>
        filters.cities.some(
          (city) =>
            trip.start_city.toLowerCase().includes(city.toLowerCase()) ||
            trip.destination.toLowerCase().includes(city.toLowerCase())
        )
      );
    }

    // Map Location Filter
    if (mapFilters.locationFilter) {
      result = result.filter(
        (trip) =>
          trip.start_city
            .toLowerCase()
            .includes(mapFilters.locationFilter.toLowerCase()) ||
          trip.destination
            .toLowerCase()
            .includes(mapFilters.locationFilter.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "budget":
          return (a.budget_per_person || 0) - (b.budget_per_person || 0);
        case "date":
          return (
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          );
        case "popularity":
          return (b.current_participants || 0) - (a.current_participants || 0);
        case "newest":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    return result;
  }, [allTrips, filters, mapFilters]);
  // ✅ Add this useEffect right after your state declarations

  const displayedTrips = useMemo(() => {
    return filteredTrips.slice(0, (currentPage + 1) * TRIPS_PER_PAGE);
  }, [filteredTrips, currentPage]);

  const loadMoreTrips = () => {
    if (displayedTrips.length < filteredTrips.length) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const refreshTrips = async () => {
    setCurrentPage(0);
    await fetchAllTrips();
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const handleMapFiltersChange = {
    onRadiusChange: (radius: number) => {
      setMapFilters((prev) => ({ ...prev, searchRadius: radius }));
    },
    onLocationFilter: (locationName: string) => {
      setMapFilters((prev) => ({ ...prev, locationFilter: locationName }));
      setCurrentPage(0);
    },
    onNearbySearch: () => {
      if (!location) {
        getCurrentLocation();
      } else {
        setMapFilters((prev) => ({ ...prev, nearbySearch: true }));
        toast({
          title: "Searching nearby...",
          description: `Finding trips within ${mapFilters.searchRadius}km`,
        });
      }
    },
  };

  const handleTripSelect = (trip: any) => {
    setSelectedTrip(trip);
    navigate(`/trip/${trip.id}`);
  };

  const handleDestinationClick = (destination: string) => {
    console.log("🔍 Destination clicked:", destination); // Debug log
    // ✅ Check if destination is in popular cities (case-insensitive)
    const matchedCity = POPULAR_CITIES.find(
      (city) => city.toLowerCase() === destination.toLowerCase()
    );

    // Update filters with both search AND cities
    setFilters((prev) => ({
      ...prev,
      search: destination,
      cities: matchedCity ? [matchedCity] : [], // ✅ Use exact city name
    }));

    // 2. Reset pagination
    setCurrentPage(0);

    // 3. Switch to list view if on map
    if (viewMode === "map") {
      setViewMode("list");
    }

    // 4. Smooth scroll to trips section
    setTimeout(() => {
      const tripsSection = document.getElementById("trips-section");
      if (tripsSection) {
        const yOffset = -100;
        const y =
          tripsSection.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;

        window.scrollTo({
          top: y,
          behavior: "smooth",
        });
      }
    }, 150); // Slightly longer delay for state update

    // 5. Calculate matching trips
    setTimeout(() => {
      const matchingTrips = allTrips.filter(
        (t) =>
          t.destination.toLowerCase().includes(destination.toLowerCase()) ||
          t.start_city.toLowerCase().includes(destination.toLowerCase())
      );

      console.log("✅ Matching trips found:", matchingTrips.length); // Debug log

      toast({
        title: `🗺️ Showing trips to ${destination}`,
        description:
          matchingTrips.length > 0
            ? `Found ${matchingTrips.length} ${
                matchingTrips.length === 1 ? "trip" : "trips"
              }`
            : "No trips found. Try clearing other filters.",
        duration: 3000,
      });
    }, 100);
  };

  useEffect(() => {
    fetchAllTrips();
  }, []);
  useEffect(() => {
    console.log("🔍 Filters updated:", filters);
    console.log("📊 All trips:", allTrips.length);
    console.log("🎯 Filtered trips:", filteredTrips.length);
    console.log("👀 Displayed trips:", displayedTrips.length);
  }, [filters, allTrips, filteredTrips, displayedTrips]);
  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 pb-20">
      {/* 1. Modern Hero Section */}
      {/* 1. Modern Hero Section - LIGHTER GRADIENT */}
      <div className="relative bg-gradient-to-br from-orange-50 via-orange-100 to-pink-50 pt-16 pb-32 px-4 shadow-sm overflow-hidden">
        {/* Abstract Background Shapes - More Subtle */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-orange-200 blur-3xl"></div>
          <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full bg-pink-200 blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          {/* Title & Subtitle - Darker Text for Better Contrast */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Where will your story go next?
            </h1>
            <p className="text-gray-700 text-lg md:text-xl mt-2 max-w-2xl mx-auto font-medium">
              Discover unique adventures, find travel buddies, and make
              memories.
            </p>
          </motion.div>

          {/* ✅ STATS CARDS - Better Contrast */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 md:gap-6 pt-4"
          >
            <div className="bg-white/80 backdrop-blur-md rounded-2xl px-4 md:px-6 py-3 md:py-4 text-center hover:bg-white hover:shadow-lg transition-all cursor-default border border-orange-100">
              <p className="text-2xl md:text-3xl font-bold text-orange-600">
                {filteredTrips.length}
              </p>
              <p className="text-gray-600 text-xs md:text-sm font-medium">
                Active Trips
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl px-4 md:px-6 py-3 md:py-4 text-center hover:bg-white hover:shadow-lg transition-all cursor-default border border-orange-100">
              <p className="text-2xl md:text-3xl font-bold text-orange-600">
                {allTrips.reduce(
                  (sum, t) => sum + (t.current_participants || 0),
                  0
                )}
              </p>
              <p className="text-gray-600 text-xs md:text-sm font-medium">
                Travelers
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl px-4 md:px-6 py-3 md:py-4 text-center hover:bg-white hover:shadow-lg transition-all cursor-default border border-orange-100">
              <p className="text-2xl md:text-3xl font-bold text-orange-600">
                {new Set(allTrips.map((t) => t.destination)).size}
              </p>
              <p className="text-gray-600 text-xs md:text-sm font-medium">
                Destinations
              </p>
            </div>
          </motion.div>

          {/* Popular Destinations Pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="pt-2"
          >
            <PopularDestinations onDestinationClick={handleDestinationClick} />
          </motion.div>
        </div>
      </div>

      {/* 2. Floating Control Bar (Filters & Toggles) */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <Card className="p-2 md:p-4 shadow-xl border-white/20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Filter Bar Component */}
            <div className="w-full md:flex-1">
              <FilterBar
                onFiltersChange={handleFiltersChange}
                totalResults={filteredTrips.length}
                currentFilters={filters}
              />
            </div>

            {/* View Toggles & Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {/* Location Badge */}
              {location && (
                <Badge
                  variant="secondary"
                  className="hidden md:flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200"
                >
                  <MapPin className="w-3 h-3" /> Location On
                </Badge>
              )}

              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshTrips}
                disabled={loading}
                className="hover:bg-gray-100 rounded-full"
                title="Refresh Trips"
              >
                <RefreshCw
                  className={`w-5 h-5 text-gray-600 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
              </Button>

              {/* Add this near your refresh button for testing */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("Current filters:", filters);
                  console.log("Filtered trips:", filteredTrips);
                  console.log("Displayed trips:", displayedTrips);
                }}
              >
                Debug
              </Button>

              {/* View Switcher (Segmented Control style) */}
              <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-full flex">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-white dark:bg-gray-700 text-orange-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    viewMode === "map"
                      ? "bg-white dark:bg-gray-700 text-orange-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Map</span>
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Main Content Area */}
      <div id="trips-section" className="max-w-7xl mx-auto px-4 mt-8">
        {/* ✅ Active Filter Badge - Show when filtering by destination */}
        {filters.search && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            {/* <Card className="p-4 bg-gradient-to-r from-orange-50 to-pink-50 border-orange-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Showing trips to</p>
                    <h3 className="text-lg font-bold text-gray-900">
                      {filters.search}
                    </h3>
                  </div>
                  <Badge className="bg-orange-500 text-white">
                    {filteredTrips.length}{" "}
                    {filteredTrips.length === 1 ? "trip" : "trips"}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, search: "" }));
                    toast({
                      title: "Filters cleared",
                      description: "Showing all destinations",
                    });
                  }}
                  className="hover:bg-orange-100 text-gray-600"
                >
                  Clear Filter
                </Button>
              </div>
            </Card> */}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {viewMode === "map" ? (
            <motion.div
              key="map-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Map Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <MapFilters
                    onRadiusChange={handleMapFiltersChange.onRadiusChange}
                    onLocationFilter={handleMapFiltersChange.onLocationFilter}
                    onNearbySearch={handleMapFiltersChange.onNearbySearch}
                    currentLocation={
                      location
                        ? { lat: location.latitude, lng: location.longitude }
                        : undefined
                    }
                  />
                  {/* Map Legend */}
                  <Card className="p-4">
                    <h3 className="font-semibold text-sm mb-3">
                      Travel Styles
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />{" "}
                        Adventure
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />{" "}
                        Relaxation
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />{" "}
                        Cultural
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="lg:col-span-3 h-[600px] rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 relative bg-gray-100">
                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                      <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                    </div>
                  ) : (
                    <TripMap
                      trips={filteredTrips as any}
                      onTripSelect={handleTripSelect}
                      onLocationSelect={(loc: any) =>
                        handleMapFiltersChange.onLocationFilter(loc.address)
                      }
                      selectedTrip={selectedTrip as any}
                      height="100%"
                      user={user}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {loading ? (
                // Skeleton Loader Grid
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-[400px] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : filteredTrips.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-10 h-10 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    No adventures found
                  </h3>
                  <p className="text-gray-500 mt-2 max-w-md text-center">
                    We couldn't find any trips matching your criteria. Try
                    adjusting your filters or searching for a different
                    destination.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() =>
                      setFilters({
                        search: "",
                        budgetRange: [0, 10000],
                        startDate: null,
                        endDate: null,
                        groupSize: [1, 20],
                        travelStyles: [],
                        cities: [],
                        sortBy: "newest",
                      })
                    }
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                // ✅ Trips Grid
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedTrips.map((trip, index) => (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <EnhancedTripCard
                        id={trip.id}
                        destination={trip.destination}
                        startDate={trip.start_date}
                        endDate={trip.end_date}
                        startCity={trip.start_city}
                        description={
                          trip.description || "No description provided."
                        }
                        creator={{
                          id: trip.creator_id,
                          name: trip.profiles?.full_name || "A Wanderer",
                          avatar: trip.profiles?.avatar_url || "",
                          rating: 4.8,
                          verificationBadges: ["verified"],
                          isHost: true,
                        }}
                        vibe={trip.travel_style || ["Adventure"]}
                        groupSize={{
                          current: trip.current_participants || 0,
                          max: trip.max_participants,
                        }}
                        interestedCount={trip.current_participants || 0}
                        status={trip.status as any}
                        price={
                          trip.budget_per_person
                            ? {
                                amount: trip.budget_per_person,
                                currency: "INR",
                              }
                            : undefined
                        }
                        isFemaleOnly={false}
                        isInstantJoin={true}
                        postedAt={trip.created_at}
                        isBookmarked={isBookmarked(trip.id)}
                        onBookmarkClick={() => toggleBookmark(trip.id)}
                        onClick={() => navigate(`/trip/${trip.id}`)}
                        onChatClick={() => console.log("Chat", trip.id)}
                        onLikeClick={() => console.log("Like", trip.id)}
                        onStatusChange={() => refreshTrips()}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Load More Section */}
              <div className="mt-10 flex justify-center">
                {displayedTrips.length < filteredTrips.length ? (
                  <Button
                    onClick={loadMoreTrips}
                    className="rounded-full px-8 py-6 text-lg bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm transition-transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Load More Adventures
                  </Button>
                ) : (
                  displayedTrips.length > 0 && (
                    <div className="inline-flex items-center px-6 py-3 rounded-full bg-orange-50 text-orange-700 text-sm font-medium">
                      <Sparkles className="w-4 h-4 mr-2" />
                      You've reached the end of the list!
                    </div>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DiscoverPage;
