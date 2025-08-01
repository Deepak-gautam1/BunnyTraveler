import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { User } from "@supabase/supabase-js";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  X,
  Users,
  MessageCircle,
  Calendar,
  MapPin,
} from "lucide-react";

interface NotificationsDropdownProps {
  user: User | null;
}

const NotificationsDropdown = ({ user }: NotificationsDropdownProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications(user);

  if (!user) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "trip_join":
        return <Users className="w-4 h-4 text-green-600" />;
      case "trip_message":
        return <MessageCircle className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.related_trip_id) {
      navigate(`/trip/${notification.related_trip_id}`);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast({
      title: "All notifications marked as read",
      description: "You're all caught up!",
    });
  };

  const handleDeleteAll = async () => {
    await deleteAllNotifications();
    toast({
      title: "All notifications deleted",
      description: "Your notification history has been cleared.",
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </DropdownMenuLabel>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />

            {/* Action Buttons */}
            <div className="flex gap-2 p-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="flex-1 text-xs"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Mark All Read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteAll}
                  className="flex-1 text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete All
                </Button>
              )}
            </div>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Notifications List */}
        <ScrollArea className="h-80">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-8">
              <Bell className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                No notifications yet
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                You'll see updates when someone joins your trips
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative group ${
                  !notification.is_read
                    ? "bg-blue-50 hover:bg-blue-100"
                    : "hover:bg-muted"
                }`}
              >
                <DropdownMenuItem
                  className="p-4 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex space-x-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getTimeAgo(notification.created_at)}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    )}
                  </div>
                </DropdownMenuItem>

                {/* Individual notification actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="w-6 h-6 p-0"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="w-6 h-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
