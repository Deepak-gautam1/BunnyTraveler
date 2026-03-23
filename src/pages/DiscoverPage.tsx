// src/pages/DiscoverPage.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  List,
  Map as MapIcon,
  RefreshCw,
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
import { getCityCoordinates } from "@/lib/geocoding";
import { getDistanceFromLatLonInKm } from "@/lib/distance";
import type { TripStatus } from "@/hooks/useTripStatus";
type Profile = { full_name: string; avatar_url: string };
type TripParticipant = { user_id: string; joined_at: string };
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
  start_lat: number | null;
  start_lng: number | null;
  profiles: Profile | null;
  trip_participants: TripParticipant[];
};

interface DiscoverPageProps {
  user: User | null;
}

type MapFiltersState = {
  searchRadius: number;
  locationFilter: string;
  nearbySearch: boolean;
  centerCoords: { lat: number; lng: number } | null;
};

interface TripCardWrapperProps {
  trip: Trip;
  navigate: (path: string) => void;
  toggleBookmark: (tripId: number) => Promise<boolean>;
  isBookmarked: (tripId: number) => boolean;
  refreshTrips: () => void;
}

const TripCardWrapper = ({
  trip,
  navigate,
  toggleBookmark,
  isBookmarked,
  refreshTrips,
}: TripCardWrapperProps) => {
  const tripPrice = trip.budget_per_person
    ? { amount: trip.budget_per_person, currency: "INR" }
    : undefined;

  const tripCreator = {
    id: trip.creator_id,
    name: trip.profiles?.full_name || "A Wanderer",
    avatar: trip.profiles?.avatar_url || "",
    rating: 4.8,
    verificationBadges: ["verified"],
    isHost: true,
  };

  const tripGroupSize = {
    current: trip.current_participants || 0,
    max: trip.max_participants,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <EnhancedTripCard
        id={trip.id}
        destination={trip.destination}
        startDate={trip.start_date}
        endDate={trip.end_date}
        startCity={trip.start_city}
        description={trip.description || "No description provided."}
        creator={tripCreator}
        vibe={trip.travel_style || ["Adventure"]}
        groupSize={tripGroupSize}
        interestedCount={trip.current_participants || 0}
        status={(trip.status ?? "planning") as TripStatus}
        price={tripPrice}
        isFemaleOnly={false}
        isInstantJoin={true}
        postedAt={trip.created_at}
        isBookmarked={isBookmarked(trip.id)}
        onBookmarkClick={() => toggleBookmark(trip.id)}
        onClick={() => navigate(`/trip/${trip.id}`)}
        onChatClick={() => {}}
        onLikeClick={() => {}}
        onStatusChange={() => refreshTrips()}
      />
    </motion.div>
  );
};

const DiscoverPage = ({ user }: DiscoverPageProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    location,
    getCurrentLocation,
    error: locationError,
  } = useGeolocation();
  useEffect(() => {
    if (locationError) {
      toast({
        title: "Location Access Denied",
        description:
          "Please enable location permissions to use 'Near Me' feature.",
        variant: "destructive",
      });
    }
  }, [locationError, toast]);
  const { toggleBookmark, isBookmarked } = useBookmarks(user);

  const [viewMode, setViewMode] = useState<"list" | "map">(() => {
    return (getCookie(COOKIE_KEYS.VIEW_MODE) as "list" | "map") || "list";
  });
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Default Filters
  const defaultFilters: FilterOptions = {
    search: "",
    budgetRange: [0, 10000],
    startDate: null,
    endDate: null,
    groupSize: [1, 20],
    travelStyles: [],
    cities: [],
    sortBy: "newest",
  };

  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);

  const [mapFilters, setMapFilters] = useState<MapFiltersState>(() => {
    const saved = getCookie<MapFiltersState>(COOKIE_KEYS.MAP_FILTERS);
    return (
      saved || {
        searchRadius: 0,
        locationFilter: "",
        nearbySearch: false,
        centerCoords: null,
      }
    );
  });

  const TRIPS_PER_PAGE = 9;

  // --- Effects ---
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
          `,
        )
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setAllTrips(data as Trip[]);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load trips.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ CENTRAL FILTER LOGIC
  const filteredTrips = useMemo(() => {
    let result = [...allTrips];

    // 1. GENERIC SEARCH (Text matches anywhere)
    // IMPORTANT: We only run generic search if we are NOT in specific location mode
    if (filters.search && !mapFilters.locationFilter) {
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

    // 2. BUDGET FILTER
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

    // 3. GROUP SIZE & DATES
    result = result.filter(
      (trip) =>
        trip.max_participants >= filters.groupSize[0] &&
        trip.max_participants <= filters.groupSize[1],
    );

    if (filters.startDate) {
      result = result.filter(
        (trip) => new Date(trip.start_date) >= filters.startDate!,
      );
    }
    if (filters.endDate) {
      result = result.filter(
        (trip) => new Date(trip.end_date) <= filters.endDate!,
      );
    }

    // 4. TRAVEL STYLES
    if (filters.travelStyles.length > 0) {
      result = result.filter(
        (trip) =>
          trip.travel_style &&
          filters.travelStyles.some((style) =>
            trip.travel_style!.includes(style),
          ),
      );
    }

    // 5. CITIES ARRAY (Fallback from FilterBar)
    if (
      filters.cities.length > 0 &&
      !filters.search &&
      !mapFilters.locationFilter
    ) {
      result = result.filter((trip) =>
        filters.cities.some(
          (city) =>
            trip.start_city.toLowerCase().includes(city.toLowerCase()) ||
            trip.destination.toLowerCase().includes(city.toLowerCase()),
        ),
      );
    }

    // 6. MAP & LOCATION LOGIC
    // CASE A: Radius Filter is ACTIVE (Slider > 0)
    // This allows expanding search beyond the city name
    if (mapFilters.centerCoords && mapFilters.searchRadius > 0) {
      const { lat: centerLat, lng: centerLng } = mapFilters.centerCoords;

      result = result.filter((trip) => {
        if (trip.start_lat == null || trip.start_lng == null) return false;

        const distance = getDistanceFromLatLonInKm(
          centerLat,
          centerLng,
          trip.start_lat,
          trip.start_lng,
        );
        return distance <= mapFilters.searchRadius;
      });
    }
    // CASE B: Exact Location Match (Radius == 0)
    else if (mapFilters.locationFilter) {
      result = result.filter(
        (trip) =>
          trip.start_city
            .toLowerCase()
            .includes(mapFilters.locationFilter.toLowerCase()) ||
          trip.destination
            .toLowerCase()
            .includes(mapFilters.locationFilter.toLowerCase()),
      );
    }

    // 7. SORT
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

  const resetAllFilters = () => {
    setFilters(defaultFilters);
    setMapFilters({
      searchRadius: 0,
      locationFilter: "",
      nearbySearch: false,
      centerCoords: null,
    });
    setCurrentPage(0);
    toast({ title: "Filters reset", description: "Showing all trips" });
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const handleMapFiltersChange = {
    onRadiusChange: (radius: number) => {
      setMapFilters((prev) => ({ ...prev, searchRadius: radius }));
    },
    onLocationFilter: async (locationName: string) => {
      setMapFilters((prev) => ({
        ...prev,
        locationFilter: locationName,
        nearbySearch: false,
      }));

      if (!locationName) {
        setMapFilters((prev) => ({ ...prev, centerCoords: null }));
        return;
      }

      const coords = await getCityCoordinates(locationName);
      // ✅ FIXED: Add null checks before setting centerCoords
      if (coords && coords.latitude !== null && coords.longitude !== null) {
        setMapFilters((prev) => ({
          ...prev,
          centerCoords: { lat: coords.latitude, lng: coords.longitude },
        }));
      }
    },
    onNearbySearch: async () => {
      // ✅ Already has null checks
      if (
        !location ||
        location.latitude === null ||
        location.longitude === null
      ) {
        getCurrentLocation();
        return;
      }
      const DEFAULT_NEARBY_RADIUS = 50;
      const currentLat = location.latitude;
      const currentLng = location.longitude;
      setMapFilters((prev) => ({
        ...prev,
        nearbySearch: true,
        searchRadius: DEFAULT_NEARBY_RADIUS,
        locationFilter: "Current Location",
        centerCoords: {
          lat: currentLat,
          lng: currentLng,
        },
      }));

      toast({
        title: "Searching nearby",
        description: `Finding trips within ${DEFAULT_NEARBY_RADIUS} km`,
      });
    },
  };

  const handleTripSelect = (trip: { id: number }) => {
    setSelectedTrip(trip as Trip);
    navigate(`/trip/${trip.id}`);
  };

  // ✅ LOGIC FIX: Handle Destination Click
  // We clear generic 'search' and use 'locationFilter' + 'centerCoords'
  // This allows the Radius Slider to work on this location later.
  const handleDestinationClick = async (destination: string) => {
    setFilters((prev) => ({ ...prev, search: "" }));

    setMapFilters((prev) => ({
      ...prev,
      locationFilter: destination,
      searchRadius: 0,
      nearbySearch: false,
      centerCoords: null,
    }));

    setCurrentPage(0);

    const coords = await getCityCoordinates(destination);

    if (coords) {
      setMapFilters((prev) => ({
        ...prev,
        centerCoords: { lat: coords.latitude, lng: coords.longitude },
      }));
    }

    toast({
      title: `Showing trips in ${destination}`,
      description: "Use the radius slider to expand your search.",
    });

    setTimeout(() => {
      const tripsSection = document.getElementById("trips-section");
      if (tripsSection) {
        const yOffset = -100;
        const y =
          tripsSection.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 150);
  };

  useEffect(() => {
    fetchAllTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-orange-50 via-orange-100 to-pink-50 pt-16 pb-32 px-4 shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-orange-200 blur-3xl"></div>
          <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full bg-pink-200 blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
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
                  0,
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

      {/* Control Bar */}
      {/* Control Bar */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <Card className="p-2 md:p-4 shadow-xl border-white/20 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl">
          <div className="flex flex-col gap-4">
            {/* Row 1: Search Bar (Full Width) */}
            <div className="w-full">
              <FilterBar
                onFiltersChange={handleFiltersChange}
                totalResults={filteredTrips.length}
                currentFilters={filters}
              />
            </div>

            {/* Row 2: Action Buttons (Always Horizontal) */}
            <div className="flex items-center gap-2 justify-between flex-wrap">
              {/* Left Side: Location Badge */}
              <div className="flex items-center gap-2">
                {location &&
                  location.latitude !== null &&
                  location.longitude !== null && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200 whitespace-nowrap"
                    >
                      <MapPin className="w-3 h-3" /> Location On
                    </Badge>
                  )}
              </div>

              {/* Right Side: Action Buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAllFilters}
                  className="text-gray-500 hover:text-red-500 hover:bg-red-50 whitespace-nowrap text-xs sm:text-sm"
                  title="Clear all filters"
                >
                  Clear Filters
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refreshTrips}
                  disabled={loading}
                  className="hover:bg-gray-100 rounded-full flex-shrink-0"
                  title="Refresh Trips"
                >
                  <RefreshCw
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-600 ${
                      loading ? "animate-spin" : ""
                    }`}
                  />
                </Button>

                <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-full flex flex-shrink-0">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      viewMode === "list"
                        ? "bg-white dark:bg-gray-700 text-orange-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span>List</span>
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      viewMode === "map"
                        ? "bg-white dark:bg-gray-700 text-orange-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <MapIcon className="w-4 h-4" />
                    <span>Map</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Trips Section */}
      <div id="trips-section" className="max-w-7xl mx-auto px-4 mt-8">
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
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  {/* ✅ ADDED: Controlled prop searchRadius */}
                  <MapFilters
                    searchRadius={mapFilters.searchRadius}
                    onRadiusChange={handleMapFiltersChange.onRadiusChange}
                    onLocationFilter={handleMapFiltersChange.onLocationFilter}
                    onNearbySearch={handleMapFiltersChange.onNearbySearch}
                    currentLocation={
                      location && location.latitude && location.longitude
                        ? { lat: location.latitude, lng: location.longitude }
                        : undefined
                    }
                  />

                  {/* Status Card */}
                  <Card className="p-4 bg-orange-50 border-orange-100">
                    <h3 className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-2">
                      Active Search Area
                    </h3>
                    {mapFilters.locationFilter ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <MapPin className="w-4 h-4 text-orange-600" />
                          {mapFilters.locationFilter}
                        </div>
                        <div className="text-xs text-gray-600 pl-6">
                          {mapFilters.searchRadius > 0
                            ? `Radius: ${mapFilters.searchRadius} km`
                            : "Exact city match only"}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">
                        No specific location selected. Showing all trips.
                      </p>
                    )}
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold text-sm mb-3">
                      Travel Styles
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        Adventure
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        Relaxation
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
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
                      trips={filteredTrips.map((t) => ({
                        ...t,
                        current_participants: t.current_participants ?? 0,
                      }))}
                      onTripSelect={handleTripSelect}
                      onLocationSelect={(loc: { address: string }) =>
                        handleMapFiltersChange.onLocationFilter(loc.address)
                      }
                      selectedTrip={selectedTrip}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-[400px] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : filteredTrips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-10 h-10 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    No adventures found
                  </h3>
                  <p className="text-gray-500 mt-2 max-w-md text-center">
                    We could not find any trips matching your criteria.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={resetAllFilters}
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedTrips.map((trip) => (
                    <TripCardWrapper
                      key={trip.id}
                      trip={trip}
                      navigate={navigate}
                      toggleBookmark={toggleBookmark}
                      isBookmarked={isBookmarked}
                      refreshTrips={refreshTrips}
                    />
                  ))}
                </div>
              )}

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
                      You have reached the end of the list!
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
