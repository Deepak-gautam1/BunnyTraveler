import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-image.jpg";
import SignUpForm from "@/components/auth/SignUpForm"; // ✅ ADD THIS IMPORT
import {
  Chrome,
  Mail,
  Eye,
  MapPin,
  Users,
  MessageCircle,
  Shield,
  Clock,
} from "lucide-react";

interface LandingPageProps {
  onSkipForNow?: () => void;
}

const LandingPage = ({ onSkipForNow }: LandingPageProps) => {
  const { toast } = useToast();

  // ✅ SIMPLIFIED: Only need one state for showing signup form
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign in with Google",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipForNow = () => {
    toast({
      title: "Welcome, Explorer! 👋",
      description:
        "You can browse trips, but you'll need to sign in to join or create trips.",
    });
    onSkipForNow?.();
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Hero Image Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header with subtle logo area */}
        <header className="p-4 md:p-6">
          <div className="text-white/90 font-bold text-xl tracking-wide">
            WanderTribe
          </div>
        </header>

        {/* Main Content - Centered */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 text-center">
          <div className="max-w-md mx-auto space-y-6 animate-fade-in">
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Your Tribe Awaits.
              <br />
              <span className="text-accent">Travel Together, Instantly.</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Connect with fellow travelers across India. Plan spontaneous
              adventures. Build lasting friendships.
            </p>

            {/* Stats */}
            <div className="flex justify-center items-center space-x-8 text-sm text-white/70">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                2,000+ travelers
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                50+ destinations
              </div>
              <div className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-2" />
                Real-time chat
              </div>
            </div>

            {/* Three Authentication Options */}
            <div className="pt-4 space-y-3">
              {/* Google Sign In */}
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full text-lg px-8 py-3 h-auto bg-white/10 border border-white/30 text-white hover:bg-white/20 backdrop-blur-sm transition-all"
                variant="outline"
              >
                <Chrome className="w-5 h-5 mr-2" />
                {loading ? "Signing in..." : "Continue with Google"}
              </Button>

              {/* ✅ UPDATED: Email Sign Up - Opens dedicated form */}
              <Button
                onClick={() => setShowSignUpForm(true)}
                className="w-full text-lg px-8 py-3 h-auto bg-blue-600 hover:bg-blue-700 text-white transition-all"
              >
                <Mail className="w-5 h-5 mr-2" />
                Sign up with Email
              </Button>

              {/* Skip for Now */}
              {onSkipForNow && (
                <Button
                  onClick={handleSkipForNow}
                  variant="ghost"
                  className="w-full text-lg px-8 py-3 h-auto text-white/80 hover:text-white hover:bg-white/10"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Skip for Now - Browse Trips
                </Button>
              )}
            </div>

            {/* Trust indicators */}
            <div className="pt-4 space-y-2">
              <p className="text-sm text-white/70">
                Join 2,000+ travelers already exploring together
              </p>
              <div className="flex justify-center space-x-6 text-xs text-white/50">
                <div className="flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  Safe & verified
                </div>
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Quick setup
                </div>
                <span>✅ Free to use</span>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center">
          <p className="text-white/60 text-sm">
            Safe travels, authentic connections
          </p>
        </footer>
      </div>

      {/* ✅ UPDATED: SignUpForm Component instead of modals */}
      {showSignUpForm && (
        <div className="fixed inset-0 z-50 bg-background">
          <SignUpForm onBackToLanding={() => setShowSignUpForm(false)} />
        </div>
      )}
    </div>
  );
};

export default LandingPage;
