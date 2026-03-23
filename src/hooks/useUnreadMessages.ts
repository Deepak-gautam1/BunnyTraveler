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
          return;
      }

      setUnreadCount(count || 0);
    } catch {
      // silently fail
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
          if (payload.eventType === "INSERT") {
            fetchUnreadCount();
          } else if (payload.eventType === "UPDATE") {
            setTimeout(() => { fetchUnreadCount(); }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener("unread-count-changed", handleManualRefresh);
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    unreadCount,
    loading,
    refreshCount: fetchUnreadCount,
  };
};
