// src/components/trip/JoinRequestDialog.tsx
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Mail, Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface JoinRequestDialogProps {
  user: User | null;
  tripDestination: string;
  onSendRequest: (message?: string, referralCode?: string) => Promise<boolean>;
  requestLoading: boolean;
}

const JoinRequestDialog = ({
  user,
  tripDestination,
  onSendRequest,
  requestLoading,
}: JoinRequestDialogProps) => {
  const [requestMessage, setRequestMessage] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // ✅ ADD: Referral code validation states
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  // ✅ ADD: Validate referral code as user types
  useEffect(() => {
    const validateCode = async () => {
      if (!referralCode || referralCode.length < 6) {
        setCodeValidation(null);
        return;
      }

      setIsValidatingCode(true);

      try {
        const { data, error } = await supabase
          .from("trips")
          .select("id, destination, creator_id")
          .eq("referral_code", referralCode.toUpperCase())
          .single();

        if (data) {
          setCodeValidation({
            isValid: true,
            message: `✓ Valid code for trip to ${data.destination}`,
          });
        } else {
          setCodeValidation({
            isValid: false,
            message: "Invalid referral code",
          });
        }
      } catch (error) {
        setCodeValidation({
          isValid: false,
          message: "Invalid referral code",
        });
      } finally {
        setIsValidatingCode(false);
      }
    };

    const debounce = setTimeout(validateCode, 500);
    return () => clearTimeout(debounce);
  }, [referralCode]);

  const handleSendRequest = async () => {
    const trimmedMessage = requestMessage.trim();
    const trimmedCode = referralCode.trim();

    // ✅ DEBUG: Log what we're about to send
    console.log("🎯 Modal handleSendRequest called:", {
      rawReferralCode: referralCode,
      trimmedCode: trimmedCode,
      codeLength: trimmedCode.length,
      willSendCode: trimmedCode || undefined,
      willSendMessage: trimmedMessage || undefined,
    });

    const success = await onSendRequest(
      trimmedMessage || undefined,
      trimmedCode || undefined // ✅ Make sure this sends the actual value
    );

    if (success) {
      setRequestMessage("");
      setReferralCode("");
      setCodeValidation(null);
      setDialogOpen(false);
    }
  };

  if (!user) {
    return (
      <Button disabled className="w-full" size="lg">
        Sign In Required
      </Button>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <UserPlus className="w-4 h-4 mr-2" />
          Request to Join Trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Request to Join Trip
          </DialogTitle>
          <DialogDescription>
            Send a message to the trip creator for{" "}
            <span className="font-medium text-foreground">
              {tripDestination}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ✅ ADD: Referral Code Field */}
          <div className="space-y-2">
            <Label htmlFor="referralCode">Referral Code (Optional)</Label>
            <div className="relative">
              <Input
                id="referralCode"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="TRIP-XXXXX"
                maxLength={11}
                className={
                  codeValidation?.isValid
                    ? "border-green-500 pr-10"
                    : codeValidation?.isValid === false
                    ? "border-red-500 pr-10"
                    : "pr-10"
                }
              />
              {isValidatingCode && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {!isValidatingCode && codeValidation?.isValid && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
              {!isValidatingCode && codeValidation?.isValid === false && (
                <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
              )}
            </div>
            {codeValidation && (
              <p
                className={`text-xs ${
                  codeValidation.isValid ? "text-green-600" : "text-red-600"
                }`}
              >
                {codeValidation.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Got a referral code from a friend? Enter it here!
            </p>
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Why would you like to join this trip? (Optional)
            </Label>
            <Textarea
              id="message"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Hi! I'd love to join your trip because..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {requestMessage.length}/500 characters
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> A personalized message increases your
              chances of being accepted!
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDialogOpen(false)}
            disabled={requestLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendRequest}
            disabled={requestLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {requestLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Request...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinRequestDialog;
