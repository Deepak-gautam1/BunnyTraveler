import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  MapPin,
  MessageCircle,
  Heart,
  Shield,
  Star,
  Users,
  Verified,
  Clock,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Settings,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import BookmarkButton from "@/components/trip/BookmarkButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTripStatus, TripStatus } from "@/hooks/useTripStatus";

interface EnhancedTripCardProps {
  id: number;
  destination: string;
  startDate: string;
  endDate: string;
  startCity: string;
  description: string;
  creator: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    verificationBadges: string[];
    isHost?: boolean;
  };
  vibe: string[];
  groupSize: {
    current: number;
    max: number;
  };
  interestedCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  status: TripStatus;
  price?: {
    amount: number;
    currency: string;
  };
  isFemaleOnly?: boolean;
  isInstantJoin?: boolean;
  postedAt: string;
  onClick?: () => void;
  onChatClick?: () => void;
  onLikeClick?: (e: React.MouseEvent) => void; // ✅ FIX 1: Accept event parameter
  onBookmarkClick?: () => void;
  onStatusChange?: (newStatus: TripStatus) => void;
}

const EnhancedTripCard = ({
  id,
  destination,
  startDate,
  endDate,
  startCity,
  description,
  creator,
  vibe,
  groupSize,
  interestedCount,
  isLiked = false,
  isBookmarked = false,
  status = "planning",
  price,
  isFemaleOnly = false,
  isInstantJoin = false,
  postedAt,
  onClick,
  onChatClick,
  onLikeClick,
  onBookmarkClick,
  onStatusChange,
}: EnhancedTripCardProps) => {
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [interested, setInterested] = useState(interestedCount);
  const [currentStatus, setCurrentStatus] = useState<TripStatus>(status);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRequestStatus, setUserRequestStatus] = useState<string | null>(
    null
  );

  const { toast } = useToast();
  const {
    updateTripStatus,
    autoUpdateStatusBasedOnDates,
    loading: statusLoading,
  } = useTripStatus(currentUser);

  // ✅ FIX 2: Sync interested count when prop changes
  useEffect(() => {
    setInterested(interestedCount);
  }, [interestedCount]);

  // ✅ FIX 3: Sync liked state when prop changes
  useEffect(() => {
    setLiked(isLiked);
  }, [isLiked]);

  // ✅ REPLACE WITH THIS NEW CODE:
  useEffect(() => {
    const fetchInitialData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        try {
          // ✅ Check if user is already a participant
          const { data: participantData, error: participantError } =
            await supabase
              .from("trip_participants")
              .select("trip_id")
              .eq("trip_id", id)
              .eq("user_id", user.id)
              .maybeSingle(); // ✅ Use maybeSingle to avoid errors

          // ✅ If error, just log it and continue
          if (participantError && participantError.code !== "PGRST116") {
            console.log("Participant check error:", participantError.code);
          }

          if (participantData) {
            // User is already a participant (approved)
            setUserRequestStatus("approved");
            return;
          }

          // ✅ Check if user has a pending join request
          const { data: requestData, error: requestError } = await supabase
            .from("trip_join_requests")
            .select("status")
            .eq("trip_id", id)
            .eq("user_id", user.id)
            .maybeSingle(); // ✅ Use maybeSingle to avoid errors

          // ✅ If error, just log it and continue
          if (requestError && requestError.code !== "PGRST116") {
            console.log("Request check error:", requestError.code);
          }

          if (requestData) {
            setUserRequestStatus(requestData.status);
          }
        } catch (error) {
          // ✅ Silently handle errors - don't break the UI
          console.log("Error fetching user status:", error);
        }
      }
    };
    fetchInitialData();
  }, [id]);

  useEffect(() => {
    if (currentUser) {
      autoUpdateStatusBasedOnDates(id);
    }
  }, [currentUser, id, autoUpdateStatusBasedOnDates]);

  const getStatusConfig = (status: TripStatus) => {
    switch (status) {
      case "planning":
        return {
          label: "Planning",
          variant: "outline" as const,
          className:
            "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
          icon: <PauseCircle className="w-3 h-3" />,
        };
      case "confirmed":
        return {
          label: "Confirmed",
          variant: "default" as const,
          className:
            "bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
          icon: <CheckCircle className="w-3 h-3" />,
        };
      case "ongoing":
        return {
          label: "Live",
          variant: "default" as const,
          className:
            "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 animate-pulse",
          icon: <PlayCircle className="w-3 h-3" />,
        };
      case "completed":
        return {
          label: "Completed",
          variant: "secondary" as const,
          className: "bg-gray-100 text-gray-700 border-gray-300",
          icon: <CheckCircle className="w-3 h-3" />,
        };
      default:
        return {
          label: "Planning",
          variant: "outline" as const,
          className: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <PauseCircle className="w-3 h-3" />,
        };
    }
  };

  const statusConfig = getStatusConfig(currentStatus);

  const handleStatusChange = async (newStatus: TripStatus) => {
    const success = await updateTripStatus(
      id,
      newStatus,
      `Status changed to ${newStatus}`
    );
    if (success) {
      setCurrentStatus(newStatus);
      onStatusChange?.(newStatus);
    }
  };

  const canManageTrip = currentUser && currentUser.id === creator.id;

  const getAvailableStatusTransitions = (
    currentStatus: TripStatus
  ): TripStatus[] => {
    switch (currentStatus) {
      case "planning":
        return ["confirmed"];
      case "confirmed":
        return ["planning", "ongoing"];
      case "ongoing":
        return ["completed"];
      default:
        return [];
    }
  };
  const availableTransitions = getAvailableStatusTransitions(currentStatus);

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please sign in to join a trip.",
          variant: "destructive",
        });
        return;
      }

      if (user.id === creator.id) {
        toast({
          title: "You can't join your own trip!",
          variant: "destructive",
        });
        return;
      }

      // ✅ Check if already a participant - with maybeSingle
      const { data: existingParticipant, error: participantError } =
        await supabase
          .from("trip_participants")
          .select("trip_id")
          .eq("trip_id", id)
          .eq("user_id", user.id)
          .maybeSingle();

      if (participantError && participantError.code !== "PGRST116") {
        console.error("Error checking participant:", participantError);
      }

      if (existingParticipant) {
        toast({
          title: "You're already part of this trip!",
        });
        return;
      }

      // ✅ Check for existing join request - with maybeSingle
      const { data: existingRequest, error: checkError } = await supabase
        .from("trip_join_requests")
        .select("status")
        .eq("trip_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking request:", checkError);
      }

      if (existingRequest) {
        const statusMessages = {
          pending:
            "Your join request is pending approval from the trip creator.",
          approved:
            "Your request was approved! The creator will add you to the trip.",
          rejected:
            "Your previous request was declined. You can submit a new request.",
        };

        if (existingRequest.status === "rejected") {
          const { error: updateError } = await supabase
            .from("trip_join_requests")
            .update({ status: "pending", created_at: new Date().toISOString() })
            .eq("trip_id", id)
            .eq("user_id", user.id);

          if (updateError) throw updateError;
          setUserRequestStatus("pending");
          toast({
            title: "Request resubmitted! ✅",
            description:
              "Your join request has been sent to the trip creator for approval.",
          });
        } else {
          toast({
            title:
              statusMessages[
                existingRequest.status as keyof typeof statusMessages
              ],
            variant:
              existingRequest.status === "pending" ? "default" : "destructive",
          });
        }
        return;
      }

      // Create new join request
      const { error } = await supabase.from("trip_join_requests").insert({
        trip_id: id,
        user_id: user.id,
        status: "pending",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setUserRequestStatus("pending");
      toast({
        title: "Request sent! 📨",
        description:
          "Your join request has been sent to the trip creator for approval.",
      });

      await supabase.from("notifications").insert({
        user_id: creator.id,
        type: "trip_join_request",
        title: "New join request",
        message: `Someone wants to join your trip to ${destination}`,
        data: {
          trip_id: id,
          requester_id: user.id,
          trip_destination: destination,
        },
      });
    } catch (error: any) {
      console.error("Join request error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process join request",
        variant: "destructive",
      });
    }
  };

  // ✅ FIX 4: Update handleLike to pass event and don't modify local state
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't toggle local state - let parent handle it
    onLikeClick?.(e);
  };

  const handleBookmark = async (tripId: number) => {
    setBookmarked(!bookmarked);
    onBookmarkClick?.();
    return Promise.resolve();
  };

  const handleChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChatClick?.();
  };

  const timeAgo = formatDistanceToNow(new Date(postedAt), { addSuffix: true });
  const daysUntilTrip = Math.ceil(
    (new Date(startDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const isJoinable =
    currentStatus === "planning" || currentStatus === "confirmed";

  const getButtonText = () => {
    if (!currentUser) return "Sign in to Join";
    if (currentUser.id === creator.id) return "Your Trip";
    if (userRequestStatus === "pending") return "⏳ Pending Approval";
    if (userRequestStatus === "approved") return "✅ Joined";
    if (userRequestStatus === "rejected") return "Resubmit Request";
    return "Request to Join"; // ✅ Changed from "Join Now"
  };

  const buttonText = getButtonText();

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group hover-scale relative"
      onClick={onClick}
    >
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <BookmarkButton
          tripId={id}
          isBookmarked={bookmarked}
          onToggle={handleBookmark}
          size="sm"
          variant="bookmark"
          className="bg-white/90 hover:bg-white shadow-sm"
        />
        <button
          onClick={handleLike}
          className={`p-2 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors ${
            liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
        </button>
      </div>
      <CardContent className="p-0">
        <div className="p-4 pb-3 pt-12">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-foreground leading-tight">
                  {destination}
                </h3>
                {isInstantJoin && currentStatus !== "completed" && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    ⚡ Instant Join
                  </Badge>
                )}
                {isFemaleOnly && (
                  <Badge className="bg-pink-100 text-pink-800 text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Women Only
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{startCity}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(startDate).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {daysUntilTrip <= 3 &&
                  daysUntilTrip >= 0 &&
                  currentStatus !== "completed" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {daysUntilTrip}d left
                    </Badge>
                  )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {vibe.slice(0, 3).map((v, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {v}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {description}
          </p>
        </div>
        <div className="px-4 pb-3 border-t border-border/50">
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={creator.avatar} alt={creator.name} />
                <AvatarFallback className="bg-earth-sand text-earth-terracotta text-sm">
                  {creator.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-medium">{creator.name}</span>
                  {creator.verificationBadges.includes("verified") && (
                    <Verified className="w-3 h-3 text-accent" />
                  )}
                  {canManageTrip && (
                    <Badge variant="outline" className="text-xs">
                      Creator
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{creator.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">{timeAgo}</div>
              {price && (
                <div className="font-semibold text-sm">
                  ₹{price.amount.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* ✅ FIX 5: This section already displays interested count correctly */}
        <div className="px-4 py-3 bg-muted/30 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>
                  {groupSize.current}/{groupSize.max} joined
                </span>
              </div>
              {/* ✅ Already showing interested count */}
              <div className="flex items-center space-x-1">
                <Heart
                  className={`w-4 h-4 ${
                    liked ? "text-red-500 fill-red-500" : ""
                  }`}
                />
                <span>{interested} interested</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleChat}
                className="p-2"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleJoin}
                disabled={
                  !isJoinable ||
                  canManageTrip ||
                  userRequestStatus === "pending" ||
                  userRequestStatus === "approved"
                }
                className="bg-accent hover:bg-accent/90"
              >
                {buttonText}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedTripCard;
