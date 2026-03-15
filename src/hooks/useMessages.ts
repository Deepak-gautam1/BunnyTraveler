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
            .maybeSingle();

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
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  // ✅ IMPROVED: Fetch messages with better read handling
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

      // ✅ IMPROVED: Mark received messages as read and get count of updated messages
      const { count: updatedCount, error: updateError } = await supabase
        .from("private_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", participantId)
        .eq("receiver_id", user.id)
        .is("read_at", null)
        .select("*", { count: "exact" });

      if (!updateError && updatedCount && updatedCount > 0) {

        // ✅ OPTIMIZED: Update conversations state directly instead of refetching
        setConversations((prev) =>
          prev.map((conv) =>
            conv.participantId === participantId
              ? {
                  ...conv,
                  unreadCount: Math.max(0, conv.unreadCount - updatedCount),
                }
              : conv
          )
        );
      }
    } catch {
      // silently fail
    }
  };

  // ✅ OPTIMIZED: Send message with optimistic updates to prevent refreshing
  const sendMessage = async (
    receiverId: string,
    content: string,
    tripId?: number
  ) => {
    if (!user || !content.trim()) return;

    const messageContent = content.trim();
    const tempId = Date.now();

    try {
      // ✅ Create optimistic message first
      const optimisticMessage: MessageWithDetails = {
        id: tempId,
        sender_id: user.id,
        receiver_id: receiverId,
        trip_id: tripId || null,
        content: messageContent,
        created_at: new Date().toISOString(),
        read_at: null,
        isOwn: true,
      };

      // ✅ Add to messages immediately (optimistic update)
      setMessages((prev) => [...prev, optimisticMessage]);

      // ✅ Update conversations optimistically - no flicker
      setConversations((prev) =>
        prev.map((conv) =>
          conv.participantId === receiverId
            ? {
                ...conv,
                lastMessage: messageContent,
                lastMessageTime: "Just now",
              }
            : conv
        )
      );

      // Send to database
      const { data, error } = await supabase
        .from("private_messages")
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          trip_id: tripId || null,
          content: messageContent,
        })
        .select("*")
        .maybeSingle();

      if (error) throw error;

      // ✅ Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? ({ ...data, isOwn: true } as MessageWithDetails)
            : msg
        )
      );

      // ✅ Update conversation with real timestamp
      setConversations((prev) =>
        prev.map((conv) =>
          conv.participantId === receiverId
            ? {
                ...conv,
                lastMessage: messageContent,
                lastMessageTime: getTimeAgo(data.created_at),
              }
            : conv
        )
      );
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      throw error;
    }
  };

  // ✅ OPTIMIZED: Smart real-time subscriptions to prevent unnecessary refreshes
  useEffect(() => {
    if (!user) return;

    const messageChannel = supabase
      .channel("private_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
        },
        (payload) => {
          const newMessage = payload.new as any;


          // ✅ Only update current conversation if viewing it
          if (
            selectedParticipantId &&
            (newMessage.sender_id === selectedParticipantId ||
              newMessage.receiver_id === selectedParticipantId)
          ) {
            // Add new message to current conversation only if it's not our own optimistic update
            const isOwnMessage = newMessage.sender_id === user.id;
            if (!isOwnMessage) {
              setMessages((prev) => [
                ...prev,
                {
                  ...newMessage,
                  isOwn: false,
                },
              ]);
            }
          }

          // ✅ Smart conversation updates - only update specific conversation
          const partnerId =
            newMessage.sender_id === user.id
              ? newMessage.receiver_id
              : newMessage.sender_id;

          setConversations((prev) => {
            const updatedConversations = prev.map((conv) => {
              if (conv.participantId === partnerId) {
                return {
                  ...conv,
                  lastMessage: newMessage.content,
                  lastMessageTime: getTimeAgo(newMessage.created_at),
                  // Increment unread count only if it's not our own message
                  unreadCount:
                    newMessage.sender_id === user.id
                      ? conv.unreadCount
                      : conv.unreadCount + 1,
                };
              }
              return conv;
            });

            // Sort conversations by latest message
            return updatedConversations.sort((a, b) => {
              if (a.participantId === partnerId) return -1;
              if (b.participantId === partnerId) return 1;
              return 0;
            });
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "private_messages",
        },
        (payload) => {
          const updatedMessage = payload.new as any;
          const oldMessage = payload.old as any;

          // ✅ Handle read status updates
          if (!oldMessage.read_at && updatedMessage.read_at) {


            // Update read status in current messages if viewing this conversation
            if (
              selectedParticipantId &&
              (updatedMessage.sender_id === selectedParticipantId ||
                updatedMessage.receiver_id === selectedParticipantId)
            ) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === updatedMessage.id
                    ? { ...msg, read_at: updatedMessage.read_at }
                    : msg
                )
              );
            }
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
