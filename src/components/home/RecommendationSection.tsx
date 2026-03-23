// src/components/home/RecommendationSection.tsx
import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useBookmarks } from "@/hooks/useBookmarks";
import BookmarkButton from "@/components/trip/BookmarkButton";
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  RefreshCw,
  TrendingUp,
  Star,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface RecommendationSectionProps {
  user: User | null;
  onTripClick: (tripId: number) => void;
}

const RecommendationSection = ({
  user,
  onTripClick,
}: RecommendationSectionProps) => {
  const [showAll, setShowAll] = useState(false); // ✅ State for expansion
  const { recommendations, loading, error, refreshRecommendations } =
    useRecommendations(user);
  const { toggleBookmark, isBookmarked } = useBookmarks(user);

  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatBudget = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-blue-600 bg-blue-50";
    if (score >= 40) return "text-orange-600 bg-orange-50";
    return "text-gray-600 bg-gray-50";
  };


  if (loading) {
    return (
      <div className="px-4 mb-6">
        <Card className="border-2 border-dashed border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Sparkles className="w-5 h-5 animate-pulse text-accent" />
              <span className="text-muted-foreground">
                Finding perfect trips for you...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return (
      <div className="px-4 mb-6">
        <Card className="border-accent/20">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No recommendations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bookmark some trips or join adventures to get personalized
              recommendations!
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshRecommendations()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Determine how many trips to display
  const displayedTrips = showAll
    ? recommendations
    : recommendations.slice(0, 3);
  const hasMore = recommendations.length > 3;

  return (
    <div className="px-4 mb-6">
      {/* Section Header - More Compact */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Recommended For You</h2>
            <p className="text-xs text-muted-foreground">
              AI-powered picks based on your interests
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => refreshRecommendations()}
        >
          <RefreshCw
            className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* ✅ Horizontal Scrolling Container */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
          {displayedTrips.map((trip) => (
            <Card
              key={trip.trip_id}
              className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-soft relative overflow-hidden flex-shrink-0 w-80 snap-start"
              onClick={() => onTripClick(trip.trip_id)}
            >
              {/* Score Badge */}
              <div className="absolute top-2 left-2 z-10">
                <Badge
                  className={`text-xs font-medium px-2 py-1 ${getScoreColor(
                    trip.recommendation_score
                  )}`}
                >
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  {Math.round(trip.recommendation_score)}%
                </Badge>
              </div>

              {/* Bookmark Button */}
              <div className="absolute top-2 right-2 z-10">
                <BookmarkButton
                  tripId={trip.trip_id}
                  isBookmarked={isBookmarked(trip.trip_id)}
                  onToggle={toggleBookmark}
                  variant="bookmark"
                  size="sm"
                  className="bg-white/90 hover:bg-white shadow-sm"
                />
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="pt-4">
                    <h3 className="font-semibold text-base group-hover:text-accent transition-colors line-clamp-1 mb-1">
                      {trip.destination}
                    </h3>

                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>From {trip.start_city}</span>
                    </div>
                  </div>

                  {/* Travel Styles */}
                  {trip.travel_style && trip.travel_style.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {trip.travel_style.slice(0, 2).map((style, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {style}
                        </Badge>
                      ))}
                      {trip.travel_style.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{trip.travel_style.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Trip Details */}
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1 text-accent" />
                      <span className="text-xs">
                        {formatDate(trip.start_date)} -{" "}
                        {formatDate(trip.end_date)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-muted-foreground">
                        <Users className="w-3 h-3 mr-1 text-accent" />
                        <span className="text-xs">
                          {trip.current_participants}/{trip.max_participants}
                        </span>
                      </div>

                      {trip.budget_per_person && (
                        <div className="flex items-center text-sm">
                          <IndianRupee className="w-3 h-3 mr-1 text-accent" />
                          <span className="font-semibold text-accent text-xs">
                            {formatBudget(trip.budget_per_person)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {trip.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {trip.description}
                    </p>
                  )}

                  {/* Creator */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={trip.creator_avatar} />
                        <AvatarFallback className="text-xs bg-accent/10 text-accent">
                          {trip.creator_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate">
                        by {trip.creator_name}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* ✅ "View More" / "Show Less" Card */}
          {hasMore && (
            <Card
              className="flex-shrink-0 w-48 snap-start border-dashed border-2 hover:border-accent transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowAll(!showAll);
              }}
            >
              <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-accent/10 rounded-full mb-3">
                  {showAll ? (
                    <ChevronLeft className="w-6 h-6 text-accent" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-accent" />
                  )}
                </div>
                <h3 className="font-semibold text-sm mb-1">
                  {showAll ? "Show Less" : "More Recommendations"}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {showAll
                    ? "Hide additional suggestions"
                    : `${recommendations.length - 3} more available`}
                </p>
                <Button variant="outline" size="sm">
                  {showAll ? (
                    <>
                      <ChevronLeft className="w-3 h-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      View All
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ✅ Scroll Indicators */}
        <div className="flex justify-center mt-2 gap-1">
          <div className="h-1 w-8 bg-accent/20 rounded-full"></div>
          <div className="h-1 w-2 bg-accent/40 rounded-full"></div>
          <div className="h-1 w-2 bg-accent/40 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationSection;
