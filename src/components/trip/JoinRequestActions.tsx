// src/components/trip/JoinRequestActions.tsx
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
  Mail,
} from "lucide-react";
import { ParticipantStats } from "@/hooks/useParticipantManagement";
import { JoinRequest } from "@/hooks/useJoinRequestManagement";
import { supabase } from "@/integrations/supabase/client";

interface JoinRequestActionsProps {
  user: User | null;
  stats: ParticipantStats;
  isParticipant: boolean;
  userRequest: JoinRequest | null;
  requestLoading: boolean;
  tripStatus: string;
  onSendRequest: (message?: string, referralCode?: string) => Promise<boolean>;
  onCancelRequest: () => Promise<boolean>;
  className?: string;
}

const JoinRequestActions = ({
  user,
  stats,
  isParticipant,
  userRequest,
  requestLoading,
  tripStatus,
  onSendRequest,
  onCancelRequest,
  className = "",
}: JoinRequestActionsProps) => {
  const [requestMessage, setRequestMessage] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // ✅ ADD: Referral code validation
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  // ✅ ADD: Validate referral code
  useEffect(() => {
    const validateCode = async () => {
      if (!referralCode || referralCode.length < 6) {
        setCodeValidation(null);
        return;
      }

      setIsValidatingCode(true);

      try {
        const { data } = await supabase
          .from("trips")
          .select("id, destination")
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

  const isJoinable = tripStatus !== "completed" && tripStatus !== "cancelled";

  // User not signed in
  if (!user) {
    return (
      <div
        className={`text-center p-4 border rounded-lg bg-muted/30 ${className}`}
      >
        <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-3">
          Sign in to request to join this adventure
        </p>
        <Button variant="outline" disabled>
          Sign In Required
        </Button>
      </div>
    );
  }

  // Trip not joinable
  if (!isJoinable) {
    return (
      <div
        className={`text-center p-4 border rounded-lg bg-muted/30 ${className}`}
      >
        <XCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          This trip is no longer accepting join requests
        </p>
        <Badge variant="secondary" className="mt-2">
          {tripStatus === "completed" ? "Trip Completed" : "Trip Cancelled"}
        </Badge>
      </div>
    );
  }

  // User is already a participant
  if (isParticipant) {
    return (
      <div
        className={`text-center p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 ${className}`}
      >
        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
        <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
          You're part of this adventure!
        </p>
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Participant
        </Badge>
      </div>
    );
  }

  // Trip is full
  if (stats.is_full) {
    return (
      <div
        className={`text-center p-4 border rounded-lg bg-red-50 dark:bg-red-950/20 ${className}`}
      >
        <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
        <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
          Trip is Full
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Maximum capacity reached ({stats.max_participants} participants)
        </p>
        <Button disabled className="w-full">
          No Spots Available
        </Button>
      </div>
    );
  }

  // User has a pending request
  if (userRequest?.status === "pending") {
    return (
      <div
        className={`text-center p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20 ${className}`}
      >
        <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          Request Pending
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Waiting for trip creator to respond
        </p>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-600"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending Approval
          </Badge>
        </div>
        <Button
          variant="outline"
          onClick={onCancelRequest}
          disabled={requestLoading}
          className="w-full"
        >
          {requestLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Cancelling...
            </>
          ) : (
            "Cancel Request"
          )}
        </Button>
      </div>
    );
  }

  // User's request was rejected
  if (userRequest?.status === "rejected") {
    return (
      <div
        className={`text-center p-4 border rounded-lg bg-red-50 dark:bg-red-950/20 ${className}`}
      >
        <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
        <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
          Request Rejected
        </p>
        {userRequest.response_message && (
          <p className="text-xs text-muted-foreground mb-3">
            "{userRequest.response_message}"
          </p>
        )}
        <Badge variant="destructive" className="mb-3">
          Not Approved
        </Badge>
      </div>
    );
  }

  // User can send a join request
  const handleSendRequest = async () => {
    const success = await onSendRequest(
      requestMessage.trim() || undefined,
      referralCode.trim() || undefined
    );
    if (success) {
      setRequestMessage("");
      setReferralCode("");
      setCodeValidation(null);
      setDialogOpen(false);
    }
  };

  return (
    <div
      className={`text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 ${className}`}
    >
      <UserPlus className="w-8 h-8 mx-auto mb-2 text-blue-600" />
      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
        Request to join this adventure!
      </p>
      <div className="flex items-center justify-center gap-2 mb-3">
        <Badge variant="outline" className="text-green-600 border-green-600">
          {stats.spots_remaining} spots available
        </Badge>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <Mail className="w-4 h-4 mr-2" />
            Send Join Request
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Join Trip</DialogTitle>
            <DialogDescription>
              Send a message to the trip creator explaining why you'd like to
              join this adventure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* ✅ ADD: Referral Code Field */}
            <div className="space-y-2">
              <Label htmlFor="referralCode">Referral Code (Optional)</Label>
              <div className="relative">
                <Input
                  id="referralCode"
                  value={referralCode}
                  onChange={(e) =>
                    setReferralCode(e.target.value.toUpperCase())
                  }
                  placeholder="TRIP-XXXXX"
                  maxLength={11}
                  className={
                    codeValidation?.isValid
                      ? "border-green-500"
                      : codeValidation?.isValid === false
                      ? "border-red-500"
                      : ""
                  }
                />
                {isValidatingCode && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
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
                Got a code from a friend? Enter it here!
              </p>
            </div>

            {/* Message Field */}
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Hi! I'd love to join your trip because..."
                className="min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {requestMessage.length}/500 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendRequest} disabled={requestLoading}>
              {requestLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
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
    </div>
  );
};

export default JoinRequestActions;
