import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import AppNavigation from "@/components/navigation/AppNavigation";
import Index from "@/pages/Index";
import NotFound from "./pages/NotFound";
import TripDetailsPage from "./pages/TripDetailsPage";
import ProfilePage from "./pages/ProfilePage";
import DiscoverPage from "./pages/DiscoverPage";
import MyTripsPage from "./pages/MyTripsPage";
import CommunityPage from "./pages/CommunityPage";
import MessagesPage from "./pages/MessagesPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import Safety from "./pages/Safety";
import Contact from "./pages/Contact";
import AboutUs from "./pages/AboutUs";
const queryClient = new QueryClient();

// ✅ NEW: Component to conditionally render navigation
const AppLayout = ({ user }: { user: User | null }) => {
  const location = useLocation();

  // ✅ Routes that should NOT have navigation
  const noNavRoutes = ["/auth", "/landing", "/signup", "/login"];
  const shouldHideNav = noNavRoutes.includes(location.pathname);

  return (
    <>
      {/* ✅ CONDITIONAL: Only show navigation for main app routes */}
      {!shouldHideNav && <AppNavigation user={user} />}

      {/* ✅ CONDITIONAL: Add proper spacing only when nav is present */}
      <main className={`min-h-screen ${!shouldHideNav ? "pt-16" : ""}`}>
        <Routes>
          <Route path="/" element={<Index user={user} />} />
          <Route path="/trip/:tripId" element={<TripDetailsPage />} />
          <Route path="/profile" element={<ProfilePage currentUser={user} />} />
          <Route
            path="/profile/:userId"
            element={<ProfilePage currentUser={user} />}
          />
          <Route path="/discover" element={<DiscoverPage user={user} />} />
          <Route path="/my-trips" element={<MyTripsPage user={user} />} />
          <Route path="/community" element={<CommunityPage user={user} />} />
          <Route path="/messages" element={<MessagesPage user={user} />} />
          <Route path="/settings" element={<SettingsPage user={user} />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/Contact" element={<Contact />} />
          <Route path="/about-us" element={<AboutUs />} />
          {/* ✅ STANDALONE: Auth page without navigation */}
          <Route path="/auth" element={<AuthPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* ✅ UPDATED: Use AppLayout component with conditional navigation */}
          <AppLayout user={user} />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
