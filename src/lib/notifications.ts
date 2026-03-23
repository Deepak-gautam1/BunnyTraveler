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
      return null;
      }

    // Insert notification using updated table
    const { data, error } = await supabase
      .from("trip_notifications")
      .insert({
        user_id: params.userId,
        trip_id: params.tripId ?? null,
        notification_type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        scheduled_for: (params.scheduledFor ?? new Date()).toISOString(),
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch {
    return null;
  }
}

function checkNotificationPreference(
  type: NotificationType,
  preferences: Record<string, unknown> | null
): boolean {
  if (!preferences) return true;
  const prefs = preferences as Record<string, boolean>;

  switch (type) {
    case "trip_update":
    case "participant_joined":
    case "participant_left":
    case "trip_cancelled":
      return prefs.trip_updates ?? true;
    case "new_message":
      return prefs.new_messages ?? true;
    case "marketing":
      return prefs.marketing_emails ?? true;
    case "join_request":
      return prefs.trip_updates ?? true;
    case "coupon_awarded":
      return prefs.email_notifications ?? true;
    default:
      return true;
  }
}
