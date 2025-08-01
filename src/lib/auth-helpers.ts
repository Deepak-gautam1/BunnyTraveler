import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export interface ProfileData {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  home_city: string | null;
  tagline: string | null;
  website: string | null;
  bio?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string;
  social_link?: string | null;
}

export const ensureProfileExists = async (
  user: User
): Promise<ProfileData | null> => {
  if (!user) return null;

  try {
    // First, check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (existingProfile && !fetchError) {
      return existingProfile;
    }

    // If profile doesn't exist, create one
    const newProfileData = {
      id: user.id,
      user_id: user.id,
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        null,
      email: user.email,
      avatar_url: user.user_metadata?.avatar_url || null,
      home_city: user.user_metadata?.home_city || null,
      tagline: user.user_metadata?.tagline || null,
      website: user.user_metadata?.website || null,
      bio: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert(newProfileData)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating profile:", insertError);
      return null;
    }

    return newProfile;
  } catch (error) {
    console.error("Error in ensureProfileExists:", error);
    return null;
  }
};

export const checkProfileCompletion = (profile: ProfileData | null): number => {
  if (!profile) return 0;

  const fields = [
    profile.full_name,
    profile.email,
    profile.home_city,
    profile.tagline,
    profile.avatar_url,
    profile.bio,
  ];

  const completedFields = fields.filter(
    (field) => field && field.trim()
  ).length;
  return Math.round((completedFields / fields.length) * 100);
};
