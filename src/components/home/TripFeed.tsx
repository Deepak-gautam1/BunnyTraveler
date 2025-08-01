import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as UserType } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import TripMap from "./TripMap";
import FilterBar from "./FilterBar";
import CommunityHighlights from "./CommunityHighlights";
import EnhancedTripCard from "./EnhancedTripCard";
import PostTripModal from "@/components/trip/PostTripModal";
import LandingPage from "@/components/landing/LandingPage";
import AuthGuard from "@/components/auth/AuthGuard";
import {
  Plus,
  User,
  MapPin,
  List,
  Sparkles,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  UserCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  // Fetch trips from database
  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);

      try {
        const { data, error } = await supabase
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
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching trips:", error);
          return;
        }

        if (data) {
          setTrips(data as Trip[]);
        }
      } catch (err) {
        console.error("Unexpected error fetching trips:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [isPostModalOpen]);

  // Handler functions
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

  // ✅ ADD: Handle sign out
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
  // ✅ ADD: Handle profile navigation
  const handleViewProfile = () => {
    // Navigate to user's profile page (implement this route later)
    console.log("Navigate to profile page");
    toast({
      title: "Profile Page",
      description: "Profile page coming soon!",
    });
  };

  // ✅ ADD: Handle settings
  const handleSettings = () => {
    console.log("Navigate to settings");
    toast({
      title: "Settings",
      description: "Settings page coming soon!",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ✅ UPDATED: Enhanced Header with Profile Dropdown */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-foreground">WanderTribe</h1>
              <Badge
                variant="outline"
                className="text-xs bg-vibrant-forest/10 text-vibrant-forest border-vibrant-forest/30"
              >
                🔥 {trips.length} Live Adventures
              </Badge>
            </div>

            {/* ✅ UPDATED: Right side with notifications and profile dropdown */}
            <div className="flex items-center space-x-2">
              {user && (
                <>
                  {/* Notifications Button */}
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"></span>
                  </Button>

                  {/* ✅ NEW: Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="profile-dropdown-trigger flex items-center space-x-2 px-2 py-1 h-auto rounded-full hover:bg-gray-100"
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
                          <span className="profile-name text-sm font-medium text-gray-900 truncate max-w-[100px]">
                            {user.user_metadata?.full_name ||
                              user.email?.split("@")[0] ||
                              "Traveler"}
                          </span>
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="profile-dropdown-content w-56 bg-white border shadow-lg"
                    >
                      <DropdownMenuLabel className="flex items-center space-x-2 p-3">
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
                          <span className="profile-dropdown-name text-sm font-medium text-gray-900">
                            {user.user_metadata?.full_name ||
                              "Travel Enthusiast"}
                          </span>
                          <span className="profile-dropdown-email text-xs text-gray-600">
                            {user.email}
                          </span>
                        </div>
                      </DropdownMenuLabel>

                      <DropdownMenuSeparator className="bg-gray-200" />

                      <DropdownMenuItem
                        onClick={handleViewProfile}
                        className="profile-dropdown-item cursor-pointer text-gray-900 hover:bg-gray-100"
                      >
                        <UserCircle className="w-4 h-4 mr-2 text-gray-600" />
                        View Profile
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={handleSettings}
                        className="profile-dropdown-item cursor-pointer text-gray-900 hover:bg-gray-100"
                      >
                        <Settings className="w-4 h-4 mr-2 text-gray-600" />
                        Settings
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-gray-200" />

                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="cursor-pointer text-red-600 hover:bg-red-50 focus:text-red-700"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {/* ✅ UPDATED: Show sign-in button when user is not authenticated */}
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
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {/* Welcome Banner - Matching Reference */}
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

        {/* Map/List Toggle - Matching Reference */}
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

        {/* Trip Feed - Matching Reference Structure */}
        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Trips</h3>
            <Badge variant="outline" className="text-xs">
              Updated 2 min ago
            </Badge>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-10">
              Loading trips...
            </p>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => {
                const participantCount = trip.trip_participants?.length || 0;

                // Transform database data to match EnhancedTripCard props
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

          {/* Load More - Matching Reference */}
          <div className="flex justify-center pt-4">
            <Button variant="outline" className="hover-scale">
              Load More Adventures
            </Button>
          </div>
        </div>

        {/* Community Highlights */}
        <div className="px-4 mt-8">
          <CommunityHighlights />
        </div>
      </main>

      {/* Enhanced Floating Action Button - Matching Reference */}
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

      {/* Post Trip Modal */}
      <PostTripModal
        open={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />

      {/* Sign In Modal - Matching Reference */}
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

      {/* AuthGuard Component */}
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
