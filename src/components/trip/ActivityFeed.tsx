import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  MessageCircle,
  Heart,
  UserMinus,
  Clock,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ActivityItem = {
  id: string;
  activity_type: string;
  created_at: string;
  user_id: string;
  message?: string | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

interface ActivityFeedProps {
  tripId: number;
  user: User | null;
  className?: string;
}

const ActivityFeed = ({ tripId, className }: ActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    setupRealtimeSubscription();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("trip_activities")
        .select(
          `
          id,
          activity_type,
          created_at,
          user_id,
          message,
          profiles!trip_activities_user_id_fkey(full_name, avatar_url)
        `
        )
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false })
        .limit(50); // Limit to last 50 activities

      if (error) return;

      setActivities((data as ActivityItem[]) || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`trip-activity-feed-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trip_activities",
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "join":
        return <Users className="w-4 h-4 text-green-600" />;
      case "leave":
        return <UserMinus className="w-4 h-4 text-red-600" />;
      case "like":
        return <Heart className="w-4 h-4 text-pink-600" />;
      case "chat":
        return <MessageCircle className="w-4 h-4 text-blue-600" />;
      case "post":
        return <MessageCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case "join":
        return "bg-green-100 border-green-300";
      case "leave":
        return "bg-red-100 border-red-300";
      case "like":
        return "bg-pink-100 border-pink-300";
      case "chat":
        return "bg-blue-100 border-blue-300";
      case "post":
        return "bg-purple-100 border-purple-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    const userName = activity.profiles?.full_name || "Someone";

    switch (activity.activity_type) {
      case "join":
        return `${userName} joined the trip`;
      case "leave":
        return `${userName} left the trip`;
      case "like":
        return `${userName} liked this trip`;
      case "chat":
        return `${userName} posted in chat`;
      case "post":
        return `${userName} posted a message`;
      default:
        return `${userName} performed an action`;
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">Loading activity feed...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Activity Feed
          <Badge variant="outline" className="ml-2 text-xs">
            {activities.length} activities
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No activities yet</p>
              <p className="text-sm text-muted-foreground">
                Trip activities will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.id} className="relative">
                  {/* Timeline line */}
                  {index < activities.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-8 bg-border" />
                  )}

                  <div className="flex items-start space-x-3">
                    {/* Activity Icon */}
                    <div
                      className={`
    flex items-center justify-center w-12 h-12 rounded-full border-2
    ${getActivityColor(activity.activity_type)}
  `}
                    >
                      {getActivityIcon(activity.activity_type)}
                    </div>

                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {/* ✅ WRAPPED AVATAR WITH PROFILE HOVER CARD */}

                          <Avatar className="w-6 h-6 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                            {activity.profiles?.avatar_url ? (
                              <AvatarImage src={activity.profiles.avatar_url} />
                            ) : (
                              <AvatarFallback>
                                {activity.profiles?.full_name
                                  ?.charAt(0)
                                  ?.toUpperCase() || "U"}
                              </AvatarFallback>
                            )}
                          </Avatar>

                          <p className="text-sm font-medium">
                            {getActivityText(activity)}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {getRelativeTime(activity.created_at)}
                        </span>
                      </div>

                      {/* Show message content for chat activities */}
                      {activity.activity_type === "chat" &&
                        activity.message && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                            "
                            {activity.message.length > 100
                              ? activity.message.substring(0, 100) + "..."
                              : activity.message}
                            "
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
