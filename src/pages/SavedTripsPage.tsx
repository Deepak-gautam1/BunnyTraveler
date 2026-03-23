import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBookmarks } from "@/hooks/useBookmarks";
import EnhancedTripCard from "@/components/home/EnhancedTripCard";
import { setCookie, getCookie, COOKIE_KEYS } from "@/lib/cookies";
import { Heart, Search, Filter, Grid, List, RefreshCw } from "lucide-react";

type SortOption = "newest" | "oldest" | "date" | "destination";
type ViewMode  = "grid" | "list";

interface SavedTripsPageProps {
  user: User | null;
}

const SavedTripsPage = ({ user }: SavedTripsPageProps) => {
  const navigate  = useNavigate();
  const { bookmarks, loading, toggleBookmark, refreshBookmarks } = useBookmarks(user);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy]   = useState<SortOption>(() => getCookie<SortOption>(COOKIE_KEYS.BOOKMARKS_SORT) ?? "newest");
  const [viewMode, setViewMode] = useState<ViewMode>(() => getCookie<ViewMode>(COOKIE_KEYS.BOOKMARKS_VIEW) ?? "list");

  useEffect(() => { setCookie(COOKIE_KEYS.BOOKMARKS_SORT, sortBy, 30); }, [sortBy]);
  useEffect(() => { setCookie(COOKIE_KEYS.BOOKMARKS_VIEW, viewMode, 30); }, [viewMode]);

  const filteredBookmarks = bookmarks
    .filter((bookmark) => {
      if (!bookmark.trips) return false;
      const q = searchTerm.toLowerCase();
      return (
        bookmark.trips.destination.toLowerCase().includes(q) ||
        bookmark.trips.start_city.toLowerCase().includes(q) ||
        (bookmark.trips.description?.toLowerCase().includes(q) ?? false)
      );
    })
    .sort((a, b) => {
      if (!a.trips || !b.trips) return 0;
      switch (sortBy) {
        case "oldest":
          return new Date(a.bookmarked_at ?? 0).getTime() - new Date(b.bookmarked_at ?? 0).getTime();
        case "date":
          return new Date(a.trips.start_date).getTime() - new Date(b.trips.start_date).getTime();
        case "destination":
          return a.trips.destination.localeCompare(b.trips.destination);
        default:
          return new Date(b.bookmarked_at ?? 0).getTime() - new Date(a.bookmarked_at ?? 0).getTime();
      }
    });

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto text-center py-20">
          <Heart className="w-16 h-16 mx-auto mb-6 text-muted-foreground" aria-hidden="true" />
          <h1 className="text-2xl font-bold mb-4">Sign in to view saved trips</h1>
          <p className="text-muted-foreground mb-6">
            Create an account to save your favourite trips and access them anytime.
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
              <p className="text-muted-foreground">Your collection of amazing adventures</p>
            </div>
            <Button variant="outline" size="sm" onClick={refreshBookmarks} disabled={loading} aria-label="Refresh saved trips">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-3 py-1">
              <Heart className="w-4 h-4 mr-2 fill-current" aria-hidden="true" />
              {bookmarks.length} saved trips
            </Badge>
            {filteredBookmarks.length !== bookmarks.length && (
              <Badge variant="outline" className="px-3 py-1">
                <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
                {filteredBookmarks.length} showing
              </Badge>
            )}
          </div>
        </div>

        {/* Controls */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden="true" />
              <Input
                placeholder="Search saved trips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                aria-label="Search saved trips"
              />
            </div>

            <div className="flex items-center gap-2">
              <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="newest" className="text-xs">Newest</TabsTrigger>
                  <TabsTrigger value="oldest" className="text-xs">Oldest</TabsTrigger>
                  <TabsTrigger value="date" className="text-xs">Trip Date</TabsTrigger>
                  <TabsTrigger value="destination" className="text-xs">A-Z</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center bg-muted rounded-lg p-1" role="group" aria-label="View mode">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                >
                  <List className="w-4 h-4" aria-hidden="true" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                >
                  <Grid className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20" role="status" aria-live="polite">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4" aria-hidden="true" />
            <p className="text-muted-foreground">Loading saved trips...</p>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 mx-auto mb-6 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-xl font-semibold mb-4">
              {searchTerm ? "No trips match your search" : "No saved trips yet"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start exploring and save trips you're interested in!"}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate("/discover")}>Discover Trips</Button>
            )}
          </div>
        ) : (
          <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {filteredBookmarks.map((bookmark) => {
              if (!bookmark.trips) return null;
              const trip = bookmark.trips;
              return (
                <div key={bookmark.id} className="relative">
                  <div className="absolute top-4 left-4 z-10">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-xs">
                      Saved {bookmark.bookmarked_at ? new Date(bookmark.bookmarked_at).toLocaleDateString() : ""}
                    </Badge>
                  </div>
                  <EnhancedTripCard
                    id={trip.id}
                    destination={trip.destination}
                    startDate={trip.start_date}
                    endDate={trip.end_date}
                    startCity={trip.start_city}
                    description={trip.description ?? "No description provided."}
                    creator={{
                      id: "unknown",
                      name: trip.profiles?.full_name ?? "A Wanderer",
                      avatar: trip.profiles?.avatar_url ?? "",
                      rating: 4.8,
                      verificationBadges: ["verified"],
                      isHost: true,
                    }}
                    vibe={trip.travel_style ?? ["Adventure"]}
                    groupSize={{ current: trip.current_participants ?? 0, max: trip.max_participants ?? 0 }}
                    interestedCount={trip.current_participants ?? 0}
                    status="planning"
                    isFemaleOnly={false}
                    isInstantJoin={true}
                    postedAt={trip.start_date}
                    isBookmarked={true}
                    isLiked={false}
                    onClick={() => navigate(`/trip/${trip.id}`)}
                    onChatClick={() => {}}
                    onLikeClick={() => {}}
                    onBookmarkClick={() => toggleBookmark(trip.id)}
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
