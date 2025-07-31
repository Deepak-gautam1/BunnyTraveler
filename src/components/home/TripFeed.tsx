import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as UserType } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TripMap from "./TripMap";
import FilterBar from "./FilterBar";
import CommunityHighlights from "./CommunityHighlights";
import EnhancedTripCard from "./EnhancedTripCard";
import PostTripModal from "@/components/trip/PostTripModal";
import LandingPage from "@/components/landing/LandingPage";
import { ensureProfileExists } from "@/lib/auth-helpers";
import { Plus, User, MapPin, List, Sparkles, Bell } from "lucide-react";
import ProfileCompletionFlow from "@/components/profile/ProfileCompletionFlow";

// Types matching your actual schema
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
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [activeView, setActiveView] = useState<"map" | "list">("map");
  const [filters, setFilters] = useState<any>({});

  // Core state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Performance optimization states
  const [profileReady, setProfileReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize profile only once
  useEffect(() => {
    let isMounted = true;

    const initProfile = async () => {
      if (!user || profileReady) return;

      try {
        const profile = await ensureProfileExists(user);
        if (isMounted) {
          setUserProfile(profile);
          setProfileReady(true);
        }
      } catch (error) {
        console.error("Profile initialization error:", error);
        if (isMounted) {
          setProfileReady(true);
        }
      }
    };

    initProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // ✅ CORRECTED: Fetch trips with proper schema-based query
  useEffect(() => {
    let isMounted = true;

    const fetchTrips = async () => {
      if (isInitialized) return;

      setLoading(true);

      try {
        // ✅ FIXED: Query matches your actual database schema
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

        if (data && isMounted) {
          console.log("Fetched trips data:", data); // Debug log
          setTrips(data as Trip[]);
          setIsInitialized(true);
        }
      } catch (err) {
        console.error("Unexpected error fetching trips:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTrips();

    return () => {
      isMounted = false;
    };
  }, []);

  // Refresh trips after modal closes
  useEffect(() => {
    if (!isPostModalOpen && isInitialized) {
      const refreshTrips = async () => {
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

          if (data && !error) {
            setTrips(data as Trip[]);
          }
        } catch (err) {
          console.error("Error refreshing trips:", err);
        }
      };

      refreshTrips();
    }
  }, [isPostModalOpen, isInitialized]);

  const handleProfileUpdated = () => {
    if (user && profileReady) {
      ensureProfileExists(user)
        .then((profile) => {
          setUserProfile(profile);
        })
        .catch((error) => {
          console.error("Error updating profile:", error);
        });
    }
  };

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
      setShowSignInModal(true);
      return;
    }
    setIsPostModalOpen(true);
  };

  const handleTripClick = (trip: any) => {
    navigate(`/trip/${trip.id}`);
  };

  const handleTripJoin = (tripId: string | number) => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    console.log("Join trip:", tripId);
  };

  const handleTripChat = (tripId: string | number) => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    console.log("Chat for trip:", tripId);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleLocationSelect = (location: any) => {
    console.log("Location selected:", location);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <div className="flex items-center space-x-2">
              {user && (
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full"></span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleProfileClick}
                className="rounded-full"
              >
                <Avatar className="w-8 h-8">
                  {user && user.user_metadata?.avatar_url ? (
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
              </Button>
            </div>
          </div>
        </div>
      </header>

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

        {/* Profile Completion Flow */}
        {user && userProfile && profileReady && (
          <div className="px-4 mb-4">
            <ProfileCompletionFlow
              user={user}
              profile={userProfile}
              onProfileUpdated={handleProfileUpdated}
            />
          </div>
        )}

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

        {/* Trip Feed */}
        <div className="px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Trips</h3>
            <Badge variant="outline" className="text-xs">
              Updated just now
            </Badge>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-10">
              Loading trips...
            </p>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => {
                // ✅ CORRECTED: Calculate participant count from actual data structure
                const participantCount = trip.trip_participants?.length || 0;

                // Check if current user is already a participant
                const isUserParticipant = trip.trip_participants?.some(
                  (participant) => participant.user_id === user?.id
                );

                return (
                  <EnhancedTripCard
                    key={trip.id}
                    id={trip.id}
                    destination={trip.destination}
                    startDate={trip.start_date}
                    endDate={trip.end_date}
                    startCity={trip.start_city}
                    description={trip.description ?? "No description provided."}
                    creator={{
                      name: trip.profiles?.full_name ?? "A Wanderer",
                      avatar: trip.profiles?.avatar_url,
                      rating: 4.8,
                      verificationBadges: ["verified"],
                      isHost: true,
                    }}
                    vibe={["Adventure", "Photography"]}
                    groupSize={{
                      current: participantCount,
                      max: trip.max_group_size,
                    }}
                    interestedCount={participantCount}
                    price={{ amount: 0, currency: "INR" }}
                    isFemaleOnly={false}
                    isInstantJoin={true}
                    postedAt={trip.created_at || new Date().toISOString()}
                    onClick={() => handleTripClick(trip)}
                    onJoinClick={() => handleTripJoin(trip.id)}
                    onChatClick={() => handleTripChat(trip.id)}
                    onLikeClick={() => console.log("Like trip:", trip.id)}
                  />
                );
              })}
            </div>
          )}

          {/* Load More Button */}
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

      {/* Post Trip Modal */}
      <PostTripModal
        open={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 z-50 bg-background animate-fade-in">
          <LandingPage />
          <Button
            variant="ghost"
            onClick={() => setShowSignInModal(false)}
            className="absolute top-4 left-4 hover-scale"
          >
            ← Back to Browse
          </Button>
        </div>
      )}
    </div>
  );
};

export default TripFeed;
