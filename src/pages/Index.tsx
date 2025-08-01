import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  ensureProfileExists,
  checkProfileCompletion,
} from "@/lib/auth-helpers";
import TripFeed from "@/components/home/TripFeed";
import WelcomeModal from "@/components/onboarding/WelcomeModal";

interface IndexProps {
  user: User | null; // ✅ ADD: Accept user as prop
}

const Index = ({ user }: IndexProps) => {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (user) {
      checkIfNewUser(user);
    }
  }, [user]);

  const checkIfNewUser = async (user: User) => {
    try {
      console.log("Checking user profile for:", user.id);

      const profile = await ensureProfileExists(user);

      if (profile) {
        setUserProfile(profile);

        const completionPercentage = checkProfileCompletion(profile);
        const isNewProfile =
          !profile.home_city || !profile.tagline || completionPercentage < 60;

        if (isNewProfile) {
          setIsNewUser(true);
          setShowWelcome(true);
        }
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
    }
  };

  const handleProfileComplete = () => {
    setShowWelcome(false);
    setIsNewUser(false);
  };

  return (
    <>
      {/* ✅ REMOVED: Header (now handled by AppNavigation) */}

      {/* Main Content */}
      <TripFeed user={user} />

      {/* Welcome Modal for new users */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={handleProfileComplete}
        user={user}
        profile={userProfile}
        isNewUser={isNewUser}
      />
    </>
  );
};

export default Index;
