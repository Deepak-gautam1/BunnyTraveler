import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ConsentModalProps {
  userId: string;
  onConsentGiven: () => void;
}

const ConsentModal = ({ userId, onConsentGiven }: ConsentModalProps) => {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    await supabase
      .from("profiles")
      .update({
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
      })
      .eq("id", userId);
    setLoading(false);
    onConsentGiven();
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-white max-w-md p-8 rounded space-y-4 shadow-2xl">
        <h2 className="text-xl font-bold mb-2 text-center">
          Accept Terms to Continue
        </h2>
        <div className="text-sm text-muted-foreground mb-2">
          You need to accept our{" "}
          <Link to="/terms" target="_blank" className="underline text-accent">
            Terms & Conditions
          </Link>{" "}
          and{" "}
          <Link to="/privacy" target="_blank" className="underline text-accent">
            Privacy Policy
          </Link>
          . SafarSquad is not responsible for incidents, accidents, or issues
          during trips.
        </div>
        <div className="flex gap-3 items-start">
          <Checkbox
            id="accept"
            checked={checked}
            onCheckedChange={(val) => setChecked(val === true)}
          />
          <label htmlFor="accept" className="text-xs cursor-pointer">
            I understand and accept the Terms, Privacy Policy, and liability
            waiver.
          </label>
        </div>
        <Button
          className="w-full"
          onClick={handleAccept}
          disabled={!checked || loading}
        >
          {loading ? "Saving..." : "Accept & Continue"}
        </Button>
      </div>
    </div>
  );
};

export default ConsentModal;
