import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessages } from "@/hooks/useMessages";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  MessageCircle,
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Settings,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

interface MessagesPageProps {
  user: User | null;
}

const MessagesPage = ({ user }: MessagesPageProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const {
    conversations,
    messages,
    loading,
    selectedParticipantId,
    setSelectedParticipantId,
    fetchMessages,
    sendMessage,
  } = useMessages(user);

  useEffect(() => {
    if (selectedParticipantId) {
      // Small delay to ensure messages are loaded first
      const timer = setTimeout(() => {
        fetchMessages(selectedParticipantId);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedParticipantId, fetchMessages]);

  // In your MessagesPage.tsx - enhance the mark as read function
  useEffect(() => {
    if (user && conversations.length > 0) {
      const markAllAsRead = async () => {
        try {
          const { count, error } = await supabase
            .from("private_messages")
            .update({ read_at: new Date().toISOString() })
            .eq("receiver_id", user.id)
            .is("read_at", null)
            .select("*");

          if (!error && count && count > 0) {
            window.dispatchEvent(new CustomEvent("unread-count-changed"));
          }
        } catch {
          // silently fail
        }
      };

      // Small delay to ensure conversations are loaded
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [user, conversations.length]);

  // Handle conversation selection
  const handleConversationSelect = async (participantId: string) => {
    setSelectedParticipantId(participantId);
    await fetchMessages(participantId);
  };

  // Handle sending message
  // ✅ FIXED: Optimistic UI - clear input immediately
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedParticipantId) return;

    // ✅ Store message content and clear input IMMEDIATELY
    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input box right away for instant feedback

    try {
      // Get trip ID from current conversation if exists
      const currentConversation = conversations.find(
        (c) => c.participantId === selectedParticipantId
      );

      // Send message with stored content
      await sendMessage(
        selectedParticipantId,
        messageContent,
        currentConversation?.tripId
      );

      toast({
        title: "Message sent! 📨",
        description: "Your message has been delivered.",
      });
    } catch {
      setNewMessage(messageContent);
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.tripName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current conversation
  const currentConversation = conversations.find(
    (conv) => conv.participantId === selectedParticipantId
  );

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">Messages</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to chat with your travel companions
          </p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-6xl">
      <div className="h-[calc(100vh-12rem)] flex bg-background border rounded-lg overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-1/3 border-r flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Messages</h2>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    {searchQuery ? "No conversations found" : "No messages yet"}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Contact trip creators to start conversations
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.participantId}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                      selectedParticipantId === conversation.participantId
                        ? "bg-muted"
                        : ""
                    }`}
                    onClick={() =>
                      handleConversationSelect(conversation.participantId)
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={conversation.participantAvatar} />
                        <AvatarFallback>
                          {conversation.participantName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">
                            {conversation.participantName}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {conversation.lastMessageTime}
                          </span>
                        </div>

                        {conversation.tripName && (
                          <p className="text-xs text-blue-600 mb-1">
                            📍 {conversation.tripName}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedParticipantId && currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={currentConversation.participantAvatar}
                      />
                      <AvatarFallback>
                        {currentConversation.participantName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {currentConversation.participantName}
                      </h3>
                      {currentConversation.tripName && (
                        <p className="text-sm text-blue-600">
                          📍 {currentConversation.tripName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" disabled>
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled>
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.isOwn
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {formatTimestamp(message.created_at)}
                            {message.read_at && message.isOwn && (
                              <span className="ml-1">✓✓</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  Select a conversation
                </h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the sidebar to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
