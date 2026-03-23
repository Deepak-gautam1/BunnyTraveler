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
      const { count: travelersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });



      // 2. Get total number of trips (all statuses)
      const { count: tripsCount } = await supabase
        .from("trips")
        .select("*", { count: "exact", head: true });



      // 3. Get unique destinations from trips table
      const { data: tripsData } = await supabase
        .from("trips")
        .select("destination");



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
        const totalRating = reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0);
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


    } catch {
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
        () => {
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
        () => {
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
        () => {
          fetchStats();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(tripsChannel);
      supabase.removeChannel(reviewsChannel);
    };
  }, []);

  return stats;
};
