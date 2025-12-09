// src/hooks/useFooterStats.ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FooterStats {
  totalTravelers: number;
  totalTrips: number;
  uniqueDestinations: number;
  averageRating: number;
  loading: boolean;
}

export const useFooterStats = () => {
  const [stats, setStats] = useState<FooterStats>({
    totalTravelers: 0,
    totalTrips: 0,
    uniqueDestinations: 0,
    averageRating: 4.8,
    loading: true,
  });

  const fetchStats = async () => {
    try {
      // 1. Get total number of registered travelers (profiles table)
      const { count: travelersCount, error: travelersError } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      if (travelersError) {
        console.error("Error fetching travelers count:", travelersError);
      }

      // 2. Get total number of trips (all statuses)
      const { count: tripsCount, error: tripsError } = await supabase
        .from("trips")
        .select("*", { count: "exact", head: true });

      if (tripsError) {
        console.error("Error fetching trips count:", tripsError);
      }

      // 3. Get unique destinations from trips table
      const { data: tripsData, error: destinationsError } = await supabase
        .from("trips")
        .select("destination");

      if (destinationsError) {
        console.error("Error fetching destinations:", destinationsError);
      }

      // Count unique destinations (case-insensitive, trimmed)
      const uniqueDestinations = tripsData
        ? new Set(
            tripsData
              .map((trip) => trip.destination.toLowerCase().trim())
              .filter((dest) => dest.length > 0)
          ).size
        : 0;

      // 4. Get average rating from trip reviews (if exists)
      const { data: reviews, error: reviewsError } = await supabase
        .from("trip_reviews")
        .select("rating");

      let avgRating = 4.8; // Default rating

      if (!reviewsError && reviews && reviews.length > 0) {
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        avgRating = totalRating / reviews.length;
      }

      const newStats = {
        totalTravelers: travelersCount || 0,
        totalTrips: tripsCount || 0,
        uniqueDestinations: uniqueDestinations,
        averageRating: parseFloat(avgRating.toFixed(1)),
        loading: false,
      };

      setStats(newStats);

      console.log("📊 Footer stats updated:", {
        travelers: travelersCount,
        trips: tripsCount,
        destinations: uniqueDestinations,
        rating: avgRating.toFixed(1),
      });
    } catch (error) {
      console.error("Error fetching footer stats:", error);
      // Set default fallback values on error
      setStats({
        totalTravelers: 0,
        totalTrips: 0,
        uniqueDestinations: 0,
        averageRating: 4.8,
        loading: false,
      });
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // 🔴 Real-time subscription for profiles (new travelers)
    const profilesChannel = supabase
      .channel("footer_profiles_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          console.log("🔴 New traveler registered:", payload.new);
          fetchStats();
        }
      )
      .subscribe();

    // 🔴 Real-time subscription for trips (new trips or updates)
    const tripsChannel = supabase
      .channel("footer_trips_updates")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "trips",
        },
        (payload) => {
          console.log("🔴 Trip event detected:", payload.eventType);
          fetchStats();
        }
      )
      .subscribe();

    // 🔴 Real-time subscription for reviews (rating updates)
    const reviewsChannel = supabase
      .channel("footer_reviews_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trip_reviews",
        },
        (payload) => {
          console.log("🔴 New review added:", payload.new);
          fetchStats();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      console.log("🔴 Cleaning up footer stats subscriptions");
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(tripsChannel);
      supabase.removeChannel(reviewsChannel);
    };
  }, []);

  return stats;
};
