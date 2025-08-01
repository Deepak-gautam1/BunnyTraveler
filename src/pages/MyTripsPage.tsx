import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

interface MyTripsPageProps {
  user: User | null;
}

interface Trip {
  id: number;
  destination: string;
  start_city: string;
  start_date: string;
  end_date: string;
  description: string | null;
  created_at: string;
  max_group_size: number;
  profiles: { full_name: string; avatar_url: string } | null;
  trip_participants: { user_id: string; joined_at: string }[];
}

const MyTripsPage = ({ user }: MyTripsPageProps) => {
  const { toast } = useToast();
  const [createdTrips, setCreatedTrips] = useState<Trip[]>([]);
  const [joinedTrips, setJoinedTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyTrips();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMyTrips = async () => {
    if (!user) return;

    try {
      // Fetch created trips
      const { data: created, error: createdError } = await supabase
        .from("trips")
        .select(
          `
          id,
          destination,
          start_city,
          start_date,
          end_date,
          description,
          created_at,
          max_group_size,
          profiles!trips_creator_id_fkey(full_name, avatar_url),
          trip_participants(user_id, joined_at)
        `
        )
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      if (createdError) throw createdError;

      // Fetch joined trips
      const { data: joinedData, error: joinedError } = await supabase
        .from("trip_participants")
        .select(
          `
          trip_id,
          joined_at,
          trips!inner(
            id,
            destination,
            start_city,
            start_date,
            end_date,
            description,
            created_at,
            max_group_size,
            creator_id,
            profiles!trips_creator_id_fkey(full_name, avatar_url),
            trip_participants(user_id, joined_at)
          )
        `
        )
        .eq("user_id", user.id);

      if (joinedError) throw joinedError;

      setCreatedTrips(created || []);
      setJoinedTrips(
        joinedData?.map((item) => item.trips).filter(Boolean) || []
      );
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast({
        title: "Error",
        description: "Failed to load your trips",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const TripCard = ({
    trip,
    isCreated = false,
  }: {
    trip: Trip;
    isCreated?: boolean;
  }) => {
    const participantCount = trip.trip_participants?.length || 0;
    const isUpcoming = new Date(trip.start_date) > new Date();

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{trip.destination}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                From {trip.start_city}
              </p>
            </div>
            <div className="flex flex-col items-end space-y-1">
              {isCreated ? (
                <Badge variant="secondary">Created</Badge>
              ) : (
                <Badge variant="outline">Joined</Badge>
              )}
              {isUpcoming ? (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Upcoming
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {participantCount}/{trip.max_group_size}
              </div>
            </div>

            {trip.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {trip.description}
              </p>
            )}

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/trip/${trip.id}`}>View Details</Link>
              </Button>
              {isCreated && (
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">My Trips</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to view and manage your trips
          </p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Trips</h1>
          <p className="text-muted-foreground">
            Manage your created trips and view trips you've joined
          </p>
        </div>
        <Button asChild>
          <Link to="/create-trip">
            <Plus className="w-4 h-4 mr-2" />
            Create New Trip
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="created" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="created" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Created ({createdTrips.length})</span>
          </TabsTrigger>
          <TabsTrigger value="joined" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Joined ({joinedTrips.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="created" className="mt-6">
          {createdTrips.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                No trips created yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Start planning your first adventure and invite others to join!
              </p>
              <Button asChild>
                <Link to="/create-trip">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Trip
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {createdTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} isCreated={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="joined" className="mt-6">
          {joinedTrips.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                No trips joined yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Discover amazing trips created by other travelers!
              </p>
              <Button asChild>
                <Link to="/discover">
                  <MapPin className="w-4 h-4 mr-2" />
                  Discover Trips
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {joinedTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} isCreated={false} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyTripsPage;
