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
      const { data, error: rpcError } = await supabase.rpc("get_recommended_trips", {
        input_user_id: user.id,
        max_results: maxResults,
      });

      if (rpcError) throw rpcError;

      setRecommendations(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load recommendations";
      setError(message);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

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
