import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

export type TripStatus = "planning" | "confirmed" | "ongoing" | "completed";

export const useTripStatus = (user: User | null) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Update trip status with optional reason
  const updateTripStatus = async (
    tripId: number,
    newStatus: TripStatus,
    reason?: string
  ) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { data: trip, error: fetchError } = await supabase
        .from("trips")
        .select("status, creator_id")
        .eq("id", tripId)
        .maybeSingle();

      if (fetchError || !trip)
        throw new Error("Trip not found or fetch failed.");
      if (trip.creator_id !== user.id) throw new Error("Permission denied.");

      const { error: updateError } = await supabase
        .from("trips")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", tripId);

      if (updateError) throw updateError;

      // Log status change
      await supabase.from("trip_status_history").insert({
        trip_id: tripId,
        old_status: trip.status,
        new_status: newStatus,
        changed_by: user.id,
        reason: reason || null,
      });

      toast({ title: `Trip ${newStatus}!`, description: `Status updated.` });
      return true;
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Optionally, add an automatic status transition based on dates:
  const autoUpdateStatusBasedOnDates = async (tripId: number) => {
    const { data: trip } = await supabase
      .from("trips")
      .select("status, start_date, end_date")
      .eq("id", tripId)
      .maybeSingle();
    if (!trip) return;
    const now = new Date();
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);

    if (trip.status === "confirmed" && now >= start && now <= end)
      await updateTripStatus(tripId, "ongoing", "Auto-transition to ongoing");

    if (trip.status === "ongoing" && now > end)
      await updateTripStatus(
        tripId,
        "completed",
        "Auto-transition to completed"
      );
  };

  return { updateTripStatus, autoUpdateStatusBasedOnDates, loading };
};
