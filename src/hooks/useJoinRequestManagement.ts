// src/hooks/useJoinRequestManagement.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

export interface JoinRequest {
  id: number;
  trip_id: number;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  message: string | null;
  requested_at: string;
  responded_at: string | null;
  responded_by: string | null;
  response_message: string | null;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// ✅ UPDATED: Added onTripDataRefresh parameter
export const useJoinRequestManagement = (
  tripId: number,
  user: User | null,
  onTripDataRefresh?: () => Promise<void> // ✅ NEW: Optional callback to refresh trip data
) => {
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [userRequest, setUserRequest] = useState<JoinRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [responseLoading, setResponseLoading] = useState(false);
  const { toast } = useToast();

  // Fetch join requests for trip creators
  const fetchJoinRequests = useCallback(async () => {
    if (!tripId || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trip_join_requests")
        .select(
          `
          *,
          profiles!trip_join_requests_user_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .eq("trip_id", tripId)
        .order("requested_at", { ascending: false });

      if (error) throw error;

      setJoinRequests(data || []);

      // Find current user's request if exists
      const currentUserRequest = data?.find((req) => req.user_id === user.id);
      setUserRequest(currentUserRequest || null);
    } catch (error: any) {
      console.error("Error fetching join requests:", error);
      toast({
        title: "Error loading join requests",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [tripId, user, toast]);

  // Send join request
  const sendJoinRequest = useCallback(
    async (message?: string) => {
      if (!user || !tripId) {
        toast({
          title: "Authentication required",
          description: "Please sign in to request to join this trip",
          variant: "destructive",
        });
        return false;
      }

      setRequestLoading(true);
      try {
        const { error } = await supabase.from("trip_join_requests").insert({
          trip_id: tripId,
          user_id: user.id,
          message: message || null,
          status: "pending",
        });

        if (error) {
          if (error.code === "23505") {
            toast({
              title: "Request already sent",
              description: "You've already requested to join this trip",
            });
            return false;
          }
          throw error;
        }

        toast({
          title: "Request sent! 📩",
          description: "Your join request has been sent to the trip creator",
        });

        await fetchJoinRequests();
        return true;
      } catch (error: any) {
        console.error("Error sending join request:", error);
        toast({
          title: "Failed to send request",
          description: error.message,
          variant: "destructive",
        });
        return false;
      } finally {
        setRequestLoading(false);
      }
    },
    [user, tripId, toast, fetchJoinRequests]
  );

  // ✅ UPDATED: Approve join request with trip data refresh
  // In useJoinRequestManagement.ts - Enhanced approveRequest
  const approveRequest = useCallback(
    async (requestId: number, responseMessage?: string) => {
      if (!user) return false;

      setResponseLoading(true);
      try {
        const { error } = await supabase
          .from("trip_join_requests")
          .update({
            status: "approved",
            responded_at: new Date().toISOString(),
            responded_by: user.id,
            response_message: responseMessage || null,
          })
          .eq("id", requestId);

        if (error) throw error;

        toast({
          title: "Request approved! ✅",
          description: "The user has been added to your trip",
        });

        // ✅ CRITICAL: Multiple refresh strategy
        await fetchJoinRequests();

        // ✅ Refresh trip data immediately
        if (onTripDataRefresh) {
          await onTripDataRefresh();
        }

        // ✅ Additional refresh after delay to ensure trigger completed
        setTimeout(async () => {
          if (onTripDataRefresh) {
            await onTripDataRefresh();
          }
        }, 1000);

        return true;
      } catch (error: any) {
        console.error("Error approving request:", error);
        toast({
          title: "Failed to approve request",
          description: error.message,
          variant: "destructive",
        });
        return false;
      } finally {
        setResponseLoading(false);
      }
    },
    [user, toast, fetchJoinRequests, onTripDataRefresh]
  );

  // Reject join request
  const rejectRequest = useCallback(
    async (requestId: number, responseMessage?: string) => {
      if (!user) return false;

      setResponseLoading(true);
      try {
        const { error } = await supabase
          .from("trip_join_requests")
          .update({
            status: "rejected",
            responded_at: new Date().toISOString(),
            responded_by: user.id,
            response_message: responseMessage || null,
          })
          .eq("id", requestId);

        if (error) throw error;

        toast({
          title: "Request rejected",
          description: "The join request has been rejected",
        });

        await fetchJoinRequests();
        return true;
      } catch (error: any) {
        console.error("Error rejecting request:", error);
        toast({
          title: "Failed to reject request",
          description: error.message,
          variant: "destructive",
        });
        return false;
      } finally {
        setResponseLoading(false);
      }
    },
    [user, toast, fetchJoinRequests]
  );

  // Cancel own join request
  const cancelRequest = useCallback(async () => {
    if (!user || !userRequest) return false;

    setRequestLoading(true);
    try {
      const { error } = await supabase
        .from("trip_join_requests")
        .delete()
        .eq("id", userRequest.id)
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (error) throw error;

      toast({
        title: "Request cancelled",
        description: "Your join request has been cancelled",
      });

      await fetchJoinRequests();
      return true;
    } catch (error: any) {
      console.error("Error cancelling request:", error);
      toast({
        title: "Failed to cancel request",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setRequestLoading(false);
    }
  }, [user, userRequest, toast, fetchJoinRequests]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!tripId) return;

    fetchJoinRequests();

    const subscription = supabase
      .channel(`join_requests_${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "trip_join_requests",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          console.log("Join request change:", payload);
          fetchJoinRequests();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tripId, fetchJoinRequests]);

  return {
    joinRequests,
    userRequest,
    loading,
    requestLoading,
    responseLoading,
    sendJoinRequest,
    approveRequest,
    rejectRequest,
    cancelRequest,
    refetchRequests: fetchJoinRequests,
  };
};
