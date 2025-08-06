// src/components/home/TripFeed.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as UserType } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TripMap from "../discover/TripMap";
import FilterBar, { FilterOptions } from "./FilterBar";
import CommunityHighlights from "./CommunityHighlights";
import EnhancedTripCard from "./EnhancedTripCard";
import PostTripModal from "@/components/trip/PostTripModal";
import LandingPage from "@/components/landing/LandingPage";
import AuthGuard from "@/components/auth/AuthGuard";
import NotificationsDropdown from "@/components/notifications/NotificationsDropdown";
import { useBookmarks } from "@/hooks/useBookmarks";
import BookmarkButton from "@/components/trip/BookmarkButton";
import RecommendationSection from "@/components/home/RecommendationSection";

// ✅ NEW: Import TripStatus type for status management
import { TripStatus } from "@/hooks/useTripStatus";

import {
  Plus,
  User,
  MapPin,
  List,
  Sparkles,
  Bell,
  LogOut,
  Settings,
  UserCircle,
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
  created_at: string;
  max_participants: number;
  current_participants: number;
  budget_per_person: number | null;
  travel_style: string[] | null;
  status: string;
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

  // State management (keep all existing state)
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalTrips, setTotalTrips] = useState(0);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
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

  // ✅ Keep existing applyFiltersToQuery function unchanged
  const applyFiltersToQuery = (query: any, currentFilters: FilterOptions) => {
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.trim();
      query = query.or(
        `destination.ilike.%${searchTerm}%,start_city.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
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
        currentFilters.startDate.toISOString().split("T")[0]
      );
    }
    if (currentFilters.endDate) {
      query = query.lte(
        "end_date",
        currentFilters.endDate.toISOString().split("T")[0]
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

  // ✅ Keep existing fetchTrips function unchanged
  const fetchTrips = useCallback(
    async (page: number, append: boolean = false) => {
      if (page === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const from = page * TRIPS_PER_PAGE;
        const to = from + TRIPS_PER_PAGE - 1;

        // ✅ FIXED: Both queries use same status filter
        const statusFilter = ["active", "upcoming"];

        // Get total count (only for first page)
        let countQuery = supabase
          .from("trips")
          .select(
            `
        *,
        profiles!trips_creator_id_fkey(full_name, avatar_url),
        trip_participants(user_id, joined_at)
      `
          )
          .in("status", statusFilter) // ✅ Same filter as data query
          .order("start_date", { ascending: true });

        // Apply filters to count query
        countQuery = applyFiltersToQuery(countQuery, filters);

        // ✅ FIXED: Data query now matches count query
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
          profiles!trips_creator_id_fkey(full_name, avatar_url),
          trip_participants(user_id, joined_at)
        `
          )
          .in("status", statusFilter) // ✅ FIXED: Now includes both active and upcoming
          .range(from, to);

        // Apply same filters to data query
        dataQuery = applyFiltersToQuery(dataQuery, filters);

        // Apply sorting
        switch (filters.sortBy) {
          case "budget":
            dataQuery = dataQuery.order("budget_per_person", {
              ascending: true,
              nullsLast: true,
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

        // Execute both queries
        const [{ count }, { data, error }] = await Promise.all([
          page === 0 ? countQuery : Promise.resolve({ count: totalTrips }),
          dataQuery,
        ]);

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
          const newTrips = data as Trip[];

          if (append) {
            setTrips((prev) => [...prev, ...newTrips]);
          } else {
            setTrips(newTrips);
            setCurrentPage(0);
          }

          if (page === 0 && count !== null) {
            setTotalTrips(count);
          }

          setCurrentPage(page);
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
        setLoadingMore(false);
      }
    },
    [filters, totalTrips, toast]
  );

  // ✅ Keep all existing functions unchanged
  const loadMoreTrips = useCallback(async () => {
    if (trips.length < totalTrips && !loadingMore) {
      await fetchTrips(currentPage + 1, true);
    }
  }, [trips.length, totalTrips, loadingMore, currentPage, fetchTrips]);

  const refreshTrips = useCallback(async () => {
    setCurrentPage(0);
    setTrips([]);
    await fetchTrips(0, false);
  }, [fetchTrips]);

  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(0);
    setTrips([]);
  }, []);

  // ✅ Keep existing useEffect unchanged
  useEffect(() => {
    fetchTrips(0, false);
  }, [fetchTrips]);

  // ✅ Keep all existing event handlers unchanged
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out successfully",
          description: "See you on your next adventure!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleViewProfile = () => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    navigate("/profile");
  };

  const handleSettings = () => {
    console.log("Navigate to settings");
    toast({
      title: "Settings",
      description: "Settings page coming soon!",
    });
  };

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

  const handleTripJoin = (tripId: string | number) => {
    if (!user) {
      toast({
        title: "Hey traveler! 🚀",
        description:
          "You need an account to join trips. Sign in to get started!",
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
    console.log("Join trip:", tripId);
  };

  const handleTripChat = (tripId: string | number) => {
    if (!user) {
      setAuthGuard({ isOpen: true, actionType: "chat" });
      return;
    }
    console.log("Chat for trip:", tripId);
  };

  const handleLocationSelect = (location: any) => {
    console.log("Location selected:", location);
  };

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

  // ✅ Keep existing computed property unchanged
  const hasMore = trips.length < totalTrips;

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20">
        {/* Keep existing Welcome Banner unchanged */}
        <div className="px-4  pb-4">
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

        {/* Keep existing Recommendation Section unchanged */}
        {user && (
          <RecommendationSection
            user={user}
            onTripClick={handleRecommendationClick}
          />
        )}

        {/* Keep all existing sections unchanged until the trip mapping */}
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

        {/* Keep existing Map View unchanged */}
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
                trips={trips}
                onTripSelect={(trip) => {
                  setSelectedTrip(trip);
                  navigate(`/trip/${trip.id}`);
                }}
                onLocationSelect={handleLocationSelect}
                selectedTrip={selectedTrip}
                user={user}
                height="600px"
                className="rounded-2xl overflow-hidden shadow-soft border"
              />

              {/* ✅ UPDATED: Enhanced Load More UI for Map View */}
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

        {/* Keep existing Filter Bar unchanged */}
        <div className="px-4 mb-6">
          <FilterBar
            onFiltersChange={handleFiltersChange}
            totalResults={totalTrips}
          />
        </div>

        {/* Keep existing Trip Feed header unchanged */}
        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Mountain className="w-5 h-5 text-accent" />
                <span>Active Adventures</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshTrips}
                disabled={loading}
                className="flex items-center space-x-1"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden md:inline">Refresh</span>
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className="text-xs flex items-center gap-1"
              >
                <MapPin className="w-3 h-3" />
                <span>{totalTrips} adventures available</span>
              </Badge>
              <Badge variant="outline" className="text-xs">
                Page {currentPage + 1}
              </Badge>
              {hasMore && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-800"
                >
                  More available
                </Badge>
              )}
            </div>
          </div>

          {/* Keep existing loading/empty states unchanged */}
          {loading && trips.length === 0 ? (
            <div className="text-center py-10">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-muted-foreground">
                Loading adventures...
              </p>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-10">
              <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-lg mb-2">
                No trips found
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                Try adjusting your filters or be the first to create a trip!
              </p>
              <Button variant="outline" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ✅ UPDATED: Enhanced trip mapping with status support */}
              {trips.map((trip, index) => {
                const participantCount = trip.current_participants || 0;

                const enhancedTrip = {
                  id: trip.id,
                  destination: trip.destination,
                  startDate: trip.start_date,
                  endDate: trip.end_date,
                  startCity: trip.start_city,
                  description: trip.description || "No description provided.",
                  creator: {
                    id: trip.creator_id, // ✅ NEW: Add creator ID for status management
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
                  interestedCount: participantCount,
                  status: trip.status as TripStatus, // ✅ NEW: Add status with proper typing
                  price: trip.budget_per_person
                    ? {
                        amount: trip.budget_per_person,
                        currency: "INR",
                      }
                    : undefined,
                  isFemaleOnly: false,
                  isInstantJoin: true,
                  postedAt: trip.created_at,
                };

                return (
                  <div key={trip.id} className="relative">
                    <div className="absolute top-4 right-4 z-10">
                      {/* Keep existing bookmark button commented */}
                      {/* <BookmarkButton
                      tripId={trip.id}
                      isBookmarked={isBookmarked(trip.id)}
                      onToggle={toggleBookmark}
                      variant="bookmark"
                      size="md"
                    /> */}
                    </div>

                    <EnhancedTripCard
                      {...enhancedTrip}
                      isBookmarked={isBookmarked(trip.id)}
                      onBookmarkClick={() => toggleBookmark(trip.id)}
                      onClick={() => handleTripClick(trip)}
                      onJoinClick={() => handleTripJoin(trip.id)}
                      onChatClick={() => handleTripChat(trip.id)}
                      onLikeClick={() => console.log("Like trip:", trip.id)}
                      onStatusChange={(newStatus) => {
                        // ✅ NEW: Add status change handler
                        console.log(
                          `Trip ${trip.id} status changed to ${newStatus}`
                        );
                        refreshTrips(); // Refresh trips after status change
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* ✅ UPDATED: Enhanced Load More UI - Matching Comments Design */}
          <div className="flex justify-center items-center space-x-3 pt-6">
            {/* Load More Adventures Button */}
            {hasMore && trips.length > 0 && (
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
                    <span>Load More Adventures</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {Math.min(TRIPS_PER_PAGE, totalTrips - trips.length)} more
                    </Badge>
                  </>
                )}
              </Button>
            )}

            {/* Show Less Button */}
            {trips.length > TRIPS_PER_PAGE && (
              <Button
                onClick={() => {
                  // Reset to initial page size
                  setTrips(trips.slice(0, TRIPS_PER_PAGE));
                  setCurrentPage(0);
                }}
                variant="ghost"
                size="default"
                className="text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all duration-300"
              >
                <ChevronUp className="w-4 h-4 mr-2" />
                <span>Show Less</span>
              </Button>
            )}
          </div>

          {/* Progress Indicator */}
          {trips.length > 0 && totalTrips > TRIPS_PER_PAGE && (
            <div className="flex justify-center pt-4">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>
                  Showing {trips.length} of {totalTrips} adventures
                </span>
                <div className="w-24 bg-muted rounded-full h-1">
                  <div
                    className="bg-accent h-1 rounded-full transition-all duration-300"
                    style={{ width: `${(trips.length / totalTrips) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {!hasMore && trips.length > 0 && (
            <div className="text-center pt-6 pb-4">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                You've seen all {totalTrips} adventures! Check back later for
                more.
              </div>
            </div>
          )}
        </div>

        {/* Keep existing Community Highlights unchanged */}
        <div className="px-4 mt-8">
          <CommunityHighlights />
        </div>
      </main>

      {/* Keep all existing modals and floating action button unchanged */}
      <div className="fixed bottom-6 right-6 z-30">
        <Button
          variant="fab"
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
