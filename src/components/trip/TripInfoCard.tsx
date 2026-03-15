import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, Heart, Clock, IndianRupee } from "lucide-react";
import { TripDetail, ParticipantStats } from "@/types/trip";

interface TripInfoCardProps {
  trip: TripDetail;
  stats: ParticipantStats;
  interestedCount: number;
  daysUntilTrip: number;
  formatDateRange: (start: string, end: string) => string;
}

const TripInfoCard = ({
  trip,
  stats,
  interestedCount,
  daysUntilTrip,
  formatDateRange,
}: TripInfoCardProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{trip.destination}</h1>
              <div className="flex items-center text-muted-foreground mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                <span>From {trip.start_city}</span>
              </div>
            </div>
            {daysUntilTrip <= 3 && daysUntilTrip >= 0 && (
              <Badge variant="destructive">
                <Clock className="w-3 h-3 mr-1" />
                {daysUntilTrip}d left
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDateRange(trip.start_date, trip.end_date)}
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {stats.current_participants}/{stats.max_participants} joined
            </div>
            <div className="flex items-center">
              <Heart className="w-4 h-4 mr-1 text-red-500" />
              <span>{interestedCount} interested</span>
            </div>
          </div>

          {trip.travel_style && trip.travel_style.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {trip.travel_style.slice(0, 4).map((style, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {style}
                </Badge>
              ))}
              {trip.travel_style.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{trip.travel_style.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {trip.budget_per_person && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <IndianRupee className="w-3 h-3 mr-1" />
              {trip.budget_per_person.toLocaleString()} per person
            </Badge>
          )}

          {stats.spots_remaining > 0 ? (
            <Badge variant="outline" className="text-green-600 border-green-600">
              {stats.spots_remaining} spots left
            </Badge>
          ) : (
            <Badge variant="destructive">Trip full</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TripInfoCard;
