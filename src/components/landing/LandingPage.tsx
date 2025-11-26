// src/components/landing/LandingPage.tsx
import { useState, useEffect, ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  Variants,
  AnimatePresence,
} from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import SignUpForm from "@/components/auth/SignUpForm";

import heroImage from "@/assets/hero-image.jpg";

import {
  Chrome,
  Mail,
  Eye,
  MapPin,
  Users,
  MessageCircle,
  Shield,
  Clock,
  Sparkles,
  Download,
  Navigation,
  Smartphone,
} from "lucide-react";

interface LandingPageProps {
  onSkipForNow?: () => void;
}

/* -------------------------------------------------------------------------- */
/*                               Helper types                                 */
/* -------------------------------------------------------------------------- */
type Ripple = { x: number; y: number; id: number };
type ButtonProps = {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  disabled?: boolean;
  [rest: string]: unknown;
};

/* -------------------------------------------------------------------------- */
/*                         1. PWA install prompt box                          */
/* -------------------------------------------------------------------------- */
const PWAInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window as any).navigator.standalone
    ) {
      setIsInstalled(true);
      return;
    }

    const handleBefore = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setTimeout(() => setShowPrompt(true), 10_000);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBefore);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBefore);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  if (isInstalled || !showPrompt || !installPrompt) return null;

  return (
    <motion.div
      className="fixed bottom-20 right-4 z-40 max-w-sm"
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-4 rounded-xl shadow-2xl border border-white/20">
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Smartphone className="w-6 h-6 flex-shrink-0 mt-0.5" />
          </motion.div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">Install SafarSquad</h4>
            <p className="text-xs text-white/90 mb-3 leading-relaxed">
              Get the full app experience with offline access and notifications!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              >
                <Download className="w-3 h-3 inline mr-1" />
                Install
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="text-white/80 hover:text-white text-xs px-3 py-1.5 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*                     2. Re-usable button with ripple                        */
/* -------------------------------------------------------------------------- */
const EnhancedButton = ({
  children,
  onClick,
  className = "",
  variant = "default",
  disabled,
  ...props
}: ButtonProps) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const addRipple = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ripple: Ripple = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: Date.now(),
    };
    setRipples((prev) => [...prev, ripple]);
    setTimeout(
      () => setRipples((prev) => prev.filter((r) => r.id !== ripple.id)),
      600
    );
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-md w-full"
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        onClick={(e) => {
          addRipple(e);
          onClick?.(e);
        }}
        className={`relative w-full ${className}`}
        variant={variant as any}
        disabled={disabled}
        {...props}
      >
        {children}
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              className="absolute bg-white/30 rounded-full pointer-events-none"
              style={{
                left: r.x - 10,
                top: r.y - 10,
                width: 20,
                height: 20,
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          ))}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*          3. Location-aware helpers (shared by multiple sub-UIs)            */
/* -------------------------------------------------------------------------- */
const destinationMap: Record<string, string[]> = {
  Maharashtra: ["Lonavala", "Aurangabad", "Mahabaleshwar"],
  Karnataka: ["Coorg", "Hampi", "Chikmagalur"],
  Kerala: ["Munnar", "Alleppey", "Wayanad"],
  Rajasthan: ["Jaipur", "Udaipur", "Jaisalmer"],
  "Himachal Pradesh": ["Manali", "Shimla", "Kasol"],
  Uttarakhand: ["Rishikesh", "Nainital", "Mussoorie"],
  "Tamil Nadu": ["Ooty", "Kodaikanal", "Pondicherry"],
  Delhi: ["Agra", "Jaipur", "Rishikesh"],
  France: ["French Alps", "Provence", "Loire Valley"],
  "United States": ["Yellowstone", "Grand Canyon", "Yosemite"],
  "United Kingdom": ["Scottish Highlands", "Lake District", "Cornwall"],
  default: ["Goa", "Manali", "Kerala", "Ladakh", "Rishikesh", "Hampi"],
};

const getDestinationsByLocation = (state?: string, country?: string) =>
  destinationMap[state || country || "default"] || destinationMap.default;

/* -------------------------------------------------------------------------- */
/* 4. Location-aware COMMUNITY ACTIVITY feed (receives location via props)    */
/* -------------------------------------------------------------------------- */
const LocationAwareLiveActivity = ({
  city,
  state,
  loading,
}: {
  city: string | null;
  state: string | null;
  loading: boolean;
}) => {
  if (typeof window !== "undefined" && window.innerWidth < 640) return null;
  const [activities, setActivities] = useState<any[]>([]);
  const [visible, setVisible] = useState(true);

  const buildActivity = () => {
    const near = state
      ? getDestinationsByLocation(state)
      : destinationMap.default;

    const base = [
      `Someone joined a group trip to ${near[0]}`,
      `A traveler is exploring ${near[1]} this week`,
      `New adventure group formed for ${near[2]}`,
      `Solo traveler found companions for ${near[0]} expedition`,
    ];
    const time = ["just now", "2 min ago", "5 min ago"][
      Math.floor(Math.random() * 3)
    ];
    return {
      id: Date.now() + Math.random(),
      message: base[Math.floor(Math.random() * base.length)],
      time,
    };
  };

  useEffect(() => {
    if (loading) return;
    setActivities([buildActivity(), buildActivity(), buildActivity()]);
    const id = setInterval(() => {
      setActivities((prev) => [buildActivity(), ...prev.slice(0, 4)]);
    }, 15_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, state]);

  if (!visible) return null;

  return (
    <motion.div
      className="fixed bottom-4 left-4 z-30 max-w-sm"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 3, duration: 0.8 }}
    >
      <div className="mb-2 flex items-center justify-between">
        <motion.div
          className="text-white/70 text-xs flex items-center gap-1.5 font-medium"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <motion.div
            className="w-2 h-2 bg-green-400 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {city ? `${city} Activity` : "Community Activity"}
        </motion.div>
        <button
          onClick={() => setVisible(false)}
          className="text-white/40 hover:text-white/80 text-xs"
        >
          ✕
        </button>
      </div>

      <AnimatePresence>
        {activities.slice(0, 3).map((a, idx) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            transition={{
              delay: idx * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            className="bg-white/10 backdrop-blur-md rounded-lg p-3 mb-2 border border-white/20 shadow-lg"
          >
            <p className="text-white text-sm leading-relaxed">{a.message}</p>
            <span className="block text-right text-white/50 text-xs mt-1">
              {a.time}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.p
        className="mt-2 text-white/40 text-xs text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4 }}
      >
        {city ? `Near ${city}` : "Anonymous community activity"}
      </motion.p>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*                  5. Location-aware LIVE STATS COUNTER                      */
/* -------------------------------------------------------------------------- */
const LocationAwareLiveStatsCounter = ({
  icon,
  label,
  target,
  suffix = "",
}: {
  icon: ReactNode;
  label: string;
  target: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const [anim, setAnim] = useState(false);

  useEffect(() => {
    setAnim(true);
    const steps = 60;
    const stepVal = target / steps;
    const id = setInterval(() => {
      setCount((c) => {
        const next = c + stepVal;
        return next >= target ? target : next;
      });
    }, 2_000 / steps);
    setTimeout(() => setAnim(false), 2_000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <motion.div
      className="flex items-center gap-1.5"
      whileHover={{ scale: 1.05, color: "#fff" }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <motion.div
        animate={{
          rotate: anim ? [0, 5, -5, 0] : 0,
          scale: anim ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: 0.6, repeat: anim ? 3 : 0 }}
      >
        {icon}
      </motion.div>
      <span>
        <motion.span
          className="font-semibold"
          animate={{
            color: anim ? ["#fff", "#f97316", "#fff"] : "#fff",
          }}
          transition={{ duration: 2, repeat: anim ? 1 : 0 }}
        >
          {Math.floor(count).toLocaleString()}
        </motion.span>
        {suffix} {label}
      </span>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*                       6. Success toast notifications                       */
/* -------------------------------------------------------------------------- */
const PrivacySafeFloatingNotifications = () => {
  const [list, setList] = useState<any[]>([]);
  const messages = [
    "🎉 Amazing! 50+ adventures planned today",
    "✈️ Community growing! 200+ explorers connected",
    "🌟 New destinations trending this week",
    "🤝 Travel groups forming across India",
    "🏔️ Adventure seekers discovering hidden gems",
  ];

  const push = () =>
    setList((prev) => [
      {
        id: Date.now(),
        msg: messages[Math.floor(Math.random() * messages.length)],
      },
      ...prev.slice(0, 2),
    ]);

  useEffect(() => {
    const first = setTimeout(push, 8_000);
    const interval = setInterval(push, 18_000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-30 space-y-2">
      <AnimatePresence>
        {list.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: i * 0.1,
            }}
            className="bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg text-sm font-medium shadow-xl border border-white/20"
            style={{ zIndex: 50 - i }}
          >
            {n.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                        7. Main LandingPage component                       */
/* -------------------------------------------------------------------------- */
const LandingPage = ({ onSkipForNow }: LandingPageProps) => {
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  /* geolocation (single call) */
  const {
    location,
    loading: locLoading,
    hasCity,
    displayLocation,
  } = useGeolocation();

  /* headline helper */
  const headline = () => {
    if (locLoading) return "Connect with fellow travelers across India";
    if (hasCity) return `Connect with travelers in ${location.city}`;
    if (location.state) return `Join adventurers from ${location.state}`;
    if (location.country && location.country !== "India")
      return `Connect with travelers from ${location.country} exploring India`;
    return "Connect with fellow travelers across India";
  };

  /* Google sign-in */
  const signInGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    setLoading(false);
  };

  /* Skip CTA */
  const skip = () => {
    toast({
      title: "Welcome, Explorer! 👋",
      description:
        "You can browse trips, but you'll need to sign in to join or create trips.",
    });
    onSkipForNow?.();
  };

  /* parallax */
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 500], [0, -150]);
  const txtY = useTransform(scrollY, [0, 500], [0, 100]);

  /* animation variants */
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delayChildren: 0.4, staggerChildren: 0.15 },
    },
  };
  const item: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", damping: 25, stiffness: 300 },
    },
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      {/* ✅ OPTIMIZED: Hero Image Background (No Video) */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
          style={{
            backgroundImage: `url(${heroImage})`,
            y: bgY,
          }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
        >
          {/* Gradient Overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          />

          {/* ✅ Optional: Subtle zoom animation */}
          <motion.div
            className="absolute inset-0"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>

      {/* ─────────── Header ─────────── */}
      <header className="relative z-10 p-4 md:p-6 flex justify-between items-center">
        <motion.div
          className="text-white/90 font-bold text-xl tracking-wide flex items-center"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            className="mr-2"
            animate={{ rotate: 360, scale: [1, 1.15, 1] }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity, repeatDelay: 4 },
            }}
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
          SafarSquad
          {hasCity && (
            <motion.span
              className="ml-2 text-xs text-white/60 flex items-center gap-1"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 }}
            >
              <Navigation className="w-3 h-3" />
              {displayLocation}
            </motion.span>
          )}
        </motion.div>
      </header>

      {/* ─────────── Main ─────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-8 text-center">
        <motion.div
          className="max-w-lg mx-auto space-y-6"
          variants={container}
          initial="hidden"
          animate="visible"
          style={{ y: txtY }}
        >
          {/* Headline */}
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-white leading-tight drop-shadow-2xl"
            variants={item}
          >
            Your Tribe Awaits.
            <br />
            <motion.span
              className="bg-gradient-to-r from-orange-400 via-pink-500 to-orange-400 bg-clip-text text-transparent inline-block"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "400% 100%" }}
            >
              Travel Together, Instantly.
            </motion.span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            className="text-lg md:text-xl text-white/90 leading-relaxed drop-shadow-lg"
            variants={item}
          >
            {headline()}. Plan spontaneous adventures. Build lasting
            friendships.
          </motion.p>

          {/* Live stats */}
          <motion.div
            className="flex justify-center items-center space-x-6 text-sm text-white/70"
            variants={item}
          >
            <LocationAwareLiveStatsCounter
              icon={<Users className="w-4 h-4" />}
              label="travelers"
              target={2_420}
              suffix="+"
            />
            <LocationAwareLiveStatsCounter
              icon={<MapPin className="w-4 h-4" />}
              label="destinations"
              target={78}
              suffix="+"
            />
            <LocationAwareLiveStatsCounter
              icon={<MessageCircle className="w-4 h-4" />}
              label="active chats"
              target={189}
            />
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            className="pt-4 flex flex-col space-y-3 w-full max-w-xs mx-auto"
            variants={item}
          >
            <EnhancedButton
              onClick={signInGoogle}
              disabled={loading}
              className="w-full text-lg px-8 py-3 h-auto bg-white/10 border border-white/30 text-white hover:bg-white/20 backdrop-blur-sm transition-all shadow-xl"
              variant="outline"
            >
              <Chrome className="w-5 h-5 mr-2" />
              {loading ? "Signing in…" : "Continue with Google"}
            </EnhancedButton>

            <EnhancedButton
              onClick={() => setShowForm(true)}
              className="w-full text-lg px-8 py-3 h-auto bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white shadow-xl"
            >
              <Mail className="w-5 h-5 mr-2" />
              Continue with Email
            </EnhancedButton>

            {onSkipForNow && (
              <EnhancedButton
                onClick={skip}
                variant="ghost"
                className="w-full text-lg px-8 py-3 h-auto text-white/80 hover:text-white hover:bg-white/10"
              >
                <Eye className="w-5 h-5 mr-2" />
                Skip for Now – Browse Trips
              </EnhancedButton>
            )}
          </motion.div>

          {/* Trust indicators */}
          <motion.div variants={item}>
            <p className="text-sm text-white/70 drop-shadow">
              {hasCity
                ? `Join travelers in ${location.city} and nearby areas`
                : "Join 2,400+ travelers already exploring together"}
            </p>
            <div className="flex justify-center space-x-6 text-xs text-white/50 mt-1">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" /> Safe & verified
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Quick setup
              </span>
              <span>✅ Free to use</span>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center">
        <p className="text-white/60 text-sm drop-shadow">
          Safe travels, authentic connections
        </p>
      </footer>

      {/* Social proof overlays */}
      <LocationAwareLiveActivity
        city={location.city}
        state={location.state}
        loading={locLoading}
      />
      <PrivacySafeFloatingNotifications />

      {/* PWA prompt */}
      <PWAInstallPrompt />

      {/* Sign-up modal */}
      {showForm && (
        <motion.div
          className="fixed inset-0 z-50 bg-background"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <SignUpForm onBackToLanding={() => setShowForm(false)} />
        </motion.div>
      )}

      {/* Back-to-top FAB */}
      <motion.div
        className="fixed bottom-8 right-8 z-20"
        animate={{ y: [-20, 20, -20] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.button
          className="w-12 h-12 bg-gradient-to-br from-orange-500 via-pink-500 to-orange-600 rounded-full flex items-center justify-center shadow-xl border-2 border-white/20"
          whileHover={{
            scale: 1.2,
            rotate: 15,
            boxShadow: "0 15px 35px rgba(251,146,60,0.5)",
          }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.button>
      </motion.div>
    </div>
  );
};

export default LandingPage;
