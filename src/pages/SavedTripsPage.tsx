// src/pages/SavedTripsPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBookmarks } from "@/hooks/useBookmarks";
import BookmarkButton from "@/components/trip/BookmarkButton";
import EnhancedTripCard from "@/components/home/EnhancedTripCard";
import {
  Heart,
  Search,
  Calendar,
  MapPin,
  Filter,
  Grid,
  List,
  RefreshCw,
  Trash2,
  IndianRupee,
} from "lucide-react";

interface SavedTripsPageProps {
  user: User | null;
}

const SavedTripsPage = ({ user }: SavedTripsPageProps) => {
  const navigate = useNavigate();
  const { bookmarks, loading, toggleBookmark, isBookmarked, refreshBookmarks } =
    useBookmarks(user);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "date" | "destination"
  >("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Filter and sort bookmarks
  const filteredBookmarks = bookmarks
    .filter((bookmark) => {
      if (!bookmark.trips) return false;

      const searchLower = searchTerm.toLowerCase();
      return (
        bookmark.trips.destination.toLowerCase().includes(searchLower) ||
        bookmark.trips.start_city.toLowerCase().includes(searchLower) ||
        (bookmark.trips.description &&
          bookmark.trips.description.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      if (!a.trips || !b.trips) return 0;

      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.bookmarked_at).getTime() -
            new Date(b.bookmarked_at).getTime()
          );
        case "date":
          return (
            new Date(a.trips.start_date).getTime() -
            new Date(b.trips.start_date).getTime()
          );
        case "destination":
          return a.trips.destination.localeCompare(b.trips.destination);
        case "newest":
        default:
          return (
            new Date(b.bookmarked_at).getTime() -
            new Date(a.bookmarked_at).getTime()
          );
      }
    });

  const handleTripClick = (tripId: number) => {
    navigate(`/trip/${tripId}`);
  };

  const clearAllBookmarks = async () => {
    // You could implement a bulk delete function here
    console.log("Clear all bookmarks");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto text-center py-20">
          <Heart className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">
            Sign in to view saved trips
          </h1>
          <p className="text-muted-foreground mb-6">
            Create an account to save your favorite trips and access them
            anytime.
          </p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-warm bg-clip-text text-transparent">
                Saved Trips
              </h1>
              <p className="text-muted-foreground">
                Your collection of amazing adventures
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshBookmarks}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-3 py-1">
              <Heart className="w-4 h-4 mr-2 fill-current" />
              {bookmarks.length} saved trips
            </Badge>
            {filteredBookmarks.length !== bookmarks.length && (
              <Badge variant="outline" className="px-3 py-1">
                <Filter className="w-4 h-4 mr-2" />
                {filteredBookmarks.length} showing
              </Badge>
            )}
          </div>
        </div>

        {/* Controls */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search saved trips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Sort */}
              <Tabs
                value={sortBy}
                onValueChange={(value) => setSortBy(value as any)}
              >
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="newest" className="text-xs">
                    Newest
                  </TabsTrigger>
                  <TabsTrigger value="oldest" className="text-xs">
                    Oldest
                  </TabsTrigger>
                  <TabsTrigger value="date" className="text-xs">
                    Trip Date
                  </TabsTrigger>
                  <TabsTrigger value="destination" className="text-xs">
                    A-Z
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* View Mode */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-white shadow-sm" : ""}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-white shadow-sm" : ""}
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading saved trips...</p>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-4">
              {searchTerm ? "No trips match your search" : "No saved trips yet"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start exploring and save trips you're interested in!"}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate("/discover")}>
                Discover Trips
              </Button>
            )}
          </div>
        ) : (
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {filteredBookmarks.map((bookmark) => {
              if (!bookmark.trips) return null;

              const trip = bookmark.trips;
              const enhancedTrip = {
                id: trip.id,
                destination: trip.destination,
                startDate: trip.start_date,
                endDate: trip.end_date,
                startCity: trip.start_city,
                description: trip.description || "No description provided.",
                creator: {
                  name: trip.profiles?.full_name || "A Wanderer",
                  avatar: trip.profiles?.avatar_url || "",
                  rating: 4.8,
                  verificationBadges: ["verified"],
                  isHost: true,
                },
                vibe: trip.travel_style || ["Adventure"],
                groupSize: {
                  current: trip.current_participants,
                  max: trip.max_participants,
                },
                interestedCount: trip.current_participants,
                price: {
                  amount: trip.budget_per_person || 0,
                  currency: "INR",
                },
                isFemaleOnly: false,
                isInstantJoin: true,
                postedAt: trip.start_date,
                bookmarkedAt: bookmark.bookmarked_at,
              };

              return (
                <div key={bookmark.id} className="relative">
                  {/* Bookmark Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <BookmarkButton
                      tripId={trip.id}
                      isBookmarked={true}
                      onToggle={toggleBookmark}
                      variant="heart"
                      size="md"
                    />
                  </div>

                  {/* Saved Date Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <Badge
                      variant="secondary"
                      className="bg-white/90 backdrop-blur-sm text-xs"
                    >
                      Saved{" "}
                      {new Date(bookmark.bookmarked_at).toLocaleDateString()}
                    </Badge>
                  </div>

                  <EnhancedTripCard
                    {...enhancedTrip}
                    onClick={() => handleTripClick(trip.id)}
                    onJoinClick={() => console.log("Join trip:", trip.id)}
                    onChatClick={() => console.log("Chat for trip:", trip.id)}
                    onLikeClick={() => console.log("Like trip:", trip.id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedTripsPage;
