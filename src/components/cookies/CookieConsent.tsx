import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { setCookie, getCookie, COOKIE_KEYS } from "@/lib/cookies";
import { Cookie, X } from "lucide-react";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = getCookie(COOKIE_KEYS.CONSENT);
    if (!consent) {
      // Show banner after 1 second delay
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    setCookie(COOKIE_KEYS.CONSENT, "accepted", 365); // 1 year
    setShowBanner(false);
  };

  const handleDecline = () => {
    setCookie(COOKIE_KEYS.CONSENT, "declined", 365);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5">
      <Card className="max-w-4xl mx-auto p-6 shadow-2xl border-2 bg-background/95 backdrop-blur-lg">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <Cookie className="w-8 h-8 text-accent" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">🍪 We use cookies</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We use cookies to enhance your browsing experience, remember your
              preferences, and analyze site traffic. By clicking "Accept", you
              consent to our use of cookies. Learn more in our{" "}
              <a href="/privacy" className="text-accent underline">
                Privacy Policy
              </a>
              .
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleAccept} className="flex-1 sm:flex-none">
                Accept All
              </Button>
              <Button
                onClick={handleDecline}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                Decline
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowBanner(false)}
            className="shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;
