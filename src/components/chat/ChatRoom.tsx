
import React, { useState, useEffect, useRef } from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ChatMessage, fetchMessages, sendMessage, subscribeToRoom } from "@/services/chat";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ChatRoomProps {
  roomId: string;
  isDirectMessage?: boolean;
  roomName: string;
  isMobile?: boolean;
  onBack?: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ 
  roomId, 
  isDirectMessage = false,
  roomName,
  isMobile = false,
  onBack
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const loadMessages = async () => {
      setIsLoading(true);
      const data = await fetchMessages(roomId);
      setMessages(data);
      setIsLoading(false);
      
      // Subscribe to new messages
      if (user?.id) {
        channel = subscribeToRoom(roomId, (newMessage) => {
          setMessages(prevMessages => [...prevMessages, newMessage]);
        });
      }
    };

    if (roomId && user?.id) {
      loadMessages();
    }

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [roomId, user?.id]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !newMessage.trim() || !roomId) {
      return;
    }

    setIsSending(true);
    
    try {
      const sentMessage = await sendMessage(
        roomId,
        newMessage,
        user.id,
        isDirectMessage
      );
      
      if (sentMessage) {
        setNewMessage("");
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("An error occurred while sending your message");
    } finally {
      setIsSending(false);
    }
  };

  // Extract first name from full name
  const getFirstName = (fullName: string) => {
    if (!fullName) return "Unknown";
    return fullName.split(" ")[0];
  };

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return "";
    }
  };

  // Get display name for the room header
  const getDisplayRoomName = () => {
    if (isDirectMessage) {
      return getFirstName(roomName);
    } else if (roomName.includes(" &")) {
      // Filter out empty names and format the buddy chat name properly
      const buddyNames = roomName
        .split(" &")
        .map(name => name.trim())
        .filter(name => name.length > 0 && name !== "You" && name !== "you")
        .map(name => getFirstName(name));
        
      // Format properly with "You" and others
      return buddyNames.length > 0 ? `You, ${buddyNames.join(", ")}` : "You";
    }
    return roomName;
  };

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="px-4 py-3 border-b shrink-0">
        <CardTitle className="text-lg">{getDisplayRoomName()}</CardTitle>
      </CardHeader>
      
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <ScrollArea className="h-full w-full p-4">
            <div className="space-y-4">
              {messages.map((message) => {
                const isCurrentUser = message.sender_id === user?.id;
                const senderFirstName = message.sender_name ? getFirstName(message.sender_name) : "Unknown";
                
                return (
                  <div
                    key={message.id}
                    className={cn("flex", isCurrentUser ? "justify-end" : "justify-start")}
                  >
                    <div className="flex items-start gap-2 max-w-[80%]">
                      {!isCurrentUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender_avatar || ""} />
                          <AvatarFallback>
                            {getInitials(senderFirstName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn(
                        "rounded-lg px-3 py-2 space-y-1",
                        isCurrentUser 
                          ? "bg-client text-white" 
                          : "bg-muted"
                      )}>
                        {!isCurrentUser && (
                          <p className="text-xs font-medium">
                            {senderFirstName}
                          </p>
                        )}
                        <div className="space-y-1">
                          <p className="text-sm md:text-base">{message.content}</p>
                          <p className={cn(
                            "text-xs opacity-70",
                            isCurrentUser ? "text-white" : "text-muted-foreground"
                          )}>
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      {isCurrentUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender_avatar || ""} />
                          <AvatarFallback>
                            {getInitials(senderFirstName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </div>
      
      <div className="p-2 md:p-3 border-t mt-auto sticky bottom-0 bg-background">
        <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
