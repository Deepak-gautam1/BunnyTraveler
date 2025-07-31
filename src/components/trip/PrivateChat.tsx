import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send, X, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

type PrivateMessage = {
  id: number;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  sender_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
  receiver_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
};

interface PrivateChatProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  organizerId: string;
  organizerName: string;
  organizerAvatar?: string;
  currentUser: User | null;
}

const PrivateChat = ({
  isOpen,
  onClose,
  tripId,
  organizerId,
  organizerName,
  organizerAvatar,
  currentUser,
}: PrivateChatProps) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchMessages();
      setupRealtimeSubscription();
    }
  }, [isOpen, currentUser, organizerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("private_messages")
        .select(
          `
          *,
          sender_profile:profiles!private_messages_sender_id_fkey(full_name, avatar_url),
          receiver_profile:profiles!private_messages_receiver_id_fkey(full_name, avatar_url)
        `
        )
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${organizerId}),and(sender_id.eq.${organizerId},receiver_id.eq.${currentUser.id})`
        )
        .eq("trip_id", tripId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching private messages:", error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching private messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!currentUser) return;

    const channel = supabase
      .channel(`private-chat-${currentUser.id}-${organizerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          // Only update if message is between current user and organizer
          if (
            (newMsg.sender_id === currentUser.id &&
              newMsg.receiver_id === organizerId) ||
            (newMsg.sender_id === organizerId &&
              newMsg.receiver_id === currentUser.id)
          ) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.from("private_messages").insert({
        sender_id: currentUser.id,
        receiver_id: organizerId,
        trip_id: tripId,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      setTimeout(fetchMessages, 100); // Fetch updated messages
    } catch (error: any) {
      console.error("Error sending private message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[500px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              {organizerAvatar ? (
                <AvatarImage src={organizerAvatar} />
              ) : (
                <AvatarFallback>
                  {organizerName?.charAt(0)?.toUpperCase() || "O"}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="font-medium">{organizerName}</p>
              <p className="text-xs text-muted-foreground">Trip Organizer</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <UserIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No messages yet.</p>
                <p className="text-sm text-muted-foreground">
                  Start a conversation with the trip organizer!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isFromCurrentUser =
                    message.sender_id === currentUser.id;
                  const profile = isFromCurrentUser
                    ? message.sender_profile
                    : message.receiver_profile;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isFromCurrentUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex items-start space-x-2 max-w-[80%] ${
                          isFromCurrentUser
                            ? "flex-row-reverse space-x-reverse"
                            : ""
                        }`}
                      >
                        <Avatar className="w-6 h-6">
                          {profile?.avatar_url ? (
                            <AvatarImage src={profile.avatar_url} />
                          ) : (
                            <AvatarFallback>
                              {profile?.full_name?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div
                          className={`rounded-lg px-3 py-2 ${
                            isFromCurrentUser
                              ? "bg-blue-500 text-white"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm break-words">
                            {message.content}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isFromCurrentUser
                                ? "text-blue-100"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivateChat;
