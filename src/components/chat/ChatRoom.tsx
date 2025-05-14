
import React, { useState, useEffect, useRef } from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ChatMessage, fetchMessages, sendMessage, subscribeToRoom } from "@/services/chat";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
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

  // Get other user ID for direct messages to track online status
  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (isDirectMessage && roomId) {
        try {
          const { data, error } = await supabase
            .from('direct_message_rooms')
            .select('*')
            .eq('room_id', roomId)
            .single();
          
          if (data) {
            const otherId = data.user1_id === user?.id ? data.user2_id : data.user1_id;
            setOtherUserId(otherId);
          }
        } catch (err) {
          console.error("Error fetching room details:", err);
        }
      }
    };
    
    fetchRoomDetails();
  }, [roomId, isDirectMessage, user?.id]);

  // Track online status of users
  useEffect(() => {
    if (!otherUserId) return;
    
    const channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        let userIsOnline = false;
        
        // Check if the other user is in the presence state
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id === otherUserId) {
              userIsOnline = true;
            }
          });
        });
        
        setIsOtherUserOnline(userIsOnline);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && user?.id) {
          // Track the current user's presence
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [otherUserId, user?.id]);

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

  // Format name to show first name and first initial of last name
  const formatName = (fullName: string) => {
    if (!fullName) return "Unknown";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0];
    const lastInitial = nameParts.length > 1 ? nameParts[1][0] + '.' : "";
    return lastInitial ? `${firstName} ${lastInitial}` : firstName;
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return "";
    }
  };

  // Get formatted name for room display
  const displayRoomName = isDirectMessage && roomName ? formatName(roomName) : roomName;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-4 py-3 border-b shrink-0 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {isMobile && onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="p-0 h-8 w-8 hover:bg-accent touch-manipulation"
              size="sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(displayRoomName)}
                </AvatarFallback>
              </Avatar>
              {isDirectMessage && (
                <span 
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background",
                    isOtherUserOnline ? "bg-green-500" : "bg-gray-400"
                  )}
                />
              )}
            </div>
            <div>
              <h2 className="font-medium text-base">{displayRoomName}</h2>
              <p className="text-xs text-muted-foreground">
                {isDirectMessage 
                  ? (isOtherUserOnline ? "Online" : "Offline") 
                  : "Group Chat"}
              </p>
            </div>
          </div>
        </div>
      </div>
      
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
          <ScrollArea className="h-full w-full px-4 py-6">
            <div className="space-y-4">
              {messages.map((message) => {
                const isCurrentUser = message.sender_id === user?.id;
                const senderAvatar = message.sender_profile_picture;
                const formattedName = message.sender_name ? formatName(message.sender_name) : "Unknown";
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      isCurrentUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "flex items-end gap-2 max-w-[85%] group",
                      isCurrentUser ? "flex-row-reverse" : "flex-row"
                    )}>
                      {!isCurrentUser && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={senderAvatar || ""} />
                          <AvatarFallback>
                            {getInitials(formattedName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn(
                        "rounded-2xl px-4 py-2.5 relative",
                        isCurrentUser 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-muted rounded-tl-none"
                      )}>
                        {!isCurrentUser && (
                          <p className="text-xs font-medium mb-1 text-muted-foreground">
                            {formattedName}
                          </p>
                        )}
                        <div className="space-y-1">
                          <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <p className={cn(
                            "text-[10px] opacity-70 text-right",
                            isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
      </div>
      
      <div className="p-3 border-t bg-background/95 backdrop-blur-sm sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending}
            className="flex-1 rounded-full bg-muted/50 focus-visible:ring-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || isSending}
            className="rounded-full h-10 w-10"
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
