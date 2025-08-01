import { useState, useEffect } from "react";
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
import TripMap from "./TripMap";
import FilterBar from "./FilterBar";
import CommunityHighlights from "./CommunityHighlights";
import EnhancedTripCard from "./EnhancedTripCard";
import PostTripModal from "@/components/trip/PostTripModal";
import LandingPage from "@/components/landing/LandingPage";
import AuthGuard from "@/components/auth/AuthGuard";
import NotificationsDropdown from "@/components/notifications/NotificationsDropdown";
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
} from "lucide-react";

// Types matching your database structure
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
  max_group_size: number;
  profiles: Profile | null;
  trip_participants: TripParticipant[];
};

interface TripFeedProps {
  user: UserType | null;
}

const TripFeed = ({ user }: TripFeedProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // ✅ NEW: Loading state for pagination
  const [hasMore, setHasMore] = useState(true); // ✅ NEW: Track if more trips available
  const [currentPage, setCurrentPage] = useState(0); // ✅ NEW: Page tracking
  const [totalTrips, setTotalTrips] = useState(0); // ✅ NEW: Total count tracking

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [activeView, setActiveView] = useState<"map" | "list">("map");
  const [filters, setFilters] = useState<any>({});

  // AuthGuard state
  const [authGuard, setAuthGuard] = useState({
    isOpen: false,
    actionType: "join" as "join" | "create" | "chat",
  });

  // ✅ UPDATED: Pagination constants
  const TRIPS_PER_PAGE = 5;

  // ✅ UPDATED: Fetch trips with pagination
  const fetchTrips = async (page: number = 0, append: boolean = false) => {
    if (page === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const from = page * TRIPS_PER_PAGE;
      const to = from + TRIPS_PER_PAGE - 1;

      // Get total count for first page
      let countQuery = supabase
        .from("trips")
        .select("*", { count: "exact", head: true });

      // Apply filters to count query if any
      if (filters.destination) {
        countQuery = countQuery.ilike(
          "destination",
          `%${filters.destination}%`
        );
      }
      if (filters.start_city) {
        countQuery = countQuery.ilike("start_city", `%${filters.start_city}%`);
      }
      if (filters.start_date) {
        countQuery = countQuery.gte("start_date", filters.start_date);
      }

      // Get data with pagination
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
          max_group_size,
          profiles!trips_creator_id_fkey(full_name, avatar_url),
          trip_participants(user_id, joined_at)
        `
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      // Apply same filters to data query
      if (filters.destination) {
        dataQuery = dataQuery.ilike("destination", `%${filters.destination}%`);
      }
      if (filters.start_city) {
        dataQuery = dataQuery.ilike("start_city", `%${filters.start_city}%`);
      }
      if (filters.start_date) {
        dataQuery = dataQuery.gte("start_date", filters.start_date);
      }

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

        // Update pagination state
        if (page === 0 && count !== null) {
          setTotalTrips(count);
        }

        const totalPages = Math.ceil((count || totalTrips) / TRIPS_PER_PAGE);
        setHasMore(page + 1 < totalPages);
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
  };

  // ✅ UPDATED: Load more trips function
  const loadMoreTrips = async () => {
    if (!hasMore || loadingMore) return;
    await fetchTrips(currentPage + 1, true);
  };

  // ✅ UPDATED: Refresh trips function
  const refreshTrips = async () => {
    setCurrentPage(0);
    await fetchTrips(0, false);
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchTrips(0, false);
  }, [isPostModalOpen, filters]);

  // Existing handler functions (unchanged)
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

  const handleProfileClick = () => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    console.log("Navigate to profile");
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

  const handleTripClick = (trip: any) => {
    setSelectedTrip(trip);
    navigate(`/trip/${trip.id}`);
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

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    console.log("Filters changed:", newFilters);
  };

  const handleLocationSelect = (location: any) => {
    console.log("Location selected:", location);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header with Profile Dropdown */}
      {/* <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-foreground">WanderTribe</h1>
              <Badge
                variant="outline"
                className="text-xs bg-vibrant-forest/10 text-vibrant-forest border-vibrant-forest/30"
              >
                🔥 {totalTrips} Live Adventures
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              {user && (
                <>
                  <NotificationsDropdown user={user} />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center space-x-2 px-2 py-1 h-auto rounded-full hover:bg-muted/50"
                      >
                        <Avatar className="w-8 h-8">
                          {user.user_metadata?.avatar_url ? (
                            <AvatarImage
                              src={user.user_metadata.avatar_url}
                              alt="Profile"
                            />
                          ) : (
                            <AvatarFallback className="bg-earth-sand text-earth-terracotta">
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="hidden md:flex items-center space-x-1">
                          <span className="text-sm font-medium truncate max-w-[100px]">
                            {user.user_metadata?.full_name ||
                              user.email?.split("@")[0] ||
                              "Traveler"}
                          </span>
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6">
                          {user.user_metadata?.avatar_url ? (
                            <AvatarImage src={user.user_metadata.avatar_url} />
                          ) : (
                            <AvatarFallback className="bg-earth-sand text-earth-terracotta text-xs">
                              <User className="w-3 h-3" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {user.user_metadata?.full_name ||
                              "Travel Enthusiast"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </DropdownMenuLabel>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={handleViewProfile}
                        className="cursor-pointer"
                      >
                        <UserCircle className="w-4 h-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={handleSettings}
                        className="cursor-pointer"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {!user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSignInModal(true)}
                  className="flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline">Sign In</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="pb-20">
        {/* Welcome Banner */}
        <div className="p-4">
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

        {/* Map/List Toggle */}
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

        {/* Map View */}
        {activeView === "map" && (
          <div className="px-4 mb-6">
            <TripMap onLocationSelect={handleLocationSelect} />
          </div>
        )}

        {/* Filter Bar */}
        <div className="px-4 mb-6">
          <FilterBar onFiltersChange={handleFiltersChange} />
        </div>

        {/* Trip Feed with Enhanced Loading */}
        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold">Active Trips</h3>
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
              <Badge variant="outline" className="text-xs">
                Showing {trips.length} of {totalTrips}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Updated 2 min ago
              </Badge>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading adventures...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-10">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-lg mb-2">
                No trips found
              </p>
              <p className="text-muted-foreground text-sm">
                Try adjusting your filters or be the first to create a trip!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => {
                const participantCount = trip.trip_participants?.length || 0;

                const enhancedTrip = {
                  id: trip.id,
                  destination: trip.destination,
                  startDate: trip.start_date,
                  endDate: trip.end_date,
                  startCity: trip.start_city,
                  description: trip.description || "No description provided.",
                  creator: {
                    name: trip.profiles?.full_name || "A Wanderer",
                    avatar: trip.profiles?.avatar_url || "",
                    rating: 4.8,
                    verificationBadges: ["verified"],
                    isHost: true,
                  },
                  vibe: ["Adventure", "Photography"],
                  groupSize: {
                    current: participantCount,
                    max: trip.max_group_size,
                  },
                  interestedCount: participantCount,
                  price: { amount: 0, currency: "INR" },
                  isFemaleOnly: false,
                  isInstantJoin: true,
                  postedAt: trip.created_at,
                };

                return (
                  <EnhancedTripCard
                    key={trip.id}
                    {...enhancedTrip}
                    onClick={() => handleTripClick(trip)}
                    onJoinClick={() => handleTripJoin(trip.id)}
                    onChatClick={() => handleTripChat(trip.id)}
                    onLikeClick={() => console.log("Like trip:", trip.id)}
                  />
                );
              })}
            </div>
          )}

          {/* ✅ UPDATED: Enhanced Load More Button */}
          {hasMore && trips.length > 0 && (
            <div className="flex justify-center pt-6">
              <Button
                variant="outline"
                onClick={loadMoreTrips}
                disabled={loadingMore}
                className="hover-scale min-w-[200px]"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading More...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Load More Adventures
                  </>
                )}
              </Button>
            </div>
          )}

          {/* End of results indicator */}
          {!hasMore && trips.length > 0 && (
            <div className="text-center pt-6 pb-4">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                You've seen all adventures! Check back later for more.
              </div>
            </div>
          )}
        </div>

        {/* Community Highlights */}
        <div className="px-4 mt-8">
          <CommunityHighlights />
        </div>
      </main>

      {/* Floating Action Button */}
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

      {/* Modals */}
      <PostTripModal
        open={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
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
