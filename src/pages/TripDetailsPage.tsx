import { useState, useEffect, useCallback } from "react";
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
import { useJoinRequestManagement } from "@/hooks/useJoinRequestManagement";
import JoinRequestActions from "@/components/trip/JoinRequestActions";
import JoinRequestsList from "@/components/trip/JoinRequestsList";
import JoinRequestDialog from "@/components/trip/JoinRequestDialog";
import { XCircle } from "lucide-react";
import PhotoGallery from "@/components/trip/PhotoGallery";
import { usePostTripNotifications } from "@/hooks/usePostTripNotifications";
import PostTripReviewModal from "@/components/trip/PostTripReviewModal";
// ✅ A. ADD THIS IMPORT
import { useTripLikes } from "@/hooks/useTripLikes";

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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Add Dialog imports for share
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import PrivateChat from "@/components/trip/PrivateChat";
import TripChat from "@/components/trip/TripChat";
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
  Trash2,
  IndianRupee,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ✅ H. UPDATE TYPE - Add interested_count
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
  status?: string;
  interested_count?: number; // ✅ ADD THIS
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // ✅ B. ADD THESE HOOKS
  const { isLiked, toggleLike } = useTripLikes(user);
  const [interestedCount, setInterestedCount] = useState(0);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const { schedulePostTripNotification } = usePostTripNotifications();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isCreator = user && trip && user.id === trip.creator_id;

  useEffect(() => {
    const checkForReviewPrompt = async () => {
      if (!user || !trip || !isJoined) return;

      try {
        // ✅ Updated query with proper error handling
        const { data: existingReview, error } = await supabase
          .from("trip_reviews")
          .select("id")
          .eq("trip_id", trip.id)
          .eq("user_id", user.id)
          .maybeSingle(); // ✅ Use maybeSingle() instead of single()

        // ✅ Handle errors gracefully
        if (error) {
          console.error("Error checking review:", error);
          return; // Don't show error to user
        }

        if (existingReview) {
          setUserHasReviewed(true);
          return;
        }

        // Check if trip ended more than 2 days ago
        const tripEndDate = new Date(trip.end_date);
        const twoDaysAfter = new Date(tripEndDate);
        twoDaysAfter.setDate(twoDaysAfter.getDate() + 2);
        const now = new Date();

        if (now >= twoDaysAfter && !userHasReviewed) {
          setShowReviewModal(true);
        }
      } catch (error) {
        console.error("Error checking review status:", error);
        // Silently fail - don't interrupt user experience
      }
    };

    checkForReviewPrompt();
  }, [trip?.end_date, user, isJoined, userHasReviewed]);

  // ✅ D. UPDATE refreshTripData
  const refreshTripData = useCallback(async () => {
    if (!tripId) return;

    console.log("🔄 Refreshing trip data...");

    try {
      const { data, error } = await supabase
        .from("trips")
        .select(
          `
          *,
          interested_count,
          profiles!trips_creator_id_fkey(id, full_name, avatar_url),
          trip_participants(
            joined_at,
            profiles!trip_participants_user_id_fkey(id, full_name, avatar_url)
          )
        `
        )
        .eq("id", Number(tripId))
        .maybeSingle();

      if (error) {
        console.error("Refresh error:", error);
        return;
      }

      if (data) {
        const tripData: TripDetail = {
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
          status: data.status || "planning",
          interested_count: data.interested_count || 0, // ✅ ADD THIS
          profiles: data.profiles,
          trip_participants: data.trip_participants || [],
        };

        setTrip(tripData);
        setInterestedCount(data.interested_count || 0); // ✅ ADD THIS
        console.log(
          "✅ Trip refreshed - participants:",
          data.trip_participants?.length || 0
        );

        if (user && data.trip_participants) {
          const userJoined = data.trip_participants.some(
            (participant: any) => participant.profiles?.id === user.id
          );
          setIsJoined(userJoined);
          console.log("👥 Refresh - User joined status:", userJoined);
        }
      }
    } catch (error) {
      console.error("Error refreshing trip:", error);
    }
  }, [tripId, user]);

  // ✅ C. UPDATE useEffect - Add interested_count to query
  useEffect(() => {
    console.log("🚀 Initializing trip page...");

    let isMounted = true;

    const initializePage = async () => {
      try {
        console.log("👤 Fetching user...");
        const {
          data: { user },
        } = await supabase.auth.getUser();
        console.log("👤 User fetched:", user?.id || "No user");

        if (!isMounted) return;
        setUser(user);

        if (!tripId) {
          console.log("❌ No tripId, stopping");
          return;
        }

        console.log("🚀 Loading trip data with user:", user?.id || "undefined");
        if (!isMounted) return;
        setLoading(true);

        const { data, error } = await supabase
          .from("trips")
          .select(
            `
            *,
            interested_count,
            profiles!trips_creator_id_fkey(id, full_name, avatar_url),
            trip_participants(
              joined_at,
              profiles!trip_participants_user_id_fkey(id, full_name, avatar_url)
            )
          `
          )
          .eq("id", Number(tripId))
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.error("Trip loading error:", error);
          if (error.code === "PGRST116") {
            toast({
              title: "Trip Not Found",
              description: `No trip found with ID ${tripId}.`,
              variant: "destructive",
            });
          }
          navigate("/");
          return;
        }

        if (data) {
          const tripData: TripDetail = {
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
            status: data.status || "planning",
            interested_count: data.interested_count || 0, // ✅ ADD THIS
            profiles: data.profiles,
            trip_participants: data.trip_participants || [],
          };

          setTrip(tripData);
          setInterestedCount(data.interested_count || 0); // ✅ ADD THIS
          console.log(
            "✅ Trip set with participants:",
            data.trip_participants?.length || 0
          );

          if (user && data.trip_participants) {
            const userJoined = data.trip_participants.some(
              (participant: any) => participant.profiles?.id === user.id
            );
            setIsJoined(userJoined);
            console.log("👥 User joined status SET:", userJoined);
          } else {
            console.log("👥 No user or no participants data");
            setIsJoined(false);
          }
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load trip details",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializePage();

    return () => {
      console.log("🧹 Cleanup: Component unmounting");
      isMounted = false;
    };
  }, [tripId]);

  const {
    participants,
    stats,
    loading: participantLoading,
    joinLoading: hookJoinLoading,
    leaveLoading,
    isParticipant,
    joinTrip,
    leaveTrip,
    removeParticipant,
  } = useParticipantManagement(trip?.id || 0, user);

  const {
    joinRequests,
    userRequest,
    loading: requestsLoading,
    requestLoading,
    responseLoading,
    sendJoinRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
  } = useJoinRequestManagement(trip?.id || 0, user, refreshTripData);

  const handleDeleteTrip = async () => {
    if (!user || !trip) return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", trip.id)
        .eq("creator_id", user.id);

      if (error) throw error;

      toast({
        title: "Trip deleted! 🗑️",
        description: "Your trip has been successfully deleted.",
      });

      setIsDeleteDialogOpen(false);

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 500);
    } catch (error: any) {
      console.error("Error deleting trip:", error);
      toast({
        title: "Failed to delete trip",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTripUpdated = () => {
    refreshTripData();
    toast({
      title: "Trip updated! ✅",
      description: "Your trip details have been updated successfully.",
    });
  };

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

        await schedulePostTripNotification(
          trip.id,
          user.id,
          trip.destination,
          trip.end_date
        );

        await supabase.from("trip_activities").insert({
          trip_id: trip.id,
          user_id: user.id,
          activity_type: "join",
          message: `${
            user.user_metadata?.full_name || "Someone"
          } is excited to join this adventure!`,
        });

        await refreshTripData();
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

      await supabase
        .from("trip_join_requests")
        .delete()
        .eq("trip_id", trip.id)
        .eq("user_id", user.id);

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

      await refreshTripData();
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

  // ✅ E. REPLACE handleLike
  // In TripDetailsPage.tsx, update handleLike:

  const handleLike = async () => {
    if (!user || !trip) {
      toast({
        title: "Please sign in",
        description: "Sign in to show interest in this trip",
        variant: "destructive",
      });
      return;
    }

    const wasLiked = isLiked(trip.id);

    // Toggle like
    await toggleLike(trip.id);

    // Optimistically update UI
    if (wasLiked) {
      setInterestedCount((prev) => Math.max(prev - 1, 0));
    } else {
      setInterestedCount((prev) => prev + 1);
    }

    // Refresh trip data after 500ms to sync with server
    setTimeout(() => {
      refreshTripData();
    }, 500);
  };

  // Share functions
  const handleShare = async () => {
    setIsShareDialogOpen(true);
  };

  const shareToWhatsApp = () => {
    const shareText = `🌍 Check out this amazing trip!\n\n${
      trip?.destination
    } from ${trip?.start_city}\n📅 ${formatDateRange(
      trip!.start_date,
      trip!.end_date
    )}\n💰 ₹${
      trip?.budget_per_person?.toLocaleString() || "Contact for pricing"
    }\n\n`;
    const shareUrl = `${window.location.origin}/trip/${trip?.id}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      shareText + shareUrl
    )}`;
    window.open(whatsappUrl, "_blank");
    setIsShareDialogOpen(false);
  };

  const shareToFacebook = () => {
    const shareUrl = `${window.location.origin}/trip/${trip?.id}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
    setIsShareDialogOpen(false);
  };

  const shareToTwitter = () => {
    const shareText = `Check out this trip: ${trip?.destination} from ${trip?.start_city}`;
    const shareUrl = `${window.location.origin}/trip/${trip?.id}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
    setIsShareDialogOpen(false);
  };

  const copyLink = async () => {
    const shareUrl = `${window.location.origin}/trip/${trip?.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Trip link copied to clipboard",
      });
      setIsShareDialogOpen(false);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
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

  const handleReviewSubmitted = () => {
    setUserHasReviewed(true);
    setShowReviewModal(false);
    toast({
      title: "Review submitted! 🌟",
      description: "Thank you for sharing your experience",
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
              {/* ✅ F. UPDATE Share Button */}
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
              {/* ✅ F. UPDATE Heart Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLike}
                className={isLiked(trip.id) ? "text-red-500" : ""}
              >
                <Heart
                  className={`w-4 h-4 ${
                    isLiked(trip.id) ? "fill-red-500" : ""
                  }`}
                />
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

              {/* ✅ G. ADD interested count display */}
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDateRange(trip.start_date, trip.end_date)}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {stats.current_participants}/{stats.max_participants} joined
                </div>
                <div className="flex items-center">
                  <Heart className="w-4 h-4 mr-1 text-red-500" />
                  <span>{interestedCount} interested</span>
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
                    <IndianRupee className="w-3 h-3 mr-1" />
                    {trip.budget_per_person.toLocaleString()} per person
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

        {!isCreator && (
          <JoinRequestActions
            user={user}
            stats={stats}
            isParticipant={isParticipant}
            userRequest={userRequest}
            requestLoading={requestLoading}
            tripStatus={trip?.status || "planning"}
            onSendRequest={sendJoinRequest}
            onCancelRequest={cancelRequest}
            className="mb-6"
          />
        )}

        {isCreator && (
          <JoinRequestsList
            joinRequests={joinRequests}
            loading={requestsLoading}
            responseLoading={responseLoading}
            currentUser={user}
            tripCreatorId={trip?.creator_id || ""}
            onApproveRequest={(request, message) =>
              approveRequest(request, message)
            }
            onRejectRequest={(request, message) =>
              rejectRequest(request, message)
            }
            className="mb-6"
          />
        )}

        {isCreator && (
          <ParticipantActions
            user={user}
            stats={stats}
            isParticipant={isParticipant}
            joinLoading={hookJoinLoading}
            leaveLoading={leaveLoading}
            tripStatus={trip?.status || "planning"}
            onJoin={joinTrip}
            onLeave={leaveTrip}
            className="mb-6"
          />
        )}

        <ParticipantsList
          participants={participants}
          stats={stats}
          loading={participantLoading}
          currentUser={user}
          tripCreatorId={trip.creator_id}
          onRemoveParticipant={removeParticipant}
          onChatWithParticipant={(userId) => {
            console.log("Chat with participant:", userId);
            setIsPrivateChatOpen(true);
          }}
          className="mb-6"
        />

        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Trip Photos</h3>
            <PhotoGallery
              tripId={trip.id}
              isParticipant={isParticipant}
              tripCreatorId={trip.creator_id}
            />
          </CardContent>
        </Card>

        <TripChat
          tripId={trip.id}
          user={user}
          userRequest={userRequest}
          isParticipant={isParticipant}
          tripCreatorId={trip.creator_id}
        />
      </main>

      <PrivateChat
        isOpen={isPrivateChatOpen}
        onClose={() => setIsPrivateChatOpen(false)}
        tripId={trip.id}
        organizerId={trip.creator_id}
        organizerName={trip.profiles?.full_name || "Trip Organizer"}
        organizerAvatar={trip.profiles?.avatar_url || undefined}
        currentUser={user}
      />

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

      <PostTripReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        trip={{
          id: trip.id,
          title: trip.destination,
          destination: trip.destination,
        }}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share This Trip</DialogTitle>
            <DialogDescription>
              Share {trip.destination} with your friends
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={shareToWhatsApp}
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={shareToFacebook}
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-12"
              onClick={shareToTwitter}
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
              Twitter
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or copy link
                </span>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full justify-start h-12"
              onClick={copyLink}
            >
              <Share2 className="w-5 h-5 mr-3" />
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            </AlertDialogDescription>

            <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium text-foreground">{trip.destination}</p>
              <p className="text-muted-foreground">
                From {trip.start_city} • {stats.current_participants}{" "}
                participants
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTrip}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? "Deleting..." : "Delete Trip"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {user && !isCreator && (
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
              <>
                {userRequest?.status === "pending" ? (
                  <Button disabled className="w-full" size="lg">
                    <Clock className="w-4 h-4 mr-2" />
                    Request Pending
                  </Button>
                ) : userRequest?.status === "rejected" ? (
                  <Button
                    disabled
                    className="w-full"
                    size="lg"
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Request Rejected
                  </Button>
                ) : (
                  <JoinRequestDialog
                    user={user}
                    tripDestination={trip.destination}
                    onSendRequest={sendJoinRequest}
                    requestLoading={requestLoading}
                  />
                )}
              </>
            ) : (
              <Button disabled className="w-full" size="lg">
                Trip is Full
              </Button>
            )}
          </div>
        </div>
      )}

      {user && isCreator && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="max-w-2xl mx-auto flex gap-2">
            <Button variant="outline" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              Group Chat
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleShare}>
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
