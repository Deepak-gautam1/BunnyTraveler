import { supabase } from "@/integrations/supabase/client";

export type NotificationType =
  | "post_trip_review"
  | "trip_update"
  | "new_message"
  | "join_request"
  | "participant_joined"
  | "participant_left"
  | "trip_cancelled"
  | "marketing"
  | "coupon_awarded";

interface NotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  tripId?: number | null;
  link?: string;
  scheduledFor?: Date;
}

export async function createNotification(params: NotificationParams) {
  try {
    // Check user preferences before sending
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", params.userId)
      .maybeSingle();

    const shouldSend = checkNotificationPreference(params.type, preferences);

    if (!shouldSend) {
      console.log("User has disabled this notification type");
      return null;
    }

    // Insert notification using updated table
    const { data, error } = await supabase
      .from("trip_notifications")
      .insert({
        user_id: params.userId,
        trip_id: params.tripId || null,
        notification_type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        scheduled_for: params.scheduledFor || new Date(),
        sent_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

function checkNotificationPreference(
  type: NotificationType,
  preferences: any
): boolean {
  if (!preferences) return true;

  switch (type) {
    case "trip_update":
    case "participant_joined":
    case "participant_left":
    case "trip_cancelled":
      return preferences.trip_updates;
    case "new_message":
      return preferences.new_messages;
    case "marketing":
      return preferences.marketing_emails;
    case "join_request":
      return preferences.trip_updates;
    case "coupon_awarded":
      return preferences.email_notifications;
    default:
      return true;
  }
}
