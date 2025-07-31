import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as UserType } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard"; // ADD THIS IMPORT

import PrivateChat from "@/components/trip/PrivateChat";
import TripChat from "@/components/trip/TripChat";
import ActivityFeed from "@/components/trip/ActivityFeed";

import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  MessageCircle,
  Heart,
  Share2,
  Clock,
  Shield,
  Star,
  Mail,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Types
type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type TripParticipant = {
  joined_at: string;
  profiles: Profile | null;
};

type TripDetail = {
  id: number;
  destination: string;
  start_date: string;
  end_date: string;
  start_city: string;
  description: string | null;
  max_group_size: number;
  created_at: string;
  creator_id: string;
  profiles: Profile | null;
  trip_participants: TripParticipant[];
};

const TripDetailsPage = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [isPrivateChatOpen, setIsPrivateChatOpen] = useState(false);

  const fetchTripDetails = async () => {
    // Enhanced validation
    if (!tripId) {
      console.error("No tripId provided");
      toast({
        title: "Invalid Trip",
        description: "No trip ID provided.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    const tripIdNumber = Number(tripId);
    if (isNaN(tripIdNumber) || tripIdNumber <= 0) {
      console.error("Invalid tripId format:", tripId);
      toast({
        title: "Invalid Trip",
        description: "Trip ID must be a valid number.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    console.log("Fetching trip details for ID:", tripIdNumber);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("trips")
        .select(
          `
          *,
          profiles!trips_creator_id_fkey(id, full_name, avatar_url),
          trip_participants(
            joined_at,
            profiles!trip_participants_user_id_fkey(id, full_name, avatar_url)
          )
        `
        )
        .eq("id", tripIdNumber)
        .single();

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Supabase error:", error);

        if (error.code === "PGRST116") {
          // No rows returned
          toast({
            title: "Trip Not Found",
            description: `No trip found with ID ${tripIdNumber}.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Database Error",
            description: error.message,
            variant: "destructive",
          });
        }
        navigate("/");
        return;
      }

      if (!data) {
        console.error("No data returned from Supabase");
        toast({
          title: "Trip Not Found",
          description: "Trip data could not be loaded.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const fetchedTrip: TripDetail = {
        id: data.id,
        destination: data.destination,
        start_date: data.start_date,
        end_date: data.end_date,
        start_city: data.start_city,
        description: data.description,
        max_group_size: data.max_group_size || 8,
        created_at: data.created_at,
        creator_id: data.creator_id,
        profiles: data.profiles,
        trip_participants: data.trip_participants || [],
      };

      console.log("Processed trip data:", fetchedTrip);
      setTrip(fetchedTrip);

      // Check if current user has joined
      if (user && fetchedTrip.trip_participants) {
        const userJoined = fetchedTrip.trip_participants.some(
          (participant) => participant.profiles?.id === user.id
        );
        setIsJoined(userJoined);
        console.log("User joined status:", userJoined);
      }
    } catch (error: any) {
      console.error("Unexpected error fetching trip details:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading the trip.",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserAndTrip = async () => {
      console.log("Starting fetchUserAndTrip, tripId:", tripId);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("Current user:", user?.id);
      setUser(user);

      // Fetch trip details
      await fetchTripDetails();
    };

    fetchUserAndTrip();
  }, [tripId]);

  const handleJoin = async () => {
    if (!user || !trip) {
      toast({
        title: "Please sign in to join this trip",
        variant: "destructive",
      });
      return;
    }

    setJoinLoading(true);
    try {
      const { error } = await supabase
        .from("trip_participants")
        .insert({ trip_id: trip.id, user_id: user.id });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "You've already joined this trip!" });
        } else {
          throw error;
        }
      } else {
        setIsJoined(true);
        toast({
          title: "You're in!",
          description: "You have successfully joined the trip.",
        });

        // ENHANCED: Add a more detailed activity
        await supabase.from("trip_activities").insert({
          trip_id: trip.id,
          user_id: user.id,
          activity_type: "join",
          message: `${
            user.user_metadata?.full_name || "Someone"
          } is excited to join this adventure!`,
        });

        await fetchTripDetails();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!user || !trip) return;

    setJoinLoading(true);
    try {
      const { error } = await supabase
        .from("trip_participants")
        .delete()
        .eq("trip_id", trip.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setIsJoined(false);
      toast({
        title: "Left trip",
        description: "You have left this trip.",
      });

      // ENHANCED: Add leave activity
      await supabase.from("trip_activities").insert({
        trip_id: trip.id,
        user_id: user.id,
        activity_type: "leave",
        message: `${
          user.user_metadata?.full_name || "Someone"
        } had to leave the trip.`,
      });

      await fetchTripDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJoinLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user || !trip) {
      toast({
        title: "Please sign in to like this trip",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from("trip_likes")
        .select("id")
        .eq("trip_id", trip.id)
        .eq("user_id", user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from("trip_likes")
          .delete()
          .eq("trip_id", trip.id)
          .eq("user_id", user.id);

        toast({
          title: "Unliked trip",
          description: "You've removed your like from this trip.",
        });
      } else {
        // Like
        await supabase.from("trip_likes").insert({
          trip_id: trip.id,
          user_id: user.id,
        });

        toast({
          title: "Liked trip!",
          description: "You've liked this trip.",
        });
      }
    } catch (error: any) {
      console.error("Error handling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    }
  };

  const handleContactOrganizer = () => {
    if (!user) {
      toast({
        title: "Please sign in to contact the organizer",
        variant: "destructive",
      });
      return;
    }
    setIsPrivateChatOpen(true);
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };

    if (startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString("en-IN", options);
    }

    return `${startDate.toLocaleDateString(
      "en-IN",
      options
    )} - ${endDate.toLocaleDateString("en-IN", options)}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading trip details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Trip not found state
  if (!trip) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-20">
            <p className="text-muted-foreground">Trip not found.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Trip ID: {tripId}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const participantCount = trip.trip_participants?.length || 0;
  const spotsLeft = trip.max_group_size - participantCount;
  const daysUntilTrip = Math.ceil(
    (new Date(trip.start_date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-20">
        <div className="p-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
              {/* ✅ FIXED: Connected Heart button to handleLike */}
              <Button variant="ghost" size="icon" onClick={handleLike}>
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto pb-20">
        {/* Trip Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{trip.destination}</h1>
                  <div className="flex items-center text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>From {trip.start_city}</span>
                  </div>
                </div>
                {daysUntilTrip <= 3 && daysUntilTrip >= 0 && (
                  <Badge variant="destructive">
                    <Clock className="w-3 h-3 mr-1" />
                    {daysUntilTrip}d left
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDateRange(trip.start_date, trip.end_date)}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {participantCount}/{trip.max_group_size} joined
                </div>
              </div>

              {spotsLeft > 0 ? (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  {spotsLeft} spots left
                </Badge>
              ) : (
                <Badge variant="destructive">Trip full</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Creator Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Trip Creator</h3>
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                {trip.profiles?.avatar_url ? (
                  <AvatarImage src={trip.profiles.avatar_url} />
                ) : (
                  <AvatarFallback>
                    {trip.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="font-medium">
                    {trip.profiles?.full_name || "Anonymous"}
                  </p>
                  <Shield className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                  <span>4.8 • Trip Creator</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleContactOrganizer}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">About this trip</h3>
            <p className="text-muted-foreground leading-relaxed">
              {trip.description || "No description provided."}
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              Posted{" "}
              {formatDistanceToNow(new Date(trip.created_at), {
                addSuffix: true,
              })}
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">
                Who's joining ({participantCount})
              </h3>
              {user && isJoined && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLeave}
                  disabled={joinLoading}
                >
                  {joinLoading ? "Leaving..." : "Leave Trip"}
                </Button>
              )}
            </div>

            {trip.trip_participants && trip.trip_participants.length > 0 ? (
              <div className="space-y-3">
                {trip.trip_participants.map((participant, index) =>
                  participant.profiles ? (
                    <div
                      key={participant.profiles.id || index}
                      className="flex items-center space-x-3"
                    >
                      {/* ✅ WRAP AVATAR WITH PROFILE HOVER CARD */}

                      <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                        {participant.profiles.avatar_url ? (
                          <AvatarImage src={participant.profiles.avatar_url} />
                        ) : (
                          <AvatarFallback>
                            {participant.profiles.full_name
                              ?.charAt(0)
                              .toUpperCase() || "U"}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="flex-1">
                        <p className="font-medium">
                          {participant.profiles.full_name || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined{" "}
                          {formatDistanceToNow(
                            new Date(participant.joined_at),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                      {participant.profiles.id === trip.creator_id && (
                        <Badge variant="outline" className="text-xs">
                          Creator
                        </Badge>
                      )}
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No one has joined yet. Be the first!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <ActivityFeed tripId={trip.id} user={user} className="mb-6" />

        {/* Group Chat */}
        <TripChat tripId={trip.id} user={user} />
      </main>

      {/* Private Chat Modal */}
      <PrivateChat
        isOpen={isPrivateChatOpen}
        onClose={() => setIsPrivateChatOpen(false)}
        tripId={trip.id}
        organizerId={trip.creator_id}
        organizerName={trip.profiles?.full_name || "Trip Organizer"}
        organizerAvatar={trip.profiles?.avatar_url || undefined}
        currentUser={user}
      />

      {/* Fixed Bottom Action */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="max-w-2xl mx-auto">
            {isJoined ? (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleLeave}
                  disabled={joinLoading}
                  className="flex-1"
                >
                  Leave Trip
                </Button>
                <Button className="flex-1">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat with Group
                </Button>
              </div>
            ) : spotsLeft > 0 ? (
              <Button
                onClick={handleJoin}
                disabled={joinLoading}
                className="w-full"
                size="lg"
              >
                {joinLoading ? "Joining..." : "Join This Trip"}
              </Button>
            ) : (
              <Button disabled className="w-full" size="lg">
                Trip is Full
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetailsPage;
