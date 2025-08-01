import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export interface ConversationWithDetails {
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  tripName?: string;
  tripId?: number;
}

export interface MessageWithDetails {
  id: number;
  sender_id: string;
  receiver_id: string;
  trip_id?: number;
  content: string;
  created_at: string;
  read_at?: string;
  isOwn: boolean;
}

export const useMessages = (user: User | null) => {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(
    []
  );
  const [messages, setMessages] = useState<MessageWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);

  // ✅ UPDATED: Fetch conversations using your private_messages table
  const fetchConversations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get all unique conversation partners
      const { data: messagesData, error } = await supabase
        .from("private_messages")
        .select(
          `
          sender_id,
          receiver_id,
          trip_id,
          content,
          created_at,
          read_at,
          trips(destination)
        `
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group messages by conversation partner
      const conversationMap = new Map<string, any>();

      for (const message of messagesData || []) {
        const partnerId =
          message.sender_id === user.id
            ? message.receiver_id
            : message.sender_id;

        if (!conversationMap.has(partnerId)) {
          // Get partner's profile
          const { data: partnerProfile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", partnerId)
            .single();

          // Count unread messages
          const { count: unreadCount } = await supabase
            .from("private_messages")
            .select("*", { count: "exact", head: true })
            .eq("sender_id", partnerId)
            .eq("receiver_id", user.id)
            .is("read_at", null);

          conversationMap.set(partnerId, {
            participantId: partnerId,
            participantName: partnerProfile?.full_name || "Unknown User",
            participantAvatar: partnerProfile?.avatar_url || "",
            lastMessage: message.content,
            lastMessageTime: getTimeAgo(message.created_at),
            unreadCount: unreadCount || 0,
            tripName: message.trips?.destination,
            tripId: message.trip_id,
            lastMessageDate: message.created_at,
          });
        }
      }

      // Convert to array and sort by last message time
      const conversationsArray = Array.from(conversationMap.values()).sort(
        (a, b) =>
          new Date(b.lastMessageDate).getTime() -
          new Date(a.lastMessageDate).getTime()
      );

      setConversations(conversationsArray);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Fetch messages between user and selected participant
  const fetchMessages = async (participantId: string) => {
    if (!user) return;

    try {
      const { data: messagesData, error } = await supabase
        .from("private_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      const messagesWithDetails: MessageWithDetails[] = (
        messagesData || []
      ).map((msg) => ({
        ...msg,
        isOwn: msg.sender_id === user.id,
      }));

      setMessages(messagesWithDetails);

      // Mark received messages as read
      await supabase
        .from("private_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", participantId)
        .eq("receiver_id", user.id)
        .is("read_at", null);

      // Refresh conversations to update unread count
      await fetchConversations();
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // ✅ UPDATED: Send message using your table structure
  const sendMessage = async (
    receiverId: string,
    content: string,
    tripId?: number
  ) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase.from("private_messages").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        trip_id: tripId || null,
        content: content.trim(),
      });

      if (error) throw error;

      // Refresh messages and conversations
      await fetchMessages(receiverId);
      await fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  // ✅ HELPER: Time ago calculation
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

  // ✅ UPDATED: Real-time subscriptions for your table
  useEffect(() => {
    if (!user) return;

    const messageChannel = supabase
      .channel("private_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "private_messages",
        },
        (payload) => {
          // Refresh conversations when new message arrives
          fetchConversations();

          // If currently viewing conversation with the sender, refresh messages
          if (
            selectedParticipantId &&
            (payload.new?.sender_id === selectedParticipantId ||
              payload.new?.receiver_id === selectedParticipantId)
          ) {
            fetchMessages(selectedParticipantId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [user?.id, selectedParticipantId]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user?.id]);

  return {
    conversations,
    messages,
    loading,
    selectedParticipantId,
    setSelectedParticipantId,
    fetchMessages,
    sendMessage,
    fetchConversations,
  };
};
