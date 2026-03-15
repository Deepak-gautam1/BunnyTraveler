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
  user: User | null;
}

const Index = ({ user }: IndexProps) => {
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("welcomeModalSeen");



    // ✅ FIXED: Show to any logged-in user who hasn't seen it
    if (user && !hasSeenWelcome) {
      checkIfNewUser(user);
    }
  }, [user]);

  const checkIfNewUser = async (user: User) => {
    try {

      const profile = await ensureProfileExists(user);

      if (profile) {
        setUserProfile(profile);

        const completionPercentage = checkProfileCompletion(profile);
        const isNewProfile =
          !profile.home_city || !profile.tagline || completionPercentage < 60;



        // ✅ FIXED: Show welcome modal to everyone who hasn't seen it
        setIsNewUser(isNewProfile);
        setShowWelcome(true); // ← Always show if they haven't seen it
      }
    } catch {
      // silently fail — welcome modal is non-critical
    }
  };

  const handleProfileComplete = () => {
    setShowWelcome(false);
    setIsNewUser(false);
  };

  return (
    <>
      {/* Main Content */}
      <TripFeed user={user} />

      {/* Welcome Modal for new users */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={handleProfileComplete}
        user={user}
        isNewUser={isNewUser}
      />
    </>
  );
};

export default Index;
