import { supabase } from "@/integrations/supabase/client";

export const usePostTripNotifications = () => {
  const schedulePostTripNotification = async (
    tripId: number,
    userId: string,
    tripTitle: string,
    endDate: string
  ) => {
    try {
      const notificationDate = new Date(endDate);
      notificationDate.setDate(notificationDate.getDate() + 2);

      const { error } = await supabase.from("trip_notifications").insert({
        trip_id: tripId,
        user_id: userId,
        notification_type: "post_trip_review",
        title: `Share your memories from the ${tripTitle} trip! 📸`,
        message: `How was your ${tripTitle} adventure? Upload photos and share your experience with fellow travelers!`,
        scheduled_for: notificationDate.toISOString(),
      });

      if (error) throw error;
    } catch {
      // silently fail — notification scheduling is non-critical
    }
  };

  const checkAndSendNotifications = async () => {
    try {
      const now = new Date().toISOString();

      const { data: notifications, error } = await supabase
        .from("trip_notifications")
        .select("*")
        .is("sent_at", null)
        .lte("scheduled_for", now);

      if (error) throw error;

      for (const notification of notifications || []) {
        await supabase
          .from("trip_notifications")
          .update({ sent_at: now })
          .eq("id", notification.id);
      }
    } catch {
      // silently fail — notification check is non-critical
    }
  };

  return { schedulePostTripNotification, checkAndSendNotifications };
};
