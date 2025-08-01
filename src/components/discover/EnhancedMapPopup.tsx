// src/components/discover/EnhancedMapPopup.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BookmarkButton from "@/components/trip/BookmarkButton";
import {
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Eye,
  MessageSquare,
  Star,
  Clock,
  TrendingUp,
} from "lucide-react";

interface EnhancedMapPopupProps {
  trip: any;
  onTripSelect: (trip: any) => void;
  onBookmarkToggle?: (tripId: number) => Promise<boolean>;
  isBookmarked?: boolean;
  user?: any;
}

const EnhancedMapPopup = ({
  trip,
  onTripSelect,
  onBookmarkToggle,
  isBookmarked = false,
  user,
}: EnhancedMapPopupProps) => {
  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startMonth = start.toLocaleDateString("en", { month: "short" });
    const endMonth = end.toLocaleDateString("en", { month: "short" });
    const startDay = start.getDate();
    const endDay = end.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  };

  const formatBudget = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  const getUrgencyBadge = () => {
    const spotsLeft = trip.max_participants - trip.current_participants;
    if (spotsLeft <= 2 && spotsLeft > 0) {
      return (
        <Badge variant="destructive" className="text-xs animate-pulse">
          <TrendingUp className="w-3 h-3 mr-1" />
          Only {spotsLeft} spots left!
        </Badge>
      );
    }
    return null;
  };

  const getDaysUntilTrip = () => {
    const today = new Date();
    const tripDate = new Date(trip.start_date);
    const diffTime = tripDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7 && diffDays > 0) {
      return (
        <Badge
          variant="secondary"
          className="text-xs bg-orange-100 text-orange-800"
        >
          <Clock className="w-3 h-3 mr-1" />
          Starts in {diffDays} days
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card className="w-96 border-0 shadow-xl overflow-hidden">
      {/* Hero Section with Gradient */}
      <div className="relative h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-white line-clamp-1 mb-1">
              {trip.destination}
            </h3>
            <div className="flex items-center text-white/90 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              <span>From {trip.start_city}</span>
            </div>
          </div>

          {user && onBookmarkToggle && (
            <BookmarkButton
              tripId={trip.id}
              isBookmarked={isBookmarked}
              onToggle={onBookmarkToggle}
              variant="heart"
              size="sm"
              className="bg-white/20 hover:bg-white/30 border-white/30"
            />
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Urgency & Status Badges */}
        <div className="flex flex-wrap gap-2">
          {getUrgencyBadge()}
          {getDaysUntilTrip()}
          {trip.travel_style &&
            trip.travel_style
              .slice(0, 2)
              .map((style: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {style}
                </Badge>
              ))}
        </div>

        {/* Trip Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 text-accent" />
              <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4 text-accent" />
              <span>
                {trip.current_participants}/{trip.max_participants} people
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {trip.budget_per_person && (
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-accent" />
                <span className="font-semibold text-accent">
                  {formatBudget(trip.budget_per_person)}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">4.8 (24 reviews)</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {trip.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 bg-muted/30 p-3 rounded-lg">
            {trip.description}
          </p>
        )}

        {/* Creator Section */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 ring-2 ring-accent/20">
              <AvatarImage src={trip.profiles?.avatar_url} />
              <AvatarFallback className="bg-accent/10 text-accent text-sm font-medium">
                {trip.profiles?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {trip.profiles?.full_name || "Anonymous"}
              </p>
              <p className="text-xs text-muted-foreground">
                Trip Creator • Verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => console.log("Start chat")}
              className="h-8 px-3"
            >
              <MessageSquare className="w-3 h-3" />
            </Button>

            <Button
              size="sm"
              onClick={() => onTripSelect(trip)}
              className="h-8 px-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedMapPopup;
