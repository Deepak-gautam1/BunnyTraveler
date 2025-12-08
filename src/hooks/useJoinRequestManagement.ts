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
  referral_code: string | null;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const useJoinRequestManagement = (
  tripId: number,
  user: User | null,
  onTripDataRefresh?: () => Promise<void>
) => {
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [userRequest, setUserRequest] = useState<JoinRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [responseLoading, setResponseLoading] = useState(false);
  const { toast } = useToast();

  // Fetch join requests
  const fetchJoinRequests = useCallback(async () => {
    if (!tripId || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trip_join_requests")
        .select(
          `
          *,
          profiles:user_id (
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

  // ✅ FIXED: Accept referral code parameter from modal
  const sendJoinRequest = useCallback(
    async (message?: string, referralCode?: string) => {
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
        // ✅ DEBUG: Check what we received
        console.log("📍 sendJoinRequest - RECEIVED PARAMS:", {
          message: message,
          referralCode: referralCode,
          referralCodeType: typeof referralCode,
          referralCodeIsUndefined: referralCode === undefined,
          referralCodeIsNull: referralCode === null,
          referralCodeIsEmpty: referralCode === "",
        });

        const dataToInsert = {
          trip_id: tripId,
          user_id: user.id,
          message: message || null,
          status: "pending" as const,
          referral_code: referralCode || null, // ✅ This should store the code
        };

        console.log("📍 Data being inserted:", dataToInsert);

        const { data: insertedData, error } = await supabase
          .from("trip_join_requests")
          .insert(dataToInsert)
          .select(); // ✅ Get back what was inserted

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

        console.log("✅ Successfully inserted request:", insertedData);

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

  // ✅ Approve request with referral code validation
  const approveRequest = useCallback(
    async (request: JoinRequest, message?: string) => {
      if (!user || responseLoading) return false;

      if (!request || !request.id || !request.trip_id || !request.user_id) {
        console.error("Invalid request data: Missing required fields", request);
        toast({
          title: "Error",
          description: "Invalid request data provided.",
          variant: "destructive",
        });
        return false;
      }

      if (request.status !== "pending") {
        toast({
          title: "Error",
          description: "Request has already been processed",
          variant: "destructive",
        });
        return false;
      }

      setResponseLoading(true);
      try {
        // ✅ Get the referral code from the request
        const { data: requestData, error: requestError } = await supabase
          .from("trip_join_requests")
          .select("referral_code")
          .eq("id", request.id)
          .single();

        if (requestError) {
          console.error("Error fetching request data:", requestError);
          throw requestError;
        }

        // ✅ Get trip's referral code for validation
        const { data: tripData, error: tripError } = await supabase
          .from("trips")
          .select("referral_code")
          .eq("id", request.trip_id)
          .single();

        if (tripError) {
          console.error("Error fetching trip data:", tripError);
          throw tripError;
        }

        const requestReferralCode = requestData?.referral_code;
        const tripReferralCode = tripData?.referral_code;

        // ✅ Only store referral code if it matches the trip's code
        const isValidReferral =
          requestReferralCode &&
          tripReferralCode &&
          requestReferralCode === tripReferralCode;

        const finalReferralCode = isValidReferral ? requestReferralCode : null;

        console.log("🔄 Approving request with validation:", {
          requestId: request.id,
          requestReferralCode: requestReferralCode || "NULL",
          tripReferralCode: tripReferralCode,
          isValid: isValidReferral,
          willStoreInParticipants: finalReferralCode || "NULL",
        });

        // Update request status
        const { error: updateError } = await supabase
          .from("trip_join_requests")
          .update({
            status: "approved",
            responded_at: new Date().toISOString(),
            responded_by: user.id,
            response_message: message || null,
          })
          .eq("id", request.id)
          .eq("status", "pending");

        if (updateError) {
          console.error("Error updating request status:", updateError);
          throw updateError;
        }

        // ✅ Add participant with validated referral code (NULL if invalid/not provided)
        const { error: participantError } = await supabase
          .from("trip_participants")
          .insert({
            trip_id: request.trip_id,
            user_id: request.user_id,
            referral_code_used: finalReferralCode, // ✅ Only store if valid
          });

        if (participantError && participantError.code !== "23505") {
          console.error("Error adding participant:", participantError);
          throw participantError;
        }

        toast({
          title: "Request Approved! ✅",
          description: `${
            request.profiles?.full_name || "A user"
          } has been added to the trip.`,
        });

        await fetchJoinRequests();

        if (onTripDataRefresh) {
          setTimeout(() => {
            console.log("🔄 Refreshing trip data after approval");
            onTripDataRefresh();
          }, 500);
        }

        return true;
      } catch (error: any) {
        console.error("Error approving request:", error);

        let errorMessage = error.message;
        if (error.message?.includes("permission")) {
          errorMessage = "You don't have permission to approve this request";
        } else if (error.message?.includes("not found")) {
          errorMessage = "Request not found or already processed";
        }

        toast({
          title: "Failed to approve request",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      } finally {
        setResponseLoading(false);
      }
    },
    [user, responseLoading, onTripDataRefresh, toast, fetchJoinRequests]
  );

  // Reject request
  const rejectRequest = useCallback(
    async (request: JoinRequest, responseMessage?: string) => {
      if (!user || responseLoading) return false;

      setResponseLoading(true);
      try {
        if (!request?.id) {
          throw new Error("Invalid request: Missing request ID");
        }

        if (request.status !== "pending") {
          throw new Error("Request has already been processed");
        }

        const { error } = await supabase
          .from("trip_join_requests")
          .update({
            status: "rejected",
            responded_at: new Date().toISOString(),
            responded_by: user.id,
            response_message: responseMessage || null,
          })
          .eq("id", request.id)
          .eq("status", "pending");

        if (error) throw error;

        toast({
          title: "Request rejected",
          description: `${
            request.profiles?.full_name || "The user"
          }'s request has been rejected`,
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
    [user, responseLoading, toast, fetchJoinRequests]
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
