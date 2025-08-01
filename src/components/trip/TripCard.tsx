// src/components/trip/TripCard.tsx
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Sparkles,
  Heart,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import BookmarkButton from "@/components/trip/BookmarkButton";
import { useBookmarks } from "@/hooks/useBookmarks";
interface TripCardProps {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  start_city: string;
  description?: string;
  budget_per_person?: number;
  travel_style?: string[];
  max_participants: number;
  current_participants: number;
  user_id: string; // Creator's user ID
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
  onClick?: () => void;
  currentUser?: any; // Current logged-in user
  onParticipantUpdate?: () => void; // Callback to refresh data
  onBookmarkToggle?: (tripId: number) => Promise<boolean>;
  isBookmarked?: boolean;
}

// Travel styles configuration with emojis
const TRAVEL_STYLES = [
  { id: "adventure", label: "Adventure", emoji: "🏔️" },
  { id: "cultural", label: "Cultural", emoji: "🏛️" },
  { id: "relaxation", label: "Relaxation", emoji: "🌴" },
  { id: "foodie", label: "Foodie", emoji: "🍜" },
  { id: "nightlife", label: "Nightlife", emoji: "🌃" },
  { id: "budget", label: "Budget", emoji: "💰" },
  { id: "luxury", label: "Luxury", emoji: "✨" },
  { id: "solo-friendly", label: "Solo Friendly", emoji: "🎒" },
  { id: "photography", label: "Photography", emoji: "📸" },
  { id: "spiritual", label: "Spiritual", emoji: "🕉️" },
  { id: "backpacking", label: "Backpacking", emoji: "🏃‍♂️" },
  { id: "wellness", label: "Wellness", emoji: "🧘‍♀️" },
];

const TripCard = ({
  id,
  destination,
  start_date,
  end_date,
  start_city,
  description,
  budget_per_person,
  travel_style,
  max_participants,
  current_participants,
  user_id,
  profiles,
  onClick,
  currentUser,
  onParticipantUpdate,
  onBookmarkToggle,
  isBookmarked = false,
}: TripCardProps) => {
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  // Format date range
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startMonth = startDate.toLocaleDateString("en", { month: "short" });
    const endMonth = endDate.toLocaleDateString("en", { month: "short" });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  };

  // Format budget
  const formatBudget = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  // Handle joining a trip
  const handleJoinTrip = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents the card's main onClick from firing

    if (!currentUser) {
      toast({
        title: "Please sign in to join trips",
        description: "You need to be logged in to join this adventure",
        variant: "destructive",
      });
      return;
    }

    if (currentUser.id === user_id) {
      toast({
        title: "This is your trip!",
        description: "You can't join your own trip",
        variant: "default",
      });
      return;
    }

    if (current_participants >= max_participants) {
      toast({
        title: "Trip is full",
        description: "This trip has reached maximum capacity",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);

    try {
      // First check if user already joined
      const { data: existingParticipant, error: checkError } = await supabase
        .from("trip_participants")
        .select("id")
        .eq("trip_id", id)
        .eq("user_id", currentUser.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingParticipant) {
        toast({
          title: "Already joined!",
          description: "You're already part of this adventure",
          variant: "default",
        });
        setHasJoined(true);
        return;
      }

      // Join the trip
      const { error: joinError } = await supabase
        .from("trip_participants")
        .insert({
          trip_id: id,
          user_id: currentUser.id,
          joined_at: new Date().toISOString(),
          status: "joined",
        });

      if (joinError) throw joinError;

      // Update trip participant count
      const { error: updateError } = await supabase
        .from("trips")
        .update({
          current_participants: current_participants + 1,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      setHasJoined(true);
      toast({
        title: "🎉 You're in!",
        description:
          "Welcome to the adventure! Check your messages for trip details.",
      });

      // Trigger refresh in parent component
      onParticipantUpdate?.();
    } catch (error: any) {
      console.error("Error joining trip:", error);
      toast({
        title: "Failed to join trip",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Handle starting a chat with trip creator
  const handleStartChat = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!currentUser) {
      toast({
        title: "Please sign in to message",
        description: "You need to be logged in to contact trip creators",
        variant: "destructive",
      });
      return;
    }

    // Navigate to messages page or open chat modal
    // This would depend on your routing setup
    window.location.href = `/messages?participant=${user_id}&trip=${id}`;
  };

  const isOwnTrip = currentUser?.id === user_id;
  const isTripFull = current_participants >= max_participants;

  return (
    <Card className="trip-card p-6 bg-card shadow-soft hover:shadow-elevated transition-all duration-300 cursor-pointer animate-slide-up border-0 hover:scale-[1.02]">
      <div onClick={onClick} className="space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground line-clamp-2">
            {destination}
          </h3>

          {/* Trip Details */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-accent" />
              <span>{formatDateRange(start_date, end_date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-accent" />
              <span>From {start_city}</span>
            </div>
          </div>

          {/* Bookmark Button */}
          {onBookmarkToggle && (
            <BookmarkButton
              tripId={parseInt(id)}
              isBookmarked={isBookmarked}
              onToggle={onBookmarkToggle}
              variant="bookmark"
              size="md"
              className="ml-3"
            />
          )}
        </div>

        {/* Budget Display */}
        {budget_per_person && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1 bg-accent/10 rounded-full">
              <IndianRupee className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">
                {formatBudget(budget_per_person)} per person
              </span>
            </div>
          </div>
        )}

        {/* Travel Style Tags */}
        {travel_style && travel_style.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {travel_style.slice(0, 3).map((style) => {
              const styleConfig = TRAVEL_STYLES.find((s) => s.id === style);
              return styleConfig ? (
                <Badge
                  key={style}
                  variant="secondary"
                  className="text-xs bg-muted/50 hover:bg-muted/80 transition-colors"
                >
                  <span className="mr-1">{styleConfig.emoji}</span>
                  {styleConfig.label}
                </Badge>
              ) : null;
            })}
            {travel_style.length > 3 && (
              <Badge variant="outline" className="text-xs border-dashed">
                +{travel_style.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Description Preview */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Group Size Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>
              {current_participants}/{max_participants} joined
            </span>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  (current_participants / max_participants) * 100,
                  100
                )}%`,
              }}
            />
          </div>

          {isTripFull && (
            <Badge variant="secondary" className="text-xs">
              Full
            </Badge>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        {/* Creator Info */}
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 user-avatar border-2 border-accent/20">
            <AvatarImage src={profiles.avatar_url} alt={profiles.full_name} />
            <AvatarFallback className="bg-accent/10 text-accent font-medium">
              {profiles.full_name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">
              {profiles.full_name || "Anonymous"}
            </p>
            <p className="text-xs text-muted-foreground">Trip Creator</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Message Creator Button */}
          {!isOwnTrip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartChat}
              className="h-9 px-3 hover:bg-accent/10 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}

          {/* Join Trip Button */}
          {!isOwnTrip && (
            <Button
              variant={hasJoined ? "secondary" : "default"}
              size="sm"
              onClick={handleJoinTrip}
              disabled={isJoining || hasJoined || isTripFull}
              className={`h-9 px-4 font-medium transition-all ${
                hasJoined
                  ? "bg-accent/10 text-accent hover:bg-accent/20"
                  : "bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm hover:shadow-md"
              }`}
            >
              {isJoining ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Joining...</span>
                </div>
              ) : hasJoined ? (
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 fill-current" />
                  <span>Joined</span>
                </div>
              ) : isTripFull ? (
                "Full"
              ) : (
                <div className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Join Trip</span>
                </div>
              )}
            </Button>
          )}

          {/* Own Trip Indicator */}
          {isOwnTrip && (
            <Badge
              variant="outline"
              className="text-xs border-accent/30 text-accent"
            >
              Your Trip
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TripCard;
