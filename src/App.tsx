import { lazy, Suspense, useState, useEffect } from "react";
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
import ConsentModal from "@/components/consent/ConsentModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import { TripCacheProvider } from "./contexts/TripCacheContext";
import { imageCacheManager } from "@/lib/imageCache";
import { getDestinationImage } from "@/lib/images";
import ChatWidget from "./components/chatbot/ChatWidget";
// ─── Lazy-loaded routes (code splitting per page) ─────────────────────────────
const Index = lazy(() => import("@/pages/Index"));
const TripDetailsPage = lazy(() => import("@/pages/TripDetailsPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const DiscoverPage = lazy(() => import("@/pages/DiscoverPage"));
const MyTripsPage = lazy(() => import("@/pages/MyTripsPage"));
const CommunityPage = lazy(() => import("@/pages/CommunityPage"));
const CommunityMembersPage = lazy(() => import("@/pages/CommunityMembersPage"));
const MessagesPage = lazy(() => import("@/pages/MessagesPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const Safety = lazy(() => import("@/pages/Safety"));
const Contact = lazy(() => import("@/pages/Contact"));
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const TermsConditions = lazy(() => import("@/pages/TermsConditions"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const MyRewardsPage = lazy(() => import("@/pages/RewardsPage"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// ─── Constants ────────────────────────────────────────────────────────────────
const queryClient = new QueryClient();

const PRELOAD_DESTINATIONS = [
  "manali",
  "goa",
  "rishikesh",
  "jaipur",
  "shimla",
  "udaipur",
  "kerala",
  "leh-ladakh",
  "varanasi",
  "darjeeling",
  "ooty",
  "andaman",
  "agra",
  "amristar",
  "mysore",
  "pondicherry",
  "coorg",
  "nainital",
  "ranthambore",
  "kasol",
];

const NO_NAV_ROUTES = ["/auth", "/landing", "/signup", "/login", "/reset"];

// ─── Page loading fallback ────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
  </div>
);

// ─── App layout ───────────────────────────────────────────────────────────────
const AppLayout = ({ user }: { user: User | null }) => {
  const location = useLocation();
  const shouldHideNav = NO_NAV_ROUTES.includes(location.pathname);

  return (
    <>
      {!shouldHideNav && <AppNavigation user={user} />}
      <main className="min-h-screen max-w-screen overflow-x-hidden">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index user={user} />} />
              <Route path="/trip/:tripId" element={<TripDetailsPage />} />
              <Route
                path="/profile"
                element={<ProfilePage currentUser={user} />}
              />
              <Route
                path="/profile/:userId"
                element={<ProfilePage currentUser={user} />}
              />
              <Route path="/discover" element={<DiscoverPage user={user} />} />
              <Route path="/my-trips" element={<MyTripsPage user={user} />} />
              <Route
                path="/community"
                element={<CommunityPage user={user} />}
              />
              <Route
                path="/community/:slug"
                element={<CommunityMembersPage />}
              />
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
          </Suspense>
        </ErrorBoundary>
      </main>
      {!shouldHideNav && <ChatWidget />}
    </>
  );
};

// ─── Root app ─────────────────────────────────────────────────────────────────
const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [requireConsentModal, setRequireConsentModal] = useState(false);

  // Auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Background image preload (after initial render)
  useEffect(() => {
    if (loading) return;
    const preload = async () => {
      await new Promise((r) => setTimeout(r, 2000));
      if (
        imageCacheManager.getCacheStats().count >= PRELOAD_DESTINATIONS.length
      )
        return;
      const imageData = PRELOAD_DESTINATIONS.map((name) => ({
        name,
        url: getDestinationImage(name),
      }));
      await imageCacheManager.preloadImages(imageData).catch(() => null);
    };
    preload();
  }, [loading]);

  // Consent check after login
  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <TripCacheProvider>
          <BrowserRouter>
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
