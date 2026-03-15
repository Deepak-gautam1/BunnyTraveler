// src/hooks/useTrendingCommunities.ts
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TrendingCommunity {
  id: string;
  name: string;
  emoji: string;
  members: number;
  growth: string;
  slug: string;
  description?: string;
}

export const useTrendingCommunities = () => {
  const [communities, setCommunities] = useState<TrendingCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingCommunities = async () => {
      try {


        // Get communities with member counts
        const { data, error } = await supabase
          .from("communities")
          .select(
            `
            id,
            name,
            emoji,
            slug,
            description,
            community_members(count)
          `
          )
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Transform data and calculate growth
        const transformedData: TrendingCommunity[] = (data || []).map(
          (community) => {
            const memberCount = community.community_members?.[0]?.count || 0;

            // Calculate mock growth percentage (you can make this real later)
            const growthPercent = Math.floor(Math.random() * 25) + 10; // 10-35%

            return {
              id: community.id,
              name: community.name,
              emoji: community.emoji,
              members: memberCount,
              growth: `+${growthPercent}%`,
              slug: community.slug,
              description: community.description,
            };
          }
        );


        setCommunities(transformedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingCommunities();
  }, []);

  return { communities, loading, error };
};
