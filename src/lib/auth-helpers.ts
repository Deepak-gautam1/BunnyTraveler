import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import type { DbProfile } from "@/types/database";

// UserProfileData is the exact shape of a profiles row
export type UserProfileData = DbProfile;

export const ensureProfileExists = async (user: User): Promise<UserProfileData | null> => {
  try {
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") return null;

    if (!existingProfile) {
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name ?? null,
          avatar_url: user.user_metadata?.avatar_url ?? null,
          email: user.email ?? null,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          home_city: null,
          tagline: null,
          website: null,
          bio: null,
        })
        .select()
        .single();

      if (createError) return null;
      return newProfile;
    }

    const updates: Partial<UserProfileData> = {};
    let needsUpdate = false;

    if (!existingProfile.full_name && user.user_metadata?.full_name) {
      updates.full_name = user.user_metadata.full_name;
      needsUpdate = true;
    }
    if (!existingProfile.avatar_url && user.user_metadata?.avatar_url) {
      updates.avatar_url = user.user_metadata.avatar_url;
      needsUpdate = true;
    }
    if (!existingProfile.email && user.email) {
      updates.email = user.email;
      needsUpdate = true;
    }

    if (needsUpdate) {
      updates.updated_at = new Date().toISOString();
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) return existingProfile;
      return updatedProfile;
    }

    return existingProfile;
  } catch {
    return null;
  }
};

export const checkProfileCompletion = (profile: UserProfileData) => {
  if (!profile) return { isComplete: false, completionScore: 0 };

  const fields = [
    profile.full_name,
    profile.bio,
    profile.home_city,
    profile.tagline,
    profile.avatar_url,
  ];

  const filledFields = fields.filter(
    (field) => field && String(field).trim().length > 0
  ).length;
  const completionScore = Math.round((filledFields / fields.length) * 100);
  const isComplete = completionScore >= 80;

  return { isComplete, completionScore };
};
