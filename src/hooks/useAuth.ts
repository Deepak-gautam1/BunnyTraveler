import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureProfileExists } from "@/lib/auth-helpers";

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string | null;
  terms_accepted_at?: string | null;
  privacy_accepted_at?: string | null;
  [key: string]: unknown;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
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
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await ensureProfileExists(session.user);
          setState({ user: session.user, profile, loading: false, isAuthenticated: true });
        } else {
          setState({ user: null, profile: null, loading: false, isAuthenticated: false });
        }
      } catch {
        setState({ user: null, profile: null, loading: false, isAuthenticated: false });
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await ensureProfileExists(session.user);
        setState({ user: session.user, profile, loading: false, isAuthenticated: true });
      } else {
        setState({ user: null, profile: null, loading: false, isAuthenticated: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut().catch(() => null);
  };

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (!state.user) return null;
    const profile = await ensureProfileExists(state.user);
    setState((prev) => ({ ...prev, profile }));
    return profile;
  };

  return { ...state, signOut, refreshProfile };
};
