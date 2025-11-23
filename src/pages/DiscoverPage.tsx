// src/pages/DiscoverPage.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  List,
  MapPin,
  RefreshCw,
  Filter,
  Sparkles,
  Plus,
  Loader2,
} from "lucide-react";

import TripMap from "@/components/discover/TripMap";
import MapFilters from "@/components/discover/MapFilters";
import FilterBar, { FilterOptions } from "@/components/home/FilterBar";
import EnhancedTripCard from "@/components/home/EnhancedTripCard";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useBookmarks } from "@/hooks/useBookmarks";

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

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
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

  const [mapFilters, setMapFilters] = useState({
    searchRadius: 50,
    locationFilter: "",
    nearbySearch: false,
  });

  const TRIPS_PER_PAGE = 10;

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

      if (error) {
        console.error("Error fetching trips:", error);
        toast({
          title: "Error loading trips",
          description: "Failed to load trips. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setAllTrips(data as any);
      }
    } catch (err) {
      console.error("Unexpected error fetching trips:", err);
      toast({
        title: "Unexpected error",
        description: "Something went wrong. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = useMemo(() => {
    let result = [...allTrips];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(
        (trip) =>
          trip.destination.toLowerCase().includes(searchTerm) ||
          trip.start_city.toLowerCase().includes(searchTerm) ||
          (trip.description &&
            trip.description.toLowerCase().includes(searchTerm)) ||
          (trip.profiles?.full_name &&
            trip.profiles.full_name.toLowerCase().includes(searchTerm))
      );
    }

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

    result = result.filter(
      (trip) =>
        trip.max_participants >= filters.groupSize[0] &&
        trip.max_participants <= filters.groupSize[1]
    );

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

    if (filters.travelStyles.length > 0) {
      result = result.filter(
        (trip) =>
          trip.travel_style &&
          filters.travelStyles.some((style) =>
            trip.travel_style!.includes(style)
          )
      );
    }

    if (filters.cities.length > 0) {
      result = result.filter((trip) =>
        filters.cities.some((city) =>
          trip.start_city.toLowerCase().includes(city.toLowerCase())
        )
      );
    }

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

    result.sort((a, b) => {
      switch (filters.sortBy) {
        case "budget":
          const budgetA = a.budget_per_person || 0;
          const budgetB = b.budget_per_person || 0;
          return budgetA - budgetB;
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
          description: `Finding trips within ${mapFilters.searchRadius}km of your location`,
        });
      }
    },
  };

  const handleTripSelect = (trip: any) => {
    setSelectedTrip(trip);
    navigate(`/trip/${trip.id}`);
  };

  useEffect(() => {
    fetchAllTrips();
  }, []);

  useEffect(() => {
    if (location && mapFilters.nearbySearch) {
      console.log("Searching near location:", location);
    }
  }, [location, mapFilters.nearbySearch]);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <div className="gradient-warm rounded-2xl p-6 text-center space-y-2 shadow-soft">
          <h2 className="text-2xl font-bold text-white">
            🗺️ Discover Amazing Adventures
          </h2>
          <p className="text-sm text-white/90">
            Explore trips visually on the map or browse through our curated list
          </p>
          {locationError && (
            <div className="text-xs text-white/80 bg-white/10 rounded px-2 py-1 inline-block">
              Location access needed for nearby search
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mb-6">
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "list" | "map")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="flex items-center space-x-2">
              <List className="w-4 h-4" />
              <span>List View</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Map Discovery</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {filteredTrips.length} trips found
            </Badge>
            {location && (
              <Badge
                variant="secondary"
                className="text-xs bg-green-100 text-green-800"
              >
                📍 Location detected
              </Badge>
            )}
            {mapFilters.locationFilter && (
              <Badge
                variant="secondary"
                className="text-xs bg-blue-100 text-blue-800"
              >
                📍 {mapFilters.locationFilter}
              </Badge>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshTrips}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {viewMode === "map" && (
        <div className="space-y-4">
          <div className="px-4">
            <MapFilters
              onRadiusChange={handleMapFiltersChange.onRadiusChange}
              onLocationFilter={handleMapFiltersChange.onLocationFilter}
              onNearbySearch={handleMapFiltersChange.onNearbySearch}
              currentLocation={
                location?.latitude && location?.longitude
                  ? {
                      lat: location.latitude,
                      lng: location.longitude,
                    }
                  : undefined
              }
            />
          </div>

          <div className="px-4">
            {loading ? (
              <div className="flex items-center justify-center h-96 bg-muted rounded-2xl">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading map...</p>
                </div>
              </div>
            ) : (
              <TripMap
                trips={filteredTrips as any}
                onTripSelect={handleTripSelect}
                onLocationSelect={(loc: any) => {
                  handleMapFiltersChange.onLocationFilter(loc.address);
                }}
                selectedTrip={selectedTrip as any}
                user={user}
                height="70vh"
                className="rounded-2xl overflow-hidden shadow-soft border"
              />
            )}
          </div>

          <div className="px-4">
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

      {viewMode === "list" && (
        <div className="space-y-4">
          <div className="px-4">
            <FilterBar
              onFiltersChange={handleFiltersChange}
              totalResults={filteredTrips.length}
            />
          </div>

          <div className="px-4 space-y-4">
            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading adventures...</p>
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="text-center py-10">
                <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg mb-2">
                  No trips match your criteria
                </p>
                <p className="text-muted-foreground text-sm mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button
                  variant="outline"
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
              <div className="space-y-4">
                {displayedTrips.map((trip) => {
                  const participantCount = trip.current_participants || 0;

                  return (
                    <div key={trip.id} className="relative">
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
                          current: participantCount,
                          max: trip.max_participants,
                        }}
                        interestedCount={participantCount}
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
                        onChatClick={() => {
                          console.log("Chat for trip:", trip.id);
                        }}
                        onLikeClick={() => {
                          console.log("Like trip:", trip.id);
                        }}
                        onStatusChange={(newStatus) => {
                          console.log(
                            `Trip ${trip.id} status changed to ${newStatus}`
                          );
                          refreshTrips();
                        }}
                      />
                    </div>
                  );
                })}

                {displayedTrips.length < filteredTrips.length && (
                  <div className="flex justify-center pt-6">
                    <Button
                      variant="outline"
                      onClick={loadMoreTrips}
                      className="hover-scale min-w-[200px]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Load More Adventures (
                      {filteredTrips.length - displayedTrips.length} remaining)
                    </Button>
                  </div>
                )}

                {displayedTrips.length >= filteredTrips.length &&
                  displayedTrips.length > 0 && (
                    <div className="text-center pt-6 pb-4">
                      <div className="inline-flex items-center px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm">
                        <Sparkles className="w-4 h-4 mr-2" />
                        All {filteredTrips.length} adventures shown!
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;
