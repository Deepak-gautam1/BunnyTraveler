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
  MoreVertical,
  Settings,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import BookmarkButton from "@/components/trip/BookmarkButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ✅ NEW: Import the trip status hook
import { useTripStatus, TripStatus } from "@/hooks/useTripStatus";

interface EnhancedTripCardProps {
  id: number;
  destination: string;
  startDate: string;
  endDate: string;
  startCity: string;
  description: string;
  creator: {
    id: string; // ✅ NEW: Add creator ID for permission checks
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
  status?: TripStatus;
  price?: {
    amount: number;
    currency: string;
  };
  isFemaleOnly?: boolean;
  isInstantJoin?: boolean;
  postedAt: string;
  onClick?: () => void;
  onJoinClick?: (tripId: string | number) => void;
  onChatClick?: () => void;
  onLikeClick?: () => void;
  onBookmarkClick?: () => void;
  onStatusChange?: (newStatus: TripStatus) => void; // ✅ NEW: Status change callback
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
  onJoinClick,
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

  const { toast } = useToast();

  // ✅ NEW: Initialize the trip status hook
  const {
    updateTripStatus,
    autoUpdateStatusBasedOnDates,
    loading: statusLoading,
  } = useTripStatus(currentUser);

  // ✅ NEW: Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // ✅ NEW: Auto-update status based on dates when component mounts
  useEffect(() => {
    if (currentUser) {
      autoUpdateStatusBasedOnDates(id);
    }
  }, [currentUser, id]);

  // ✅ NEW: Status configuration with enhanced styling
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

  // ✅ NEW: Handle status change
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

  // ✅ NEW: Check if current user can manage trip
  const canManageTrip = currentUser && currentUser.id === creator.id;

  // ✅ NEW: Get available status transitions
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
      case "completed":
        return []; // No transitions from completed
      default:
        return [];
    }
  };

  const availableTransitions = getAvailableStatusTransitions(currentStatus);

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Prevent joining completed trips
    if (currentStatus === "completed") {
      toast({
        title: "Trip completed",
        description: "This trip has already ended",
        variant: "destructive",
      });
      return;
    }

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

      const { error } = await supabase
        .from("trip_participants")
        .insert({ trip_id: id, user_id: user.id });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "You've already shown interest in this trip!" });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "You're in!",
          description: "You have successfully shown interest in the trip.",
        });
        setInterested((prev) => prev + 1);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    onLikeClick?.();
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

  // Determine if trip is joinable based on status
  const isJoinable =
    currentStatus === "planning" || currentStatus === "confirmed";
  const buttonText =
    currentStatus === "completed"
      ? "Completed"
      : currentStatus === "ongoing"
      ? "In Progress"
      : isInstantJoin
      ? "Join Now"
      : "Show Interest";

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group hover-scale relative"
      onClick={onClick}
    >
      {/* Top-right icons container */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {/* ✅ NEW: Status Badge with Management Dropdown for Trip Creator */}
        {canManageTrip && availableTransitions.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge
                variant={statusConfig.variant}
                className={`text-xs font-medium cursor-pointer hover:opacity-80 ${statusConfig.className}`}
              >
                {statusConfig.icon}
                <span className="ml-1">{statusConfig.label}</span>
                <Settings className="w-3 h-3 ml-1" />
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableTransitions.map((newStatus) => {
                const newStatusConfig = getStatusConfig(newStatus);
                return (
                  <DropdownMenuItem
                    key={newStatus}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(newStatus);
                    }}
                    disabled={statusLoading}
                  >
                    {newStatusConfig.icon}
                    <span className="ml-2">
                      Mark as {newStatusConfig.label}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // ✅ Static status badge for non-creators or when no transitions available
          <Badge
            variant={statusConfig.variant}
            className={`text-xs font-medium ${statusConfig.className}`}
          >
            {statusConfig.icon}
            <span className="ml-1">{statusConfig.label}</span>
          </Badge>
        )}

        {/* Bookmark Button */}
        <BookmarkButton
          tripId={id}
          isBookmarked={bookmarked}
          onToggle={handleBookmark}
          size="sm"
          variant="bookmark"
          className="bg-white/90 hover:bg-white shadow-sm"
        />

        {/* Heart Button */}
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
                  {/* ✅ NEW: Show creator badge */}
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

        <div className="px-4 py-3 bg-muted/30 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>
                  {groupSize.current}/{groupSize.max} joined
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
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
                variant={isJoinable && isInstantJoin ? "default" : "outline"}
                size="sm"
                onClick={handleJoin}
                disabled={!isJoinable}
                className={
                  isJoinable && isInstantJoin
                    ? "bg-accent hover:bg-accent/90"
                    : currentStatus === "completed"
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
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
