// src/types/database.ts
// ─── Derived types from the generated Database schema ─────────────────────────
// Import this file instead of writing manual type definitions.
// These are guaranteed to match your live Supabase schema.

import type { Database } from "@/integrations/supabase/types";

// ─── Table row types ──────────────────────────────────────────────────────────
export type DbTrip              = Database["public"]["Tables"]["trips"]["Row"];
export type DbTripInsert        = Database["public"]["Tables"]["trips"]["Insert"];
export type DbTripUpdate        = Database["public"]["Tables"]["trips"]["Update"];

export type DbProfile           = Database["public"]["Tables"]["profiles"]["Row"];
export type DbProfileInsert     = Database["public"]["Tables"]["profiles"]["Insert"];
export type DbProfileUpdate     = Database["public"]["Tables"]["profiles"]["Update"];

export type DbTripParticipant   = Database["public"]["Tables"]["trip_participants"]["Row"];
export type DbTripJoinRequest   = Database["public"]["Tables"]["trip_join_requests"]["Row"];
export type DbTripReview        = Database["public"]["Tables"]["trip_reviews"]["Row"];
export type DbTripLike          = Database["public"]["Tables"]["trip_likes"]["Row"];
export type DbTripBookmark      = Database["public"]["Tables"]["trip_bookmarks"]["Row"];
export type DbTripPhoto         = Database["public"]["Tables"]["trip_photos"]["Row"];
export type DbTripActivity      = Database["public"]["Tables"]["trip_activities"]["Row"];
export type DbTripNotification  = Database["public"]["Tables"]["trip_notifications"]["Row"];
export type DbTripStatusHistory = Database["public"]["Tables"]["trip_status_history"]["Row"];

export type DbNotification      = Database["public"]["Tables"]["notifications"]["Row"];
export type DbPrivateMessage    = Database["public"]["Tables"]["private_messages"]["Row"];
export type DbMessage           = Database["public"]["Tables"]["messages"]["Row"];
export type DbMessageReaction   = Database["public"]["Tables"]["message_reactions"]["Row"];

export type DbCommunity         = Database["public"]["Tables"]["communities"]["Row"];
export type DbCommunityMember   = Database["public"]["Tables"]["community_members"]["Row"];

export type DbCoupon            = Database["public"]["Tables"]["coupons"]["Row"];
export type DbUserCoupon        = Database["public"]["Tables"]["user_coupons"]["Row"];
export type DbUserPreferences   = Database["public"]["Tables"]["user_preferences"]["Row"];

// ─── RPC return types ─────────────────────────────────────────────────────────
export type DbRecommendedTrip =
  Database["public"]["Functions"]["get_recommended_trips"]["Returns"][number];

export type DbDebugRecommendedTrip =
  Database["public"]["Functions"]["debug_recommended_trips"]["Returns"][number];

// ─── Convenience aliases used widely across the app ──────────────────────────

/** Minimal profile shape used in joined queries */
export type ProfileSnippet = Pick<DbProfile, "id" | "full_name" | "avatar_url">;

/** Trip participant as returned by joined queries */
export type TripParticipantWithProfile = DbTripParticipant & {
  profiles: ProfileSnippet | null;
};

/** Trip detail as returned by joined queries in TripDetailsPage */
export type TripWithRelations = DbTrip & {
  profiles: ProfileSnippet | null;
  trip_participants: TripParticipantWithProfile[];
};
