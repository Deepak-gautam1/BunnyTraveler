import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import type { DbRecommendedTrip } from "@/types/database";

// Re-export for consumers
export type { DbRecommendedTrip as RecommendedTrip };

export const useRecommendations = (user: User | null) => {
  const [recommendations, setRecommendations] = useState<DbRecommendedTrip[]>([]);
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
      setRecommendations(data ?? []);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    recommendations,
    loading,
    error,
    refreshRecommendations: fetchRecommendations,
  };
};
