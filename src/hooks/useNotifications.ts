// hooks/useNotifications.ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import type { DbNotification } from "@/types/database";

// Use the generated DB type directly
export type Notification = DbNotification;

export const useNotifications = (user: User | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // ✅ No need to filter .is("deleted_at", null) because deleted rows are gone
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  // ✅ PERMANENT DELETE (Hard Delete)
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete() // Hard delete: removes row from DB
        .eq("id", notificationId);

      if (error) throw error;

      // Update UI immediately
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => {
        const notification = notifications.find((n) => n.id === notificationId);
        return notification && !notification.is_read ? prev - 1 : prev;
      });

      toast({
        title: "Notification deleted",
        description: "The notification has been permanently removed",
      });
    } catch {
      toast({
        title: "Error",
        description: "Could not remove notification. Please try again.",
        variant: "destructive",
      });
    }
  };

  // ✅ PERMANENT DELETE ALL (Hard Delete)
  const deleteAllNotifications = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete() // Hard delete: removes all rows for user
        .eq("user_id", user.id);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);

      toast({
        title: "All notifications deleted",
        description: "Your notification history has been cleared",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete all notifications",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
};
