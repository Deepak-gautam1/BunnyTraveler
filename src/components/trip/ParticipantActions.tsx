// src/components/trip/ParticipantActions.tsx
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  UserMinus,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { ParticipantStats } from "@/hooks/useParticipantManagement";

interface ParticipantActionsProps {
  user: User | null;
  stats: ParticipantStats;
  isParticipant: boolean;
  joinLoading: boolean;
  leaveLoading: boolean;
  tripStatus: string;
  onJoin: () => Promise<boolean>;
  onLeave: () => Promise<boolean>;
  className?: string;
}

const ParticipantActions = ({
  user,
  stats,
  isParticipant,
  joinLoading,
  leaveLoading,
  tripStatus,
  onJoin,
  onLeave,
  className = "",
}: ParticipantActionsProps) => {
  // Don't show join/leave for completed trips
  const isJoinable = tripStatus !== "completed" && tripStatus !== "cancelled";

  if (!user) {
    return (
      <div
        className={`text-center p-4 border rounded-lg bg-muted/30 ${className}`}
      >
        <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-3">
          Sign in to join this adventure
        </p>
        <Button variant="outline" disabled>
          Sign In Required
        </Button>
      </div>
    );
  }

  if (!isJoinable) {
    return (
      <div
        className={`text-center p-4 border rounded-lg bg-muted/30 ${className}`}
      >
        <XCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          This trip is no longer accepting participants
        </p>
        <Badge variant="secondary" className="mt-2">
          {tripStatus === "completed" ? "Trip Completed" : "Trip Cancelled"}
        </Badge>
      </div>
    );
  }

  if (isParticipant) {
    return (
      <div
        className={`text-center p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 ${className}`}
      >
        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
        <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">
          You're part of this adventure!
        </p>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Users className="w-3 h-3 mr-1" />
            Participant
          </Badge>
        </div>
        <Button
          variant="outline"
          onClick={onLeave}
          disabled={leaveLoading}
          className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-300"
        >
          {leaveLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Leaving...
            </>
          ) : (
            <>
              <UserMinus className="w-4 h-4 mr-2" />
              Leave Trip
            </>
          )}
        </Button>
      </div>
    );
  }

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
          <Users className="w-4 h-4 mr-2" />
          No Spots Available
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 ${className}`}
    >
      <UserPlus className="w-8 h-8 mx-auto mb-2 text-blue-600" />
      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
        Join this adventure!
      </p>
      <div className="flex items-center justify-center gap-2 mb-3">
        <Badge variant="outline" className="text-green-600 border-green-600">
          {stats.spots_remaining} spots left
        </Badge>
        {stats.spots_remaining <= 3 && (
          <Badge
            variant="outline"
            className="text-orange-600 border-orange-600"
          >
            <Clock className="w-3 h-3 mr-1" />
            Filling Fast
          </Badge>
        )}
      </div>
      <Button
        onClick={onJoin}
        disabled={joinLoading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {joinLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Joining...
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Join Trip
          </>
        )}
      </Button>
    </div>
  );
};

export default ParticipantActions;
