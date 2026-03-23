import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, User, ExternalLink, Loader2 } from "lucide-react";
import { formatDistanceToNow, isValid, parseISO } from "date-fns";

import type { DbProfile } from "@/types/database";

type ProfileData = DbProfile & {
  trips_joined_count?: number;
  trips_created_count?: number;
};

interface ProfileHoverCardProps {
  userId: string;
  children: React.ReactNode;
  className?: string;
}

// ✅ GLOBAL CACHE to prevent duplicate API calls
const profileCache = new Map<string, ProfileData>();
const pendingRequests = new Set<string>();

const ProfileHoverCard = ({
  userId,
  children,
  className,
}: ProfileHoverCardProps) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Safe date formatting
  const formatJoinDate = useCallback((dateString: string | null): string => {
    if (!dateString) return "Recently joined";

    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return formatDistanceToNow(date, { addSuffix: true });
      }
    } catch {
      // silently fall through to default
    }

    return "Recently joined";
  }, []);

  // ✅ OPTIMIZED: Fetch profile data with caching and debouncing
  const fetchProfileData = useCallback(async () => {
    if (!userId || !isMountedRef.current) return;

    // Check cache first
    if (profileCache.has(userId)) {
      const cachedProfile = profileCache.get(userId);
      if (isMountedRef.current) {
        setProfile(cachedProfile!);
      }
      return;
    }

    // Prevent duplicate requests
    if (pendingRequests.has(userId)) return;

    pendingRequests.add(userId);
    setLoading(true);

    try {
      // ✅ OPTIMIZED: Single query with all data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError || !isMountedRef.current) return;

      // ✅ OPTIMIZED: Batch count queries
      const [{ count: tripsJoinedCount }, { count: tripsCreatedCount }] =
        await Promise.all([
          supabase
            .from("trip_participants")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId),
          supabase
            .from("trips")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", userId),
        ]);

      if (!isMountedRef.current) return;

      const enrichedProfile: ProfileData = {
        ...profileData,
        trips_joined_count: tripsJoinedCount || 0,
        trips_created_count: tripsCreatedCount || 0,
      };

      // ✅ Cache the result
      profileCache.set(userId, enrichedProfile);
      setProfile(enrichedProfile);
    } catch {
      // silently fail — handled by loading state
    } finally {
      pendingRequests.delete(userId);
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  // ✅ DEBOUNCED: Only fetch after hover delay
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);

      if (open && !profile && !loading) {
        // ✅ Debounce the fetch to prevent rapid hover calls
        fetchTimeoutRef.current = setTimeout(() => {
          fetchProfileData();
        }, 300); // 300ms delay
      } else if (!open && fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    },
    [profile, loading, fetchProfileData]
  );

  const handleViewProfile = useCallback(() => {
    window.open(`/profile/${userId}`, "_blank");
  }, [userId]);

  return (
    <HoverCard open={isOpen} onOpenChange={handleOpenChange}>
      <HoverCardTrigger asChild className={className}>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">
              Loading profile...
            </span>
          </div>
        ) : profile ? (
          <div className="space-y-4">
            {/* Profile Header */}
            <div className="flex items-start space-x-3">
              <Avatar className="w-12 h-12">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} />
                ) : (
                  <AvatarFallback>
                    {profile.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">
                  {profile.full_name || "Travel Enthusiast"}
                </h4>

                {profile.tagline ? (
                  <p className="text-xs text-blue-600 font-medium">
                    {profile.tagline}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    New to SafarSquad
                  </p>
                )}

                {profile.home_city ? (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {profile.home_city}
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3 mr-1 opacity-50" />
                    <span className="italic">Location not shared</span>
                  </div>
                )}

                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  Joined {formatJoinDate(profile.created_at)}
                </div>
              </div>
            </div>

            {/* Bio section */}
            {profile.bio ? (
              <div className="text-sm text-muted-foreground">
                <p className="line-clamp-2">{profile.bio}</p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg text-center">
                <User className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="italic">
                  This traveler hasn't shared their story yet
                </p>
              </div>
            )}

            {/* Trip Stats */}
            <div className="flex space-x-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {profile.trips_joined_count ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Trips Joined
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {profile.trips_created_count ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Trips Created
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1">
              {(profile.trips_created_count ?? 0) > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Trip Creator
                </Badge>
              )}
              {(profile.trips_joined_count ?? 0) > 5 && (
                <Badge variant="outline" className="text-xs">
                  Explorer
                </Badge>
              )}
              {(profile.trips_joined_count ?? 0) > 10 && (
                <Badge
                  variant="outline"
                  className="text-xs border-yellow-400 text-yellow-600"
                >
                  Adventure Seeker
                </Badge>
              )}
              {(profile.trips_joined_count ?? 0) === 0 &&
                (profile.trips_created_count ?? 0) === 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs border-green-400 text-green-600"
                  >
                    New Explorer
                  </Badge>
                )}
            </div>

            {/* Website section */}
            {profile.website && (
              <div className="text-sm">
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Visit Website
                </a>
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={handleViewProfile}
              className="w-full"
              size="sm"
              variant={
                profile.bio || profile.tagline || profile.website
                  ? "default"
                  : "outline"
              }
            >
              <ExternalLink className="w-3 h-3 mr-2" />
              {profile.bio || profile.tagline || profile.website
                ? "View Full Profile"
                : "Learn More About This Traveler"}
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">Profile not found</p>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

export default ProfileHoverCard;
