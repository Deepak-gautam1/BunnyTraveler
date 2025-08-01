// src/components/home/RecommendationSection.tsx
import React from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
} from "lucide-react";

interface RecommendationSectionProps {
  user: User | null;
  onTripClick: (tripId: number) => void;
}

const RecommendationSection = ({
  user,
  onTripClick,
}: RecommendationSectionProps) => {
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

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Perfect Match";
    if (score >= 60) return "Great Match";
    if (score >= 40) return "Good Match";
    return "Potential Match";
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

  return (
    <div className="px-4 mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Recommended For You</h2>
            <p className="text-sm text-muted-foreground">
              Personalized picks based on your interests
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => refreshRecommendations()}
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Recommendations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((trip) => (
          <Card
            key={trip.trip_id}
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 shadow-soft relative overflow-hidden"
            onClick={() => onTripClick(trip.trip_id)}
          >
            {/* Recommendation Score Badge */}
            <div className="absolute top-1 left-3 z-10">
              <Badge
                className={`text-xs font-medium ${getScoreColor(
                  trip.recommendation_score
                )}`}
              >
                <Star className="w-3 h-3 mr-1 fill-current" />
                {getScoreLabel(trip.recommendation_score)}
              </Badge>
            </div>

            {/* Bookmark Button */}
            <div className="absolute top-3 right-3 z-10">
              <BookmarkButton
                tripId={trip.trip_id}
                isBookmarked={isBookmarked(trip.trip_id)}
                onToggle={toggleBookmark}
                variant="bookmark"
                size="sm"
                className="bg-white/90 hover:bg-white"
              />
            </div>

            <CardHeader className="pb-3">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg group-hover:text-accent transition-colors line-clamp-1">
                  {trip.destination}
                </h3>

                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>From {trip.start_city}</span>
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
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Trip Details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-1 text-accent" />
                    <span>
                      {formatDate(trip.start_date)} -{" "}
                      {formatDate(trip.end_date)}
                    </span>
                  </div>

                  <div className="flex items-center text-muted-foreground">
                    <Users className="w-4 h-4 mr-1 text-accent" />
                    <span>
                      {trip.current_participants}/{trip.max_participants}
                    </span>
                  </div>
                </div>

                {/* Budget */}
                {trip.budget_per_person && (
                  <div className="flex items-center text-sm">
                    <IndianRupee className="w-4 h-4 mr-1 text-accent" />
                    <span className="font-semibold text-accent">
                      {formatBudget(trip.budget_per_person)} per person
                    </span>
                  </div>
                )}

                {/* Description */}
                {trip.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {trip.description}
                  </p>
                )}

                {/* Creator */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={trip.creator_avatar} />
                      <AvatarFallback className="text-xs bg-accent/10 text-accent">
                        {trip.creator_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      by {trip.creator_name}
                    </span>
                  </div>

                  <Badge variant="outline" className="text-xs">
                    {Math.round(trip.recommendation_score)}% match
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View All Button */}
      {recommendations.length >= 6 && (
        <div className="text-center mt-6">
          <Button variant="outline" onClick={() => refreshRecommendations(20)}>
            View More Recommendations
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecommendationSection;
