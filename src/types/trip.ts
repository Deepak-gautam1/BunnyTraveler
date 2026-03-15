// src/types/trip.ts

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type TripParticipant = {
  joined_at: string;
  profiles: Profile | null;
};

export type TripDetail = {
  id: number;
  destination: string;
  start_date: string;
  end_date: string;
  start_city: string;
  description: string | null;
  max_group_size: number;
  budget_per_person?: number | null;
  travel_style?: string[] | null;
  created_at: string;
  creator_id: string;
  status?: string;
  interested_count?: number;
  coupon_awarded?: boolean;
  coupon_awarded_at?: string | null;
  referral_code?: string | null;
  current_participants?: number;
  profiles: Profile | null;
  trip_participants: TripParticipant[];
};

export type ParticipantStats = {
  current_participants: number;
  max_participants: number;
  spots_remaining: number;
  referral_participants: number;
};
