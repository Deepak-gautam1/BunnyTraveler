import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard"; // ADD THIS IMPORT

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Send,
  MessageCircle,
  Smile,
  MoreHorizontal,
  Lock,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

// Available reaction emojis
const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

type MessageReaction = {
  id: string;
  message_id: number;
  user_id: string;
  emoji: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
};

type Message = {
  id: number;
  content: string;
  created_at: string;
  sender_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  message_reactions?: MessageReaction[];
};

type Activity = {
  id: string;
  activity_type: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string | null;
  } | null;
};

// ✅ NEW: Updated interface to include permission props
interface TripChatProps {
  tripId: number;
  user: User | null;
  userRequest?: {
    status: "pending" | "approved" | "rejected" | null;
  } | null;
  isParticipant?: boolean;
  tripCreatorId?: string;
}

const TripChat = ({
  tripId,
  user,
  userRequest,
  isParticipant = false,
  tripCreatorId,
}: TripChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // ✅ NEW: Chat permissions logic
  const getChatPermissions = () => {
    if (!user) {
      return {
        canChat: false,
        reason: "sign_in_required",
        message: "Please sign in to participate in group chat",
        icon: Lock,
      };
    }

    // Trip creator can always chat
    if (user.id === tripCreatorId) {
      return {
        canChat: true,
        reason: "creator",
        message: "",
        icon: MessageCircle,
      };
    }

    // Check if user is an approved participant
    if (isParticipant) {
      return {
        canChat: true,
        reason: "approved_participant",
        message: "",
        icon: MessageCircle,
      };
    }

    // Check join request status
    if (userRequest) {
      switch (userRequest.status) {
        case "pending":
          return {
            canChat: false,
            reason: "pending_approval",
            message:
              "Your join request is pending approval. You can chat once approved by the trip creator.",
            icon: Clock,
          };
        case "rejected":
          return {
            canChat: false,
            reason: "request_rejected",
            message:
              "Your join request was rejected. You cannot participate in group chat.",
            icon: XCircle,
          };
        case "approved":
          return {
            canChat: true,
            reason: "approved",
            message: "",
            icon: MessageCircle,
          };
        default:
          return {
            canChat: false,
            reason: "no_request",
            message: "Send a join request to participate in group chat.",
            icon: Lock,
          };
      }
    }

    // Default: user hasn't sent a join request
    return {
      canChat: false,
      reason: "no_request",
      message: "Send a join request to participate in group chat.",
      icon: Lock,
    };
  };

  const chatPermissions = getChatPermissions();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch messages function
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          id,
          content,
          created_at,
          sender_id,
          profiles!messages_sender_id_fkey(full_name, avatar_url),
          message_reactions(
            id,
            emoji,
            user_id,
            created_at,
            profiles!message_reactions_user_id_fkey(full_name)
          )
        `
        )
        .eq("trip_id", tripId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch activities function
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
          profiles!trip_activities_user_id_fkey(full_name)
        `
        )
        .eq("trip_id", tripId)
        .in("activity_type", ["join", "leave", "like"])
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching activities:", error);
        return;
      }

      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchMessages();
    fetchActivities();

    // Set up real-time subscription for messages
    const messageSubscription = supabase
      .channel(`trip-messages-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "messages",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          console.log("Message event:", payload.eventType, payload.new);
          // Always refetch messages to get the latest data with relations
          fetchMessages();
        }
      )
      .subscribe();

    // Set up real-time subscription for message reactions
    const reactionSubscription = supabase
      .channel(`trip-reactions-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, DELETE)
          schema: "public",
          table: "message_reactions",
        },
        (payload) => {
          console.log("Reaction event:", payload.eventType, payload);
          // Always refetch messages to get updated reactions
          fetchMessages();
        }
      )
      .subscribe();

    // Set up real-time subscription for activities
    const activitySubscription = supabase
      .channel(`trip-activities-${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trip_activities",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          console.log("Activity event:", payload.new);
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(reactionSubscription);
      supabase.removeChannel(activitySubscription);
    };
  }, [tripId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activities]);

  // ✅ UPDATED: sendMessage with permission check
  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;

    // ✅ NEW: Check chat permissions before sending
    if (!chatPermissions.canChat) {
      toast({
        title: "Cannot send message",
        description: chatPermissions.message,
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      // Send message
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          trip_id: tripId,
          sender_id: user.id,
          content: newMessage.trim(),
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Create chat activity
      await supabase.from("trip_activities").insert({
        trip_id: tripId,
        user_id: user.id,
        activity_type: "chat",
        message: newMessage.trim(),
      });

      setNewMessage("");

      // Immediately fetch messages to show the new message
      setTimeout(() => {
        fetchMessages();
      }, 100);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // ✅ UPDATED: addReaction with permission check
  const addReaction = async (messageId: number, emoji: string) => {
    if (!user) {
      toast({
        title: "Please sign in to react to messages",
        variant: "destructive",
      });
      return;
    }

    // ✅ NEW: Check chat permissions for reactions
    if (!chatPermissions.canChat) {
      toast({
        title: "Cannot react to messages",
        description: chatPermissions.message,
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc(
        "toggle_message_reaction" as any,
        {
          p_message_id: messageId,
          p_user_id: user.id,
          p_emoji: emoji,
        }
      );

      if (error) throw error;

      console.log("Reaction toggled:", data?.[0]?.action, "for emoji:", emoji);

      // Immediately fetch messages to show updated reactions
      setTimeout(() => {
        fetchMessages();
      }, 100);
    } catch (error: any) {
      console.error("Error toggling reaction:", error);
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Group reactions by emoji
  const groupReactions = (reactions: MessageReaction[] = []) => {
    const grouped: {
      [emoji: string]: { count: number; users: string[]; userReacted: boolean };
    } = {};

    reactions.forEach((reaction) => {
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = { count: 0, users: [], userReacted: false };
      }
      grouped[reaction.emoji].count++;
      grouped[reaction.emoji].users.push(
        reaction.profiles?.full_name || "Someone"
      );
      if (reaction.user_id === user?.id) {
        grouped[reaction.emoji].userReacted = true;
      }
    });

    return grouped;
  };

  // Combine messages and activities and sort by time
  const combinedItems = [
    ...messages.map((msg) => ({ ...msg, type: "message" as const })),
    ...activities.map((act) => ({ ...act, type: "activity" as const })),
  ].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="text-center">Loading chat...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          Group Chat
          {/* ✅ NEW: Show restricted badge if user can't chat */}
          {!chatPermissions.canChat && (
            <Badge
              variant="outline"
              className="ml-2 text-orange-600 border-orange-600"
            >
              <Lock className="w-3 h-3 mr-1" />
              Restricted
            </Badge>
          )}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({messages.length} messages)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col h-[400px]">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {combinedItems.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                combinedItems.map((item) => (
                  <div key={`${item.type}-${item.id}`}>
                    {item.type === "message" ? (
                      <div className="group flex space-x-3 hover:bg-muted/30 p-2 rounded-lg transition-colors">
                        <Avatar className="w-8 h-8">
                          {item.profiles?.avatar_url ? (
                            <AvatarImage src={item.profiles.avatar_url} />
                          ) : (
                            <AvatarFallback>
                              {item.profiles?.full_name
                                ?.charAt(0)
                                ?.toUpperCase() || "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">
                              {item.profiles?.full_name || "Anonymous"}
                            </span>
                            {/* ✅ NEW: Show creator badge */}
                            {item.sender_id === tripCreatorId && (
                              <Badge variant="outline" className="text-xs">
                                Creator
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(item.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-sm break-words mb-2">
                            {item.content}
                          </p>

                          {/* Message Reactions */}
                          <div className="flex items-center space-x-2">
                            {/* Existing Reactions */}
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(
                                groupReactions(item.message_reactions)
                              ).map(([emoji, data]) => (
                                <button
                                  key={emoji}
                                  onClick={() => addReaction(item.id, emoji)}
                                  disabled={!chatPermissions.canChat} // ✅ NEW: Disable if can't chat
                                  className={`
                                    inline-flex items-center px-2 py-1 rounded-full text-xs
                                    transition-colors hover:bg-muted
                                    ${
                                      data.userReacted
                                        ? "bg-blue-100 border border-blue-300 text-blue-700"
                                        : "bg-muted/50 border border-border"
                                    }
                                    ${
                                      !chatPermissions.canChat
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                    }
                                  `}
                                  title={`${data.users.join(
                                    ", "
                                  )} reacted with ${emoji}`}
                                >
                                  <span className="mr-1">{emoji}</span>
                                  <span>{data.count}</span>
                                </button>
                              ))}
                            </div>

                            {/* Reaction Popover - Only show if user can chat */}
                            {chatPermissions.canChat && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                  >
                                    <Smile className="w-3 h-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-2"
                                  align="start"
                                >
                                  <div className="flex space-x-1">
                                    {REACTIONS.map((emoji) => (
                                      <Button
                                        key={emoji}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-muted"
                                        onClick={() =>
                                          addReaction(item.id, emoji)
                                        }
                                      >
                                        <span className="text-lg">{emoji}</span>
                                      </Button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center my-2">
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {item.profiles?.full_name || "Someone"}{" "}
                          {item.activity_type === "join"
                            ? "joined the trip"
                            : item.activity_type === "leave"
                            ? "left the trip"
                            : "liked the trip"}{" "}
                          •{" "}
                          {formatDistanceToNow(new Date(item.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* ✅ UPDATED: Message input area with permission checks */}
          {user ? (
            chatPermissions.canChat ? (
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {/* Character count */}
                {newMessage && (
                  <div className="text-right mt-1">
                    <span className="text-xs text-muted-foreground">
                      {newMessage.length}/1000
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* ✅ NEW: Permission denied message */
              <div className="p-4 border-t">
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <chatPermissions.icon className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                        {chatPermissions.reason === "sign_in_required" &&
                          "Sign In Required"}
                        {chatPermissions.reason === "pending_approval" &&
                          "Approval Pending"}
                        {chatPermissions.reason === "request_rejected" &&
                          "Access Denied"}
                        {chatPermissions.reason === "no_request" &&
                          "Join Request Required"}
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        {chatPermissions.message}
                      </p>
                      {chatPermissions.reason === "pending_approval" && (
                        <div className="flex items-center gap-1 mt-2">
                          <Clock className="w-3 h-3 text-orange-600" />
                          <span className="text-xs text-orange-600">
                            Waiting for trip creator approval
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="p-4 border-t text-center text-muted-foreground">
              <p className="text-sm">Sign in to join the conversation</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TripChat;
