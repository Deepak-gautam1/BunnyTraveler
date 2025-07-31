import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MapPin, Users } from "lucide-react";
// --- Imports for new functionality ---
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TripCardProps {
  // --- New prop required for the button ---
  id: number;
  destination: string;
  startDate: string;
  endDate: string;
  startCity: string;
  creatorName: string;
  creatorAvatar?: string;
  interestCount: number;
  onClick?: () => void;
}

const TripCard = ({
  id,
  destination,
  startDate,
  endDate,
  startCity,
  creatorName,
  creatorAvatar,
  interestCount,
  onClick,
}: TripCardProps) => {
  const { toast } = useToast();

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

  // --- New function to handle joining a trip ---
  const handleJoinTrip = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents the card's main onClick from firing

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
        // Handle cases where the user has already joined
        if (error.code === "23505") {
          toast({
            title: "You've already joined this trip!",
            variant: "default",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "You're in!",
          description: "You have successfully joined the trip.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card
      className="trip-card p-4 mb-4 mx-4 bg-card shadow-soft hover:shadow-elevated transition-all duration-200 cursor-pointer animate-slide-up"
      onClick={onClick}
    >
      {/* Header with destination */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {destination}
        </h3>
        <div className="flex items-center text-muted-foreground text-sm space-x-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDateRange(startDate, endDate)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>From: {startCity}</span>
          </div>
        </div>
      </div>

      {/* Footer with creator and interest count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar className="w-8 h-8 user-avatar">
            <AvatarImage src={creatorAvatar} alt={creatorName} />
            <AvatarFallback className="bg-earth-sand text-earth-terracotta text-xs">
              {creatorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{creatorName}</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">{interestCount}</span>
          </div>
          {/* --- New "I'm Interested" button --- */}
          <Button variant="outline" size="sm" onClick={handleJoinTrip}>
            I'm Interested
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TripCard;
