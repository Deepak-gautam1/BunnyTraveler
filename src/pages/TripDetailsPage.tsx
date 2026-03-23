import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as UserType } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useParticipantManagement } from "@/hooks/useParticipantManagement";
import { useJoinRequestManagement } from "@/hooks/useJoinRequestManagement";
import { useTripLikes } from "@/hooks/useTripLikes";
import { usePostTripNotifications } from "@/hooks/usePostTripNotifications";
import { setCookie, getCookie, COOKIE_KEYS } from "@/lib/cookies";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Heart,
  Share2,
  Edit3,
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { TripDetail } from "@/types/trip";
import TripInfoCard from "@/components/trip/TripInfoCard";
import TripCreatorCard from "@/components/trip/TripCreatorCard";
import TripReferralCard from "@/components/trip/TripReferralCard";
import TripShareDialog from "@/components/trip/TripShareDialog";
import TripDeleteDialog from "@/components/trip/TripDeleteDialog";
import TripActionsBar from "@/components/trip/TripActionsBar";
import ParticipantsList from "@/components/trip/ParticipantsList";
import ParticipantActions from "@/components/trip/ParticipantActions";
import JoinRequestActions from "@/components/trip/JoinRequestActions";
import JoinRequestsList from "@/components/trip/JoinRequestsList";
import PhotoGallery from "@/components/trip/PhotoGallery";
import PostTripReviewModal from "@/components/trip/PostTripReviewModal";
import PostTripModal from "@/components/trip/PostTripModal";
import PrivateChat from "@/components/trip/PrivateChat";
import TripChat from "@/components/trip/TripChat";

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
  return `${startDate.toLocaleDateString("en-IN", options)} - ${endDate.toLocaleDateString("en-IN", options)}`;
};

const TRIP_QUERY = `
  *,
  interested_count,
  coupon_awarded,
  coupon_awarded_at,
  referral_code,
  profiles!trips_creator_id_fkey(id, full_name, avatar_url),
  trip_participants(
    joined_at,
    profiles!trip_participants_user_id_fkey(id, full_name, avatar_url)
  )
`;

const TripDetailsPage = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [interestedCount, setInterestedCount] = useState(0);
  const [isPrivateChatOpen, setIsPrivateChatOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  const { isLiked, toggleLike } = useTripLikes(user);
  usePostTripNotifications();

  const isCreator = !!(user && trip && user.id === trip.creator_id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapToTripDetail = (data: any): TripDetail => ({
    id: data.id,
    destination: data.destination,
    start_date: data.start_date,
    end_date: data.end_date,
    start_city: data.start_city,
    description: data.description,
    max_group_size: data.max_group_size ?? 8,
    budget_per_person: data.budget_per_person,
    travel_style: data.travel_style,
    created_at: data.created_at ?? null,
    creator_id: data.creator_id,
    status: data.status ?? "planning",
    interested_count: data.interested_count ?? 0,
    coupon_awarded: data.coupon_awarded ?? null,
    coupon_awarded_at: data.coupon_awarded_at ?? null,
    referral_code: data.referral_code ?? null,
    current_participants: data.current_participants ?? 0,
    budget: data.budget ?? null,
    completed_at: data.completed_at ?? null,
    max_participants: data.max_participants ?? data.max_group_size ?? 8,
    start_lat: data.start_lat ?? null,
    start_lng: data.start_lng ?? null,
    updated_at: data.updated_at ?? null,
    profiles: data.profiles,
    trip_participants: data.trip_participants ?? [],
  });

  const refreshTripData = useCallback(async () => {
    if (!tripId) return;
    const { data, error } = await supabase
      .from("trips")
      .select(TRIP_QUERY)
      .eq("id", Number(tripId))
      .maybeSingle();
    if (error || !data) return;
    const tripData = mapToTripDetail(data);
    setTrip(tripData);
    setInterestedCount(data.interested_count ?? 0);
    if (user) {
      setIsJoined(
        data.trip_participants?.some(
          (p: { profiles?: { id: string } | null }) =>
            p.profiles?.id === user.id,
        ) ?? false,
      );
    }
  }, [tripId, user]);

  // Capture referral code from URL
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && tripId) localStorage.setItem(`trip_${tripId}_referral`, ref);
  }, [tripId]);

  // Track recently viewed trips

  useEffect(() => {
    if (trip && user) {
      const recentTrips =
        getCookie<number[]>(COOKIE_KEYS.RECENTLY_VIEWED_TRIPS) ?? [];
      const updated = [
        trip.id,
        ...recentTrips.filter((id) => id !== trip.id),
      ].slice(0, 10);
      setCookie(COOKIE_KEYS.RECENTLY_VIEWED_TRIPS, updated, 30);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id, user]);
  // Post-trip review check
  // Extract primitives in the component body (before the useEffect)
  const tripIdForReview = trip?.id;
  const tripEndDate = trip?.end_date;

  // Post-trip review check
  useEffect(() => {
    if (!user || !tripIdForReview || !tripEndDate || !isJoined) return;
    const check = async () => {
      const { data, error } = await supabase
        .from("trip_reviews")
        .select("id")
        .eq("trip_id", tripIdForReview) // ✅ primitive, not trip.id
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || data) {
        if (data) setUserHasReviewed(true);
        return;
      }
      const twoDaysAfter = new Date(tripEndDate); // ✅ primitive, not trip.end_date
      twoDaysAfter.setDate(twoDaysAfter.getDate() + 2);
      if (new Date() >= twoDaysAfter && !userHasReviewed)
        setShowReviewModal(true);
    };
    check();
  }, [tripIdForReview, tripEndDate, user, isJoined, userHasReviewed]); // ✅ no ESLint complaint

  // Initial data load
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(currentUser);
      if (!tripId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("trips")
        .select(TRIP_QUERY)
        .eq("id", Number(tripId))
        .maybeSingle();
      if (!mounted) return;
      if (error || !data) {
        toast({
          title: "Trip Not Found",
          description: `No trip found with ID ${tripId}.`,
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      const tripData = mapToTripDetail(data);
      setTrip(tripData);
      setInterestedCount(data.interested_count ?? 0);
      if (currentUser) {
        setIsJoined(
          data.trip_participants?.some(
            (p: { profiles?: { id: string } | null }) =>
              p.profiles?.id === currentUser.id,
          ) ?? false,
        );
      }
      setLoading(false);
    };
    init();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  } = useParticipantManagement(trip?.id ?? 0, user);

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
  } = useJoinRequestManagement(trip?.id ?? 0, user, refreshTripData);

  const handleDeleteTrip = async () => {
    if (!user || !trip) return;
    setDeleteLoading(true);
    const { error } = await supabase
      .from("trips")
      .delete()
      .eq("id", trip.id)
      .eq("creator_id", user.id);
    setDeleteLoading(false);
    if (error) {
      toast({
        title: "Failed to delete trip",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Trip deleted!",
      description: "Your trip has been successfully deleted.",
    });
    setIsDeleteDialogOpen(false);
    setTimeout(() => navigate("/", { replace: true }), 500);
  };

  const handleLeave = async () => {
    if (!user || !trip) return;
    setJoinLoading(true);
    const { error } = await supabase
      .from("trip_participants")
      .delete()
      .eq("trip_id", trip.id)
      .eq("user_id", user.id);
    if (!error) {
      await supabase
        .from("trip_join_requests")
        .delete()
        .eq("trip_id", trip.id)
        .eq("user_id", user.id);
      setIsJoined(false);
      toast({ title: "Left trip", description: "You have left this trip." });
      await supabase.from("trip_activities").insert({
        trip_id: trip.id,
        user_id: user.id,
        activity_type: "leave",
        message: `${user.user_metadata?.full_name ?? "Someone"} had to leave the trip.`,
      });
      await refreshTripData();
    } else {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setJoinLoading(false);
  };

  const handleLike = async () => {
    if (!user || !trip) {
      toast({
        title: "Please sign in",
        description: "Sign in to show interest",
        variant: "destructive",
      });
      return;
    }
    const wasLiked = isLiked(trip.id);
    await toggleLike(trip.id);
    setInterestedCount((prev) => (wasLiked ? Math.max(prev - 1, 0) : prev + 1));
    setTimeout(refreshTripData, 500);
  };

  const handleTripUpdated = () => {
    refreshTripData();
    toast({
      title: "Trip updated!",
      description: "Your trip details have been updated successfully.",
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
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
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
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

  const spotsLeft = trip.max_group_size - (trip.trip_participants?.length ?? 0);
  const daysUntilTrip = Math.ceil(
    (new Date(trip.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-20">
        <div className="p-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
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
                      <Edit3 className="w-4 h-4 mr-2" /> Edit Trip
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Trip
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsShareDialogOpen(true)}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLike}
                className={isLiked(trip.id) ? "text-red-500" : ""}
              >
                <Heart
                  className={`w-4 h-4 ${isLiked(trip.id) ? "fill-red-500" : ""}`}
                />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto pb-20">
        <TripInfoCard
          trip={trip}
          stats={stats}
          interestedCount={interestedCount}
          daysUntilTrip={daysUntilTrip}
          formatDateRange={formatDateRange}
        />

        <TripCreatorCard
          creatorId={trip.creator_id}
          profile={trip.profiles}
          isCreator={isCreator}
          onContactOrganizer={handleContactOrganizer}
        />

        {/* About this trip */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">About this trip</h3>
            <p className="text-muted-foreground leading-relaxed">
              {trip.description ?? "No description provided."}
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              Posted{" "}
              {trip.created_at
                ? formatDistanceToNow(new Date(trip.created_at), {
                    addSuffix: true,
                  })
                : ""}
            </div>
          </CardContent>
        </Card>

        {isCreator && trip.referral_code && (
          <TripReferralCard
            referralCode={trip.referral_code}
            couponAwarded={!!trip.coupon_awarded}
            destination={trip.destination}
            tripId={trip.id}
            stats={stats}
          />
        )}

        {!isCreator && (
          <JoinRequestActions
            user={user}
            stats={stats}
            isParticipant={isParticipant}
            userRequest={userRequest}
            requestLoading={requestLoading}
            tripStatus={trip.status ?? "planning"}
            onSendRequest={sendJoinRequest}
            onCancelRequest={cancelRequest}
            className="mb-6"
          />
        )}

        {isCreator && (
          <>
            <JoinRequestsList
              joinRequests={joinRequests}
              loading={requestsLoading}
              responseLoading={responseLoading}
              currentUser={user}
              tripCreatorId={trip.creator_id}
              onApproveRequest={(request, message) =>
                approveRequest(request, message)
              }
              onRejectRequest={(request, message) =>
                rejectRequest(request, message)
              }
              className="mb-6"
            />
            <ParticipantActions
              user={user}
              stats={stats}
              isParticipant={isParticipant}
              joinLoading={hookJoinLoading}
              leaveLoading={leaveLoading}
              tripStatus={trip.status ?? "planning"}
              onJoin={joinTrip}
              onLeave={leaveTrip}
              className="mb-6"
            />
          </>
        )}

        <ParticipantsList
          participants={participants}
          stats={stats}
          loading={participantLoading}
          currentUser={user}
          tripCreatorId={trip.creator_id}
          onRemoveParticipant={removeParticipant}
          onChatWithParticipant={() => setIsPrivateChatOpen(true)}
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
          userRequest={
            userRequest
              ? {
                  status: userRequest.status as
                    | "pending"
                    | "approved"
                    | "rejected"
                    | null,
                }
              : null
          }
          isParticipant={isParticipant}
          tripCreatorId={trip.creator_id}
        />
      </main>

      {/* Modals & Dialogs */}
      <PrivateChat
        isOpen={isPrivateChatOpen}
        onClose={() => setIsPrivateChatOpen(false)}
        tripId={trip.id}
        organizerId={trip.creator_id}
        organizerName={trip.profiles?.full_name ?? "Trip Organizer"}
        organizerAvatar={trip.profiles?.avatar_url ?? undefined}
        currentUser={user}
      />

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
          budget_per_person: trip.budget_per_person ?? 0,
          travel_style: trip.travel_style ?? [],
        }}
        mode="edit"
      />

      <PostTripReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        trip={{
          id: trip.id,
          title: trip.destination,
          destination: trip.destination,
        }}
        onReviewSubmitted={() => {
          setUserHasReviewed(true);
          setShowReviewModal(false);
        }}
      />

      <TripShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        trip={trip}
        formatDateRange={formatDateRange}
      />

      <TripDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        destination={trip.destination}
        startCity={trip.start_city}
        stats={stats}
        loading={deleteLoading}
        onConfirm={handleDeleteTrip}
      />

      <TripActionsBar
        user={user}
        isCreator={isCreator}
        isJoined={isJoined}
        joinLoading={joinLoading}
        spotsLeft={spotsLeft}
        userRequest={userRequest}
        requestLoading={requestLoading}
        tripDestination={trip.destination}
        onLeave={handleLeave}
        onShare={() => setIsShareDialogOpen(true)}
        onSendRequest={sendJoinRequest}
      />
    </div>
  );
};

export default TripDetailsPage;
