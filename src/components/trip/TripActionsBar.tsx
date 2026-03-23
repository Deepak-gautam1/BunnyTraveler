import { Button } from "@/components/ui/button";
import { MessageCircle, Share2, Clock, XCircle } from "lucide-react";
import { User as UserType } from "@supabase/supabase-js";
import JoinRequestDialog from "@/components/trip/JoinRequestDialog";

interface JoinRequest {
  status: string;
}

interface TripActionsBarProps {
  user: UserType | null;
  isCreator: boolean;
  isJoined: boolean;
  joinLoading: boolean;
  spotsLeft: number;
  userRequest: JoinRequest | null;
  requestLoading: boolean;
  tripDestination: string;
  onLeave: () => void;
  onShare: () => void;
  onSendRequest: (message?: string, referralCode?: string) => Promise<boolean>;
}

const TripActionsBar = ({
  user,
  isCreator,
  isJoined,
  joinLoading,
  spotsLeft,
  userRequest,
  requestLoading,
  tripDestination,
  onLeave,
  onShare,
  onSendRequest,
}: TripActionsBarProps) => {
  if (!user) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
      <div className="max-w-2xl mx-auto">
        {isCreator ? (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              Group Chat
            </Button>
            <Button variant="outline" className="flex-1" onClick={onShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share Trip
            </Button>
          </div>
        ) : isJoined ? (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onLeave} disabled={joinLoading} className="flex-1">
              Leave Trip
            </Button>
            <Button className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with Group
            </Button>
          </div>
        ) : spotsLeft > 0 ? (
          <>
            {userRequest?.status === "pending" ? (
              <Button disabled className="w-full" size="lg">
                <Clock className="w-4 h-4 mr-2" />
                Request Pending
              </Button>
            ) : userRequest?.status === "rejected" ? (
              <Button disabled className="w-full" size="lg" variant="destructive">
                <XCircle className="w-4 h-4 mr-2" />
                Request Rejected
              </Button>
            ) : (
              <JoinRequestDialog
                user={user}
                tripDestination={tripDestination}
                onSendRequest={onSendRequest}
                requestLoading={requestLoading}
              />
            )}
          </>
        ) : (
          <Button disabled className="w-full" size="lg">
            Trip is Full
          </Button>
        )}
      </div>
    </div>
  );
};

export default TripActionsBar;
