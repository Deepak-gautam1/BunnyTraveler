// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfileExists } from "@/lib/auth-helpers";

interface AuthState {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // Ensure profile exists and get it
          const profile = await ensureProfileExists(session.user);
          setState({
            user: session.user,
            profile,
            loading: false,
            isAuthenticated: true,
          });
        } else {
          setState({
            user: null,
            profile: null,
            loading: false,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        setState({
          user: null,
          profile: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // User signed in
        const profile = await ensureProfileExists(session.user);
        setState({
          user: session.user,
          profile,
          loading: false,
          isAuthenticated: true,
        });
      } else {
        // User signed out
        setState({
          user: null,
          profile: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper methods
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const refreshProfile = async () => {
    if (state.user) {
      const profile = await ensureProfileExists(state.user);
      setState((prev) => ({ ...prev, profile }));
      return profile;
    }
    return null;
  };

  return {
    ...state,
    signOut,
    refreshProfile,
  };
};
