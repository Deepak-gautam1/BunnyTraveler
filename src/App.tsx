import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Analytics } from "@vercel/analytics/react";
import AppNavigation from "@/components/navigation/AppNavigation";
import CookieConsent from "@/components/cookies/CookieConsent";
import ConsentModal from "@/components/consent/ConsentModal"; // ✅ 1. Import ConsentModal
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
import { TripCacheProvider } from "./contexts/TripCacheContext";
import CommunityMembersPage from "@/pages/CommunityMembersPage";
import TermsConditions from "./pages/TermsConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import MyRewardsPage from "./pages/RewardsPage";
import ResetPassword from "./pages/ResetPassword";
const queryClient = new QueryClient();

const AppLayout = ({ user }: { user: User | null }) => {
  const location = useLocation();
  const noNavRoutes = ["/auth", "/landing", "/signup", "/login", "/reset"];
  const shouldHideNav = noNavRoutes.includes(location.pathname);

  return (
    <>
      {!shouldHideNav && <AppNavigation user={user} />}
      <main
        className={`min-h-screen max-w-screen overflow-x-hidden ${
          !shouldHideNav ? "pt-16" : ""
        }`}
      >
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
          <Route path="/community/:slug" element={<CommunityMembersPage />} />
          <Route path="/messages" element={<MessagesPage user={user} />} />
          <Route path="/settings" element={<SettingsPage user={user} />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/rewards" element={<MyRewardsPage user={user} />} />
          <Route path="/reset" element={<ResetPassword />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [requireConsentModal, setRequireConsentModal] = useState(false); // ✅ 2. Modal state

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ 3. Check for consent after login
  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("terms_accepted_at, privacy_accepted_at")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (!data?.terms_accepted_at || !data?.privacy_accepted_at) {
            setRequireConsentModal(true);
          }
        });
    }
  }, [user]);

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
        <TripCacheProvider>
          <BrowserRouter>
            {/* ✅ 4. Show ConsentModal over everything if required */}
            {requireConsentModal && user && (
              <ConsentModal
                userId={user.id}
                onConsentGiven={() => setRequireConsentModal(false)}
              />
            )}
            <AppLayout user={user} />
            <CookieConsent />
          </BrowserRouter>
        </TripCacheProvider>
        <Analytics />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
