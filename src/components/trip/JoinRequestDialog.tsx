// src/components/trip/JoinRequestDialog.tsx
import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
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
import { UserPlus, Mail, Loader2 } from "lucide-react";

interface JoinRequestDialogProps {
  user: User | null;
  tripDestination: string;
  onSendRequest: (message?: string) => Promise<boolean>;
  requestLoading: boolean;
}

const JoinRequestDialog = ({
  user,
  tripDestination,
  onSendRequest,
  requestLoading,
}: JoinRequestDialogProps) => {
  const [requestMessage, setRequestMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSendRequest = async () => {
    const success = await onSendRequest(requestMessage.trim() || undefined);
    if (success) {
      setRequestMessage("");
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
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Why would you like to join this trip? (Optional)
            </label>
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
