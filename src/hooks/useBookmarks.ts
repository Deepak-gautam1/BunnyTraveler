// src/hooks/useBookmarks.ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface Bookmark {
  id: number;
  user_id: string;
  trip_id: number;
  bookmarked_at: string;
  trips?: {
    id: number;
    destination: string;
    start_city: string;
    start_date: string;
    end_date: string;
    description: string;
    budget_per_person: number;
    travel_style: string[];
    max_participants: number;
    current_participants: number;
    profiles: {
      full_name: string;
      avatar_url: string;
    };
  };
}

export const useBookmarks = (user: User | null) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarkedTripIds, setBookmarkedTripIds] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch user's bookmarks
  const fetchBookmarks = async () => {
    if (!user) {
      setBookmarks([]);
      setBookmarkedTripIds(new Set());
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trip_bookmarks")
        .select(
          `
          id,
          user_id,
          trip_id,
          bookmarked_at,
          trips (
            id,
            destination,
            start_city,
            start_date,
            end_date,
            description,
            budget_per_person,
            travel_style,
            max_participants,
            current_participants,
            profiles:creator_id (
              full_name,
              avatar_url
            )
          )
        `
        )
        .eq("user_id", user.id)
        .order("bookmarked_at", { ascending: false });

      if (error) throw error;

      const bookmarksData = data as Bookmark[];
      setBookmarks(bookmarksData);

      // Create a Set of bookmarked trip IDs for quick lookup
      const tripIds = new Set(bookmarksData.map((b) => b.trip_id));
      setBookmarkedTripIds(tripIds);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      toast({
        title: "Error loading bookmarks",
        description: "Failed to load your saved trips",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add bookmark
  const addBookmark = async (tripId: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save trips",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase.from("trip_bookmarks").insert({
        user_id: user.id,
        trip_id: tripId,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already saved!",
            description: "This trip is already in your saved list",
            variant: "default",
          });
          return false;
        }
        throw error;
      }

      // Update local state
      setBookmarkedTripIds((prev) => new Set([...prev, tripId]));

      toast({
        title: "💾 Trip saved!",
        description: "Added to your saved trips",
      });

      // Refresh bookmarks to get complete data
      fetchBookmarks();
      return true;
    } catch (error) {
      console.error("Error adding bookmark:", error);
      toast({
        title: "Error saving trip",
        description: "Failed to save trip. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Remove bookmark
  const removeBookmark = async (tripId: number) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("trip_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("trip_id", tripId);

      if (error) throw error;

      // Update local state
      setBookmarkedTripIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(tripId);
        return newSet;
      });

      setBookmarks((prev) => prev.filter((b) => b.trip_id !== tripId));

      toast({
        title: "Trip removed",
        description: "Removed from your saved trips",
      });

      return true;
    } catch (error) {
      console.error("Error removing bookmark:", error);
      toast({
        title: "Error removing trip",
        description: "Failed to remove trip. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Toggle bookmark
  const toggleBookmark = async (tripId: number) => {
    const isBookmarked = bookmarkedTripIds.has(tripId);

    if (isBookmarked) {
      return await removeBookmark(tripId);
    } else {
      return await addBookmark(tripId);
    }
  };

  // Check if trip is bookmarked
  const isBookmarked = (tripId: number) => {
    return bookmarkedTripIds.has(tripId);
  };

  // Get bookmark count for a trip
  const getBookmarkCount = async (tripId: number) => {
    try {
      const { count, error } = await supabase
        .from("trip_bookmarks")
        .select("*", { count: "exact", head: true })
        .eq("trip_id", tripId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error getting bookmark count:", error);
      return 0;
    }
  };

  // Load bookmarks when user changes
  useEffect(() => {
    fetchBookmarks();
  }, [user?.id]);

  return {
    bookmarks,
    bookmarkedTripIds,
    loading,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    getBookmarkCount,
    refreshBookmarks: fetchBookmarks,
  };
};
