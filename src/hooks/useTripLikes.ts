// src/hooks/useTripLikes.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

export const useTripLikes = (user: User | null) => {
  const [likedTripIds, setLikedTripIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch user's liked trips
  const fetchLikedTrips = useCallback(async () => {
    if (!user) {
      setLikedTripIds(new Set());
      return;
    }

    try {
      const { data, error } = await supabase
        .from("trip_likes")
        .select("trip_id")
        .eq("user_id", user.id);

      if (error) throw error;

      const tripIds = new Set(data.map((like) => like.trip_id));
      setLikedTripIds(tripIds);
    } catch {
      // silently fail
    }
  }, [user]);

  useEffect(() => {
    fetchLikedTrips();
  }, [fetchLikedTrips]);

  // Check if trip is liked
  const isLiked = useCallback(
    (tripId: number) => {
      return likedTripIds.has(tripId);
    },
    [likedTripIds]
  );

  // In useTripLikes.ts - make sure it returns boolean properly
  const toggleLike = async (tripId: number): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to like trips",
        variant: "destructive",
      });
      return false;
    }

    const isCurrentlyLiked = isLiked(tripId);

    try {
      if (isCurrentlyLiked) {
        // Unlike
        const { error: deleteError } = await supabase
          .from("trip_likes")
          .delete()
          .eq("trip_id", tripId)
          .eq("user_id", user.id);

        if (deleteError) throw deleteError;

        setLikedTripIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tripId);
          return newSet;
        });

        toast({
          title: "Removed from favorites",
          description: "Trip removed from your interested list",
        });

        return false; // Now unliked
      } else {
        // Like
        const { error: insertError } = await supabase
          .from("trip_likes")
          .insert({
            trip_id: tripId,
            user_id: user.id,
          });

        if (insertError) {
          if (insertError.code === "23505") {
            toast({
              title: "Already liked!",
              description: "You've already liked this trip",
            });
            setLikedTripIds((prev) => new Set([...prev, tripId]));
            return true;
          }
          throw insertError;
        }

        setLikedTripIds((prev) => new Set([...prev, tripId]));

        toast({
          title: "Added to favorites! ❤️",
          description: "Trip added to your interested list",
        });

        return true; // Now liked
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
      return isCurrentlyLiked;
    }
  };

  return {
    likedTripIds,
    isLiked,
    toggleLike,
    refreshLikes: fetchLikedTrips,
    loading,
  };
};
