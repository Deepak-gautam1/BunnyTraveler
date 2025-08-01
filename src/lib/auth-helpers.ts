import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export const ensureProfileExists = async (user: User) => {
  try {
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking profile:", checkError);
      return null;
    }

    if (!existingProfile) {
      // Create new profile from Google data
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          email: user.email || null,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Leave new fields empty for user to fill
          home_city: null,
          tagline: null,
          website: null,
          bio: null,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating profile:", createError);
        return null;
      }

      return newProfile;
    } else {
      // Update existing profile with latest Google data if needed
      const updates: any = {};
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

        if (updateError) {
          console.error("Error updating profile:", updateError);
          return existingProfile;
        }

        return updatedProfile;
      }

      return existingProfile;
    }
  } catch (error) {
    console.error("Error in ensureProfileExists:", error);
    return null;
  }
};

export const checkProfileCompletion = (profile: any) => {
  if (!profile) return { isComplete: false, completionScore: 0 };

  const fields = [
    profile.full_name,
    profile.bio,
    profile.home_city,
    profile.tagline,
    profile.avatar_url,
  ];

  const filledFields = fields.filter(
    (field) => field && field.trim().length > 0
  ).length;
  const completionScore = Math.round((filledFields / fields.length) * 100);
  const isComplete = completionScore >= 80; // Consider 80%+ as complete

  return { isComplete, completionScore };
};
