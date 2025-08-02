import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as UserType } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard";
import { useParticipantManagement } from "@/hooks/useParticipantManagement";
import ParticipantsList from "@/components/trip/ParticipantsList";
import ParticipantActions from "@/components/trip/ParticipantActions";

// ✅ Add AlertDialog imports for delete confirmation
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Dropdown menu imports for Edit Trip
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator, // ✅ Add separator
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import PrivateChat from "@/components/trip/PrivateChat";
import TripChat from "@/components/trip/TripChat";
import ActivityFeed from "@/components/trip/ActivityFeed";
import PostTripModal from "@/components/trip/PostTripModal";

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
  Edit3,
  MoreVertical,
  Trash2, // ✅ Add delete icon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Types (keep existing)
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
  budget_per_person?: number | null;
  travel_style?: string[] | null;
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

  const [user, setUser] = useState<UserType | null>(null);
  const [isPrivateChatOpen, setIsPrivateChatOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ✅ NEW: Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Check if current user is the trip creator
  const isCreator = user && trip && user.id === trip.creator_id;

  // ✅ NEW: Handle trip deletion
  // ✅ IMPROVED: Handle trip deletion with smooth navigation
  const handleDeleteTrip = async () => {
    if (!user || !trip) return;

    setDeleteLoading(true);
    try {
      // Delete the trip (CASCADE will handle related data)
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", trip.id)
        .eq("creator_id", user.id); // Extra security check

      if (error) throw error;

      // ✅ Show success toast first
      toast({
        title: "Trip deleted! 🗑️",
        description: "Your trip has been successfully deleted.",
      });

      // ✅ Close dialog immediately
      setIsDeleteDialogOpen(false);

      // ✅ Smooth navigation with slight delay for UX
      setTimeout(() => {
        // Navigate to home page (adjust route as needed)
        navigate("/", { replace: true }); // Using replace to prevent going back to deleted trip
      }, 500); // 500ms delay for smooth UX
    } catch (error: any) {
      console.error("Error deleting trip:", error);
      toast({
        title: "Failed to delete trip",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false); // Close dialog even on error
    } finally {
      setDeleteLoading(false);
    }
  };

  // Keep all your existing functions (fetchTripDetails, handleJoin, etc.)
  const fetchTripDetails = async () => {
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

      if (error) {
        console.error("Supabase error:", error);
        if (error.code === "PGRST116") {
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
        budget_per_person: data.budget_per_person,
        travel_style: data.travel_style,
        created_at: data.created_at,
        creator_id: data.creator_id,
        profiles: data.profiles,
        trip_participants: data.trip_participants || [],
      };

      setTrip(fetchedTrip);

      if (user && fetchedTrip.trip_participants) {
        const userJoined = fetchedTrip.trip_participants.some(
          (participant) => participant.profiles?.id === user.id
        );
        setIsJoined(userJoined);
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
  const {
    participants,
    stats,
    loading: participantLoading,
    joinLoading,
    leaveLoading,
    isParticipant,
    joinTrip,
    leaveTrip,
    removeParticipant,
  } = useParticipantManagement(trip?.id || 0, user);
  useEffect(() => {
    const fetchUserAndTrip = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      await fetchTripDetails();
    };

    fetchUserAndTrip();
  }, [tripId]);

  const handleTripUpdated = () => {
    fetchTripDetails();
    toast({
      title: "Trip updated! ✅",
      description: "Your trip details have been updated successfully.",
    });
  };

  // Keep all your existing handlers (handleJoin, handleLeave, etc.)
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
      const { data: existingLike } = await supabase
        .from("trip_likes")
        .select("id")
        .eq("trip_id", trip.id)
        .eq("user_id", user.id)
        .single();

      if (existingLike) {
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

  // Loading and error states (keep existing)
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
              {/* ✅ UPDATED: Edit/Delete dropdown menu for trip creator */}
              {isCreator && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Trip
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Trip
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button variant="ghost" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
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
                  {stats.current_participants}/{stats.max_participants} joined
                </div>
              </div>

              {trip.travel_style && trip.travel_style.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {trip.travel_style.slice(0, 4).map((style, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {style}
                    </Badge>
                  ))}
                  {trip.travel_style.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{trip.travel_style.length - 4} more
                    </Badge>
                  )}
                </div>
              )}

              {trip.budget_per_person && (
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600"
                  >
                    Budget: ₹{trip.budget_per_person.toLocaleString()} per
                    person
                  </Badge>
                </div>
              )}

              {stats.spots_remaining > 0 ? (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  {stats.spots_remaining} spots left
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
              <ProfileHoverCard
                userId={trip.creator_id}
                userName={trip.profiles?.full_name || "Anonymous"}
                userAvatar={trip.profiles?.avatar_url || undefined}
              >
                <Avatar className="w-12 h-12 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                  {trip.profiles?.avatar_url ? (
                    <AvatarImage src={trip.profiles.avatar_url} />
                  ) : (
                    <AvatarFallback>
                      {trip.profiles?.full_name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
              </ProfileHoverCard>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="font-medium">
                    {trip.profiles?.full_name || "Anonymous"}
                  </p>
                  <Shield className="w-4 h-4 text-blue-500" />
                  {isCreator && (
                    <Badge variant="outline" className="text-xs">
                      You
                    </Badge>
                  )}
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

        {/* ✅ NEW: Enhanced Participant Actions */}
        <ParticipantActions
          user={user}
          stats={stats}
          isParticipant={isParticipant}
          joinLoading={joinLoading}
          leaveLoading={leaveLoading}
          tripStatus={trip.status || "planning"}
          onJoin={joinTrip}
          onLeave={leaveTrip}
          className="mb-6"
        />

        {/* ✅ NEW: Enhanced Participants List */}
        <ParticipantsList
          participants={participants}
          stats={stats}
          loading={participantLoading}
          currentUser={user}
          tripCreatorId={trip.creator_id}
          onRemoveParticipant={removeParticipant}
          onChatWithParticipant={(userId) => {
            console.log("Chat with participant:", userId);
            // You can implement private chat functionality here
            setIsPrivateChatOpen(true);
          }}
          className="mb-6"
        />

        {/* ✅ ENHANCED: Activity Feed (keep existing) */}
        <ActivityFeed tripId={trip.id} user={user} className="mb-6" />

        {/* Group Chat */}
        <TripChat tripId={trip.id} user={user} />
      </main>

      {/* Keep all existing modals */}
      <PrivateChat
        isOpen={isPrivateChatOpen}
        onClose={() => setIsPrivateChatOpen(false)}
        tripId={trip.id}
        organizerId={trip.creator_id}
        organizerName={trip.profiles?.full_name || "Trip Organizer"}
        organizerAvatar={trip.profiles?.avatar_url || undefined}
        currentUser={user}
      />

      {/* PostTripModal for editing */}
      {trip && (
        <PostTripModal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onTripUpdated={handleTripUpdated}
          tripData={{
            id: trip.id,
            destination: trip.destination,
            start_city: trip.start_city,
            start_date: trip.start_date,
            end_date: trip.end_date,
            description: trip.description,
            max_group_size: trip.max_group_size,
            budget_per_person: trip.budget_per_person || 0,
            travel_style: trip.travel_style || [],
          }}
          mode="edit"
        />
      )}

      {/* ✅ NEW: Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Delete Trip?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trip? This action cannot be
              undone.
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <p className="font-medium text-foreground">
                  {trip.destination}
                </p>
                <p className="text-sm text-muted-foreground">
                  From {trip.start_city} • {stats.current_participants}{" "}
                  participants
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTrip}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete Trip
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ UPDATED: Simplified Bottom Action Bar */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="max-w-2xl mx-auto flex gap-2">
            <Button variant="outline" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              Group Chat
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share Trip
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetailsPage;
