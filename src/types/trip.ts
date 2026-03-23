// src/types/trip.ts
// ─── Re-export the canonical DB types so callers can import from one place ────
export type {
  DbTrip,
  DbTripInsert,
  DbTripUpdate,
  DbProfile,
  DbTripParticipant,
  DbTripJoinRequest,
  DbTripReview,
  DbTripLike,
  DbTripBookmark,
  DbTripPhoto,
  ProfileSnippet,
  TripParticipantWithProfile,
  TripWithRelations,
} from "@/types/database";

// ─── Legacy aliases kept for backward compat with existing imports ────────────
// Components still use these names. They now map to real DB types.
import type { ProfileSnippet, TripParticipantWithProfile } from "@/types/database";
import type { Database } from "@/integrations/supabase/types";

export type Profile = ProfileSnippet;

export type TripParticipant = TripParticipantWithProfile;

/** Full trip detail shape used in TripDetailsPage and related components */
export type TripDetail = Database["public"]["Tables"]["trips"]["Row"] & {
  profiles: Profile | null;
  trip_participants: TripParticipant[];
};

/** Stats derived from participant data — not a DB type */
export type ParticipantStats = {
  current_participants: number;
  max_participants: number;
  spots_remaining: number;
  is_full: boolean;
  referral_participants: number;
};
