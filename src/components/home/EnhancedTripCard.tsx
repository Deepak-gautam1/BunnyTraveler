import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// --- UPDATES START HERE ---
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
// --- UPDATES END HERE ---

interface EnhancedTripCardProps {
  id: number;
  destination: string;
  startDate: string;
  endDate: string;
  startCity: string;
  description: string;
  creator: {
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
  price?: {
    amount: number;
    currency: string;
  };
  isFemaleOnly?: boolean;
  isInstantJoin?: boolean;
  postedAt: string;
  onClick?: () => void;
  onJoinClick?: (tripId: string | number) => void; // Can keep this if parent needs to know
  onChatClick?: () => void;
  onLikeClick?: () => void;
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
  price,
  isFemaleOnly = false,
  isInstantJoin = false,
  postedAt,
  onClick,
  onJoinClick,
  onChatClick,
  onLikeClick,
}: EnhancedTripCardProps) => {
  const [liked, setLiked] = useState(isLiked);
  const [interested, setInterested] = useState(interestedCount);

  // --- UPDATES START HERE ---
  const { toast } = useToast();

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
        // Optionally, you can call a function to show the sign-in modal
        // onJoinClick?.(id); // This would trigger the check in the parent
        return;
      }

      const { error } = await supabase
        .from("trip_participants")
        .insert({ trip_id: id, user_id: user.id });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          toast({ title: "You've already shown interest in this trip!" });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "You're in!",
          description: "You have successfully shown interest in the trip.",
        });
        setInterested((prev) => prev + 1); // Optimistically update the count
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  // --- UPDATES END HERE ---

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
    // Note: The interested count shouldn't be tied to the like button
    onLikeClick?.();
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

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group hover-scale"
      onClick={onClick} // Make sure this calls the parent's handleTripClick
    >
      <CardContent className="p-0">
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-foreground leading-tight">
                  {destination}
                </h3>
                {isInstantJoin && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    ⚡ Instant Join
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
                {daysUntilTrip <= 3 && daysUntilTrip >= 0 && (
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
            <button
              onClick={handleLike}
              className={`p-2 rounded-full transition-colors ${
                liked
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-red-500"
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
            </button>
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
                variant={isInstantJoin ? "default" : "outline"}
                size="sm"
                onClick={handleJoin} // Updated to use the new functional handler
                className={isInstantJoin ? "bg-accent hover:bg-accent/90" : ""}
              >
                {isInstantJoin ? "Join Now" : "Show Interest"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedTripCard;
