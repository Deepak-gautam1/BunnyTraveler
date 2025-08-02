// src/hooks/useUnreadMessages.ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export const useUnreadMessages = (user: User | null) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      // Count unread messages where user is the receiver
      const { count, error } = await supabase
        .from("private_messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .is("read_at", null);

      if (error) {
        console.error("Error fetching unread count:", error);
        return;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    } finally {
      setLoading(false);
    }
  };

  // In useUnreadMessages.ts - add custom event listener
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchUnreadCount();

    // ✅ NEW: Listen for manual refresh events
    const handleManualRefresh = () => {
      console.log("🔄 Manual unread count refresh triggered");
      fetchUnreadCount();
    };

    window.addEventListener("unread-count-changed", handleManualRefresh);

    // Real-time subscription for any message changes
    const channel = supabase
      .channel("unread_messages_navigation")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "private_messages",
          filter: `receiver_id=eq.${user.id}`, // Only messages for this user
        },
        (payload) => {
          console.log(
            "🔔 Message update detected:",
            payload.eventType,
            payload
          );

          // ✅ IMPROVED: Handle all event types and force refresh
          if (payload.eventType === "INSERT") {
            console.log("📨 New message received");
            fetchUnreadCount();
          } else if (payload.eventType === "UPDATE") {
            console.log("📖 Message updated (possibly marked as read)");
            // Add a small delay to ensure database consistency
            setTimeout(() => {
              fetchUnreadCount();
            }, 100);
          }
        }
      )
      .subscribe((status) => {
        console.log("🔗 Subscription status:", status);
      });

    return () => {
      console.log("🔌 Cleaning up unread messages subscription");
      window.removeEventListener("unread-count-changed", handleManualRefresh); // ✅ Clean up event listener
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    unreadCount,
    loading,
    refreshCount: fetchUnreadCount,
  };
};
