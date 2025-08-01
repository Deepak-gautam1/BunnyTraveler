// src/hooks/useRecommendations.ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface RecommendedTrip {
  trip_id: number;
  destination: string;
  start_city: string;
  start_date: string;
  end_date: string;
  description: string;
  budget_per_person: number;
  travel_style: string[];
  max_participants: number;
  current_participants: number;
  creator_name: string;
  creator_avatar: string;
  recommendation_score: number;
}

export const useRecommendations = (user: User | null) => {
  const [recommendations, setRecommendations] = useState<RecommendedTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async (maxResults: number = 6) => {
    if (!user) {
      setRecommendations([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching recommendations for user:", user.id);

      // ✅ FIXED: Use correct parameter names matching your database function
      const { data, error } = await supabase.rpc("get_recommended_trips", {
        input_user_id: user.id, // ✅ FIXED: Changed from target_user_id to input_user_id
        max_results: maxResults, // ✅ FIXED: This matches your function parameter
      });

      if (error) {
        console.error("Supabase RPC error:", error);
        throw error;
      }

      console.log("Recommendations received:", data);
      setRecommendations(data || []);
    } catch (err: any) {
      console.error("Error fetching recommendations:", err);
      setError(err.message || "Failed to load recommendations");
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on user change
  useEffect(() => {
    fetchRecommendations();
  }, [user?.id]);

  return {
    recommendations,
    loading,
    error,
    refreshRecommendations: fetchRecommendations,
  };
};
