import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import LandingPage from "@/components/landing/LandingPage";
import TripFeed from "@/components/home/TripFeed";
import WelcomeModal from "@/components/onboarding/WelcomeModal"; // ADD THIS IMPORT

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ ADD: Welcome modal state
  const [showWelcome, setShowWelcome] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    // Check for existing session first
    const getInitialSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);

        // ✅ ADD: Check if user needs welcome modal
        if (session?.user) {
          await checkIfNewUser(session.user);
        }
      }
      setLoading(false);
    };

    getInitialSession();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle auth events
      if (event === "SIGNED_IN") {
        console.log("User signed in");
        // ✅ ADD: Check for new user on sign in
        if (session?.user) {
          await checkIfNewUser(session.user);
        }
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out");
        // ✅ ADD: Reset welcome modal state on sign out
        setShowWelcome(false);
        setIsNewUser(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ✅ ADD: Function to check if user is new and needs onboarding
  const checkIfNewUser = async (user: User) => {
    try {
      const profile = await ensureProfileExists(user);

      if (profile) {
        const { isComplete } = checkProfileCompletion(profile);

        // Show welcome modal for new users or incomplete profiles
        if (!isComplete) {
          setIsNewUser(true);
          setShowWelcome(true);
        }
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Content */}
      <TripFeed user={user} />
      {/* Show landing page if no user and not explicitly skipped */}
      {!user && !sessionStorage.getItem("skip_for_now") && (
        <div className="fixed inset-0 z-50 bg-background">
          <LandingPage
            onSkipForNow={() => {
              sessionStorage.setItem("skip_for_now", "true");
              // Force re-render by updating a state if needed
            }}
          />
        </div>
      )}
      {/* ✅ ADD: Welcome Modal for New Users */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        user={user}
        isNewUser={isNewUser}
      />
    </>
  );
};

export default Index;
