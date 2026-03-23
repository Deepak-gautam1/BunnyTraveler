// src/components/trip/ParticipantsList.tsx
import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Crown,
  Calendar,
  MoreVertical,
  UserMinus,
  MessageCircle,
  UserCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard";
import {
  TripParticipant,
  ParticipantStats,
} from "@/hooks/useParticipantManagement";

interface ParticipantsListProps {
  participants: TripParticipant[];
  stats: ParticipantStats;
  loading: boolean;
  currentUser: User | null;
  tripCreatorId: string;
  onRemoveParticipant: (userId: string) => Promise<boolean>;
  onChatWithParticipant?: (userId: string) => void;
  className?: string;
}

const ParticipantsList = ({
  participants,
  stats,
  loading,
  currentUser,
  tripCreatorId,
  onRemoveParticipant,
  onChatWithParticipant,
  className = "",
}: ParticipantsListProps) => {
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<TripParticipant | null>(null);
  const [removing, setRemoving] = useState(false);

  const isCreator = currentUser?.id === tripCreatorId;

  // ✅ FIXED: Delay dialog opening to let dropdown close
  const handleRemoveClick = (participant: TripParticipant) => {
    setSelectedParticipant(participant);

    // Delay opening dialog to avoid focus conflict
    setTimeout(() => {
      setRemoveDialogOpen(true);
    }, 100);
  };

  // ✅ FIXED: Proper async handling
  const handleConfirmRemove = async () => {
    if (!selectedParticipant) return;

    setRemoving(true);

    try {
      const success = await onRemoveParticipant(selectedParticipant.user_id);

      if (success) {
        setRemoveDialogOpen(false);
        setSelectedParticipant(null);
      }
    } catch {
      // silently fail
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading participants...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participants ({stats.current_participants})
            </CardTitle>
            <div className="flex items-center gap-2">
              {stats.spots_remaining > 0 ? (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600"
                >
                  {stats.spots_remaining} spots left
                </Badge>
              ) : (
                <Badge variant="destructive">Trip Full</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No participants yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to join this adventure!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => {
                const isCurrentUser = currentUser?.id === participant.user_id;
                const isParticipantCreator =
                  participant.user_id === tripCreatorId;

                return (
                  <div
                    key={participant.user_id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <ProfileHoverCard userId={participant.user_id}>
                        <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                          <AvatarImage
                            src={participant.profiles?.avatar_url || ""}
                            alt={participant.profiles?.full_name || "User"}
                          />
                          <AvatarFallback>
                            {participant.profiles?.full_name
                              ?.charAt(0)
                              .toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </ProfileHoverCard>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">
                            {participant.profiles?.full_name || "Anonymous"}
                          </p>

                          {isParticipantCreator && (
                            <Badge variant="default" className="text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              Creator
                            </Badge>
                          )}

                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              <UserCheck className="w-3 h-3 mr-1" />
                              You
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          Joined{" "}
                          {participant.joined_at ? formatDistanceToNow(
                            new Date(participant.joined_at),
                            { addSuffix: true }
                          ) : "recently"}
                        </div>
                      </div>
                    </div>

                    {/* Actions (only for trip creator and not for themselves) */}
                    {isCreator && !isCurrentUser && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        {/* ✅ FIXED: Add proper focus handling */}
                        <DropdownMenuContent
                          align="end"
                          onCloseAutoFocus={(e) => {
                            e.preventDefault(); // Prevent focus trap
                          }}
                        >
                          {onChatWithParticipant && (
                            <DropdownMenuItem
                              onClick={() =>
                                onChatWithParticipant(participant.user_id)
                              }
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                          )}

                          {/* ✅ FIXED: Use onSelect instead of onClick */}
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault(); // Prevent default menu close
                              handleRemoveClick(participant);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <UserMinus className="w-4 h-4 mr-2" />
                            Remove from Trip
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Trip Statistics */}
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-primary">
                  {stats.current_participants}
                </p>
                <p className="text-xs text-muted-foreground">Joined</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-blue-600">
                  {stats.max_participants}
                </p>
                <p className="text-xs text-muted-foreground">Max Size</p>
              </div>
              <div>
                <p
                  className={`text-lg font-semibold ${
                    stats.spots_remaining > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {stats.spots_remaining}
                </p>
                <p className="text-xs text-muted-foreground">Spots Left</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ FIXED: Remove Participant Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault(); // Prevent focus issues when closing
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-red-500" />
              Remove Participant?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium">
                {selectedParticipant?.profiles?.full_name || "this participant"}
              </span>{" "}
              from the trip? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700"
            >
              {removing ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Participant"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ParticipantsList;
