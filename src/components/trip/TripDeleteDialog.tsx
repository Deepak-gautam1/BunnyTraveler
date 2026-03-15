import { Button } from "@/components/ui/button";
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
import { Trash2 } from "lucide-react";
import { ParticipantStats } from "@/types/trip";

interface TripDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destination: string;
  startCity: string;
  stats: ParticipantStats;
  loading: boolean;
  onConfirm: () => void;
}

const TripDeleteDialog = ({
  open,
  onOpenChange,
  destination,
  startCity,
  stats,
  loading,
  onConfirm,
}: TripDeleteDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            Delete Trip?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this trip? This action cannot be undone.
          </AlertDialogDescription>
          <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium text-foreground">{destination}</p>
            <p className="text-muted-foreground">
              From {startCity} • {stats.current_participants} participants
            </p>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Deleting..." : "Delete Trip"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TripDeleteDialog;
