import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-image.jpg";

const LandingPage = () => {
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
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

            {/* CTA Button */}
            <div className="pt-4">
              <Button
                variant="cta"
                size="lg"
                onClick={handleGoogleSignIn}
                className="text-lg px-8 py-3 h-auto animate-slide-up"
              >
                Sign In with Google
              </Button>
            </div>

            {/* Trust indicator */}
            <p className="text-sm text-white/70 pt-2">
              Join 2,000+ travelers already exploring together
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center">
          <p className="text-white/60 text-sm">
            Safe travels, authentic connections
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
