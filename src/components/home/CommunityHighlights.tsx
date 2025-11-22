import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Quote,
  Star,
  Verified,
  Loader2,
  Camera,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTrendingCommunities } from "@/hooks/useTrendingCommunities";
import Footer from "../layout/Footer";

// Types for our testimonials
interface Testimonial {
  id: string;
  comment: string;
  rating: number;
  created_at: string;
  photo_urls: string[];
  photo_count: number;
  user: {
    id: string;
    full_name: string | null;
    avatar_url?: string | null;
  };
  trip: {
    id: number;
    destination: string;
  };
}
import { useNavigate } from "react-router-dom"; // ✅ ADD THIS IMPORT

const CommunityHighlights = () => {
  // State for dynamic testimonials
  const navigator = useNavigate();

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ NEW: Pagination states
  const [displayCount, setDisplayCount] = useState(2); // Show 2 by default
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // ✅ NEW: Fetch dynamic communities
  const {
    communities: trendingCommunities,
    loading: communitiesLoading,
    error: communitiesError,
  } = useTrendingCommunities();

  // ✅ UPDATED: Fetch testimonials with pagination support
  const fetchTestimonials = async (limit: number = 2) => {
    try {
      console.log(`🔄 Fetching ${limit} testimonials from database...`);

      const { data, error, count } = await supabase
        .from("trip_reviews")
        .select(
          `
          id,
          comment,
          rating,
          created_at,
          photo_urls,
          photo_count,
          profiles!trip_reviews_user_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          trips!trip_reviews_trip_id_fkey (
            id,
            destination
          )
        `,
          { count: "exact" } // ✅ Get total count
        )
        .gte("rating", 4) // Only fetch 4-5 star reviews for success stories
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("❌ Error fetching testimonials:", error);
        throw error;
      }

      console.log("✅ Raw testimonials data:", data);
      console.log("📊 Total testimonials count:", count);

      // Transform data to match our interface
      const transformedData: Testimonial[] = (data || []).map((item) => ({
        id: item.id,
        comment: item.comment,
        rating: item.rating,
        created_at: item.created_at,
        photo_urls: item.photo_urls || [],
        photo_count: item.photo_count || 0,
        user: {
          id: item.profiles?.id || "",
          full_name: item.profiles?.full_name || "Anonymous",
          avatar_url: item.profiles?.avatar_url,
        },
        trip: {
          id: item.trips?.id || 0,
          destination: item.trips?.destination || "Unknown Destination",
        },
      }));

      setTestimonials(transformedData);
      setTotalCount(count || 0);
      console.log("✅ Transformed testimonials:", transformedData);
    } catch (err: any) {
      console.error("❌ Failed to fetch testimonials:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // ✅ Initial fetch
  useEffect(() => {
    fetchTestimonials(displayCount);
  }, []);

  // ✅ NEW: Load more testimonials
  const handleLoadMore = async () => {
    setLoadingMore(true);
    const newCount = displayCount + 3; // Load 3 more at a time
    setDisplayCount(newCount);
    await fetchTestimonials(newCount);
  };

  // ✅ NEW: Show less testimonials
  const handleShowLess = () => {
    setDisplayCount(2);
    fetchTestimonials(2);
  };

  // ✅ NEW: Check if there are more testimonials to load
  const hasMoreTestimonials = displayCount < totalCount;
  const showingMoreThanDefault = displayCount > 2;

  return (
    <div className="space-y-6">
      {/* Success Stories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span>Success Stories</span>
          </h3>
          <Badge variant="outline" className="text-xs">
            {loading ? "Loading..." : `${totalCount} experiences`}
          </Badge>
        </div>

        <div className="space-y-3">
          {loading ? (
            // Loading state
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading success stories...
              </span>
            </div>
          ) : error ? (
            // Error state
            <Card className="border-red-200">
              <CardContent className="p-4">
                <p className="text-sm text-red-600">
                  Unable to load success stories: {error}
                </p>
              </CardContent>
            </Card>
          ) : testimonials.length === 0 ? (
            // Empty state
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No success stories yet. Be the first to share your experience!
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Real testimonials from database with photos */}
              {testimonials.map((testimonial, index) => (
                <Card
                  key={testimonial.id}
                  className={`border-l-4 border-l-accent ${
                    index >= 2 ? "animate-fade-in" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Quote className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                      <div className="flex-1 space-y-3">
                        <p className="text-sm italic">
                          "{testimonial.comment}"
                        </p>

                        {/* Photo Gallery */}
                        {testimonial.photo_urls.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Camera className="w-3 h-3" />
                              <span>
                                {testimonial.photo_count} photo
                                {testimonial.photo_count > 1 ? "s" : ""}
                              </span>
                            </div>
                            <div
                              className={`grid gap-2 ${
                                testimonial.photo_urls.length === 1
                                  ? "grid-cols-1 max-w-[200px]"
                                  : "grid-cols-2 max-w-[300px]"
                              }`}
                            >
                              {testimonial.photo_urls.map(
                                (photoUrl, photoIndex) => (
                                  <div
                                    key={photoIndex}
                                    className="relative overflow-hidden rounded-lg bg-muted aspect-[4/3] cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() =>
                                      window.open(photoUrl, "_blank")
                                    }
                                  >
                                    <img
                                      src={photoUrl}
                                      alt={`Trip photo ${photoIndex + 1}`}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                      style={{
                                        maxWidth: "200px",
                                        maxHeight: "150px",
                                      }}
                                      onError={(e) => {
                                        console.error(
                                          "Failed to load image:",
                                          photoUrl
                                        );
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              {testimonial.user.avatar_url ? (
                                <AvatarImage
                                  src={testimonial.user.avatar_url}
                                  alt={testimonial.user.full_name || "User"}
                                />
                              ) : (
                                <AvatarFallback className="text-xs bg-earth-sand text-earth-terracotta">
                                  {testimonial.user.full_name
                                    ?.charAt(0)
                                    .toUpperCase() || "U"}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs font-medium">
                                {testimonial.user.full_name || "Anonymous"}
                              </span>
                              <Verified className="w-3 h-3 text-accent" />
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: testimonial.rating }).map(
                              (_, i) => (
                                <Star
                                  key={i}
                                  className="w-3 h-3 fill-yellow-400 text-yellow-400"
                                />
                              )
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs w-fit">
                            {testimonial.trip.destination} trip
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(
                              testimonial.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* ✅ NEW: Load More / Show Less Buttons */}
              <div className="flex justify-center space-x-3 pt-4">
                {hasMoreTestimonials && (
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    variant="outline"
                    size="sm"
                    className="text-accent border-accent hover:bg-accent hover:text-white"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        See More Stories ({totalCount - displayCount} more)
                      </>
                    )}
                  </Button>
                )}

                {showingMoreThanDefault && (
                  <Button
                    onClick={handleShowLess}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                  >
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show Less
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ✅ UPDATED: Dynamic Trending Communities */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <span className="text-accent">🔥</span>
          <span>Trending Communities</span>
          {communitiesLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </h3>

        {communitiesError ? (
          <Card className="border-red-200">
            <CardContent className="p-4">
              <p className="text-sm text-red-600">
                Unable to load communities: {communitiesError}
              </p>
            </CardContent>
          </Card>
        ) : communitiesLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-muted rounded"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-2 bg-muted rounded w-3/4"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {trendingCommunities.map((community) => (
              <Card
                key={community.id}
                className="cursor-pointer hover-scale hover:shadow-md transition-all"
                onClick={() => navigator(`/community/${community.slug}`)}
              >
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{community.emoji}</span>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium leading-tight">
                          {community.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {community.members.toLocaleString()} members
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-50 text-green-700 border-green-200"
                    >
                      {community.growth} this month
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CommunityHighlights;
