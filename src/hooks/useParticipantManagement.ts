// src/hooks/useParticipantManagement.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

export interface TripParticipant {
  trip_id: number;
  user_id: string;
  joined_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email?: string;
  } | null;
}

export interface ParticipantStats {
  current_participants: number;
  max_participants: number;
  spots_remaining: number;
  is_full: boolean;
  referral_participants: number; // ADD THIS
}

export const useParticipantManagement = (tripId: number, user: User | null) => {
  const [participants, setParticipants] = useState<TripParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [stats, setStats] = useState<ParticipantStats>({
    current_participants: 0,
    max_participants: 8,
    spots_remaining: 8,
    is_full: false,
    referral_participants: 0, // ✅ ADD THIS
  });

  const { toast } = useToast();

  // Check if current user is a participant
  const isParticipant = useCallback(() => {
    if (!user) return false;
    return participants.some((p) => p.user_id === user.id);
  }, [participants, user]);

  // Fetch all participants for a trip
  const fetchParticipants = useCallback(async () => {
    if (!tripId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trip_participants")
        .select(
          `
          trip_id,
          user_id,
          joined_at,
          referral_code_used,
          profiles!trip_participants_user_id_fkey(
            id,
            full_name,
            avatar_url,
            email
          )
        `
        )
        .eq("trip_id", tripId)
        .order("joined_at", { ascending: true });

      if (error) throw error;

      setParticipants(data || []);

      // Fetch trip max_participants to calculate stats
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .select("max_participants,creator_id,referral_code")
        .eq("id", tripId)
        .maybeSingle();

      if (tripError) throw tripError;

      const currentCount = data?.length || 0;
      const maxCount = tripData?.max_participants || 8;

      // COUNT ONLY PARTICIPANTS WHO USED THE REFERRAL CODE (excluding creator)
      const referralCount =
        data?.filter(
          (p) =>
            p.user_id !== tripData?.creator_id &&
            p.referral_code_used === tripData?.referral_code
        ).length || 0;

      setStats({
        current_participants: currentCount,
        max_participants: maxCount,
        spots_remaining: Math.max(0, maxCount - currentCount),
        is_full: currentCount >= maxCount,
        referral_participants: referralCount, // ADD THIS
      });
    } catch (error: any) {
      toast({
        title: "Error loading participants",
        description: error.message || "Failed to load participants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [tripId, toast]);

  // Join trip
  const joinTrip = useCallback(async () => {
    if (!user || !tripId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join this trip",
        variant: "destructive",
      });
      return false;
    }

    if (stats.is_full) {
      toast({
        title: "Trip is full",
        description: "This trip has reached maximum capacity",
        variant: "destructive",
      });
      return false;
    }

    if (isParticipant()) {
      toast({
        title: "Already joined",
        description: "You've already joined this trip",
      });
      return false;
    }

    setJoinLoading(true);
    try {
      const { error } = await supabase.from("trip_participants").insert({
        trip_id: tripId,
        user_id: user.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already joined",
            description: "You've already joined this trip",
          });
          return false;
        }
        throw error;
      }

      toast({
        title: "🎉 You're in!",
        description: "Successfully joined the trip",
      });

      // Refresh participants list
      await fetchParticipants();
      return true;
    } catch (error: any) {
      toast({
        title: "Failed to join trip",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      return false;
    } finally {
      setJoinLoading(false);
    }
  }, [user, tripId, stats.is_full, isParticipant, toast, fetchParticipants]);

  // Leave trip
  const leaveTrip = useCallback(async () => {
    if (!user || !tripId) return false;

    if (!isParticipant()) {
      toast({
        title: "Not a participant",
        description: "You haven't joined this trip",
      });
      return false;
    }

    setLeaveLoading(true);
    try {
      const { error } = await supabase
        .from("trip_participants")
        .delete()
        .eq("trip_id", tripId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Left trip",
        description: "You have left this trip",
      });

      // Refresh participants list
      await fetchParticipants();
      return true;
    } catch (error: any) {
      toast({
        title: "Failed to leave trip",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      return false;
    } finally {
      setLeaveLoading(false);
    }
  }, [user, tripId, isParticipant, toast, fetchParticipants]);

  // Remove participant (for trip creators)
  const removeParticipant = useCallback(
    async (participantUserId: string) => {
      if (!user || !tripId) return false;

      // Check if current user is trip creator
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .select("creator_id")
        .eq("id", tripId)
        .maybeSingle();

      if (tripError || !tripData || tripData.creator_id !== user.id) {
        toast({
          title: "Permission denied",
          description: "Only trip creators can remove participants",
          variant: "destructive",
        });
        return false;
      }

      try {
        const { error } = await supabase
          .from("trip_participants")
          .delete()
          .eq("trip_id", tripId)
          .eq("user_id", participantUserId);

        if (error) throw error;

        toast({
          title: "Participant removed",
          description: "Participant has been removed from the trip",
        });

        // Refresh participants list
        await fetchParticipants();
        return true;
      } catch (error: any) {
        toast({
          title: "Failed to remove participant",
          description: error.message || "Something went wrong",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, tripId, toast, fetchParticipants]
  );

  // In useParticipantManagement.ts - Enhanced real-time subscription
  // In useParticipantManagement.ts - Enhanced real-time subscription
  useEffect(() => {
    if (!tripId) return;

    fetchParticipants();

    // ✅ CRITICAL: Subscribe to trip_participants changes
    const participantSubscription = supabase
      .channel(`trip_participants_${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "trip_participants",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          setTimeout(() => {
            fetchParticipants();
          }, 200); // Small delay to ensure database consistency
        }
      )
      .subscribe();

    // ✅ ALSO listen to join request approvals
    const requestSubscription = supabase
      .channel(`join_requests_${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trip_join_requests",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          if (
            payload.new?.status === "approved" &&
            payload.old?.status === "pending"
          ) {
            setTimeout(() => {
              fetchParticipants();
            }, 500); // Longer delay for trigger to complete
          }
        }
      )
      .subscribe();

    return () => {
      participantSubscription.unsubscribe();
      requestSubscription.unsubscribe();
    };
  }, [tripId, fetchParticipants]);

  return {
    participants,
    stats,
    loading,
    joinLoading,
    leaveLoading,
    isParticipant: isParticipant(),
    joinTrip,
    leaveTrip,
    removeParticipant,
    refetchParticipants: fetchParticipants,
  };
};
