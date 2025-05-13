import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatRoom } from "@/services/chat";
import { MessageSquare, Users, UserPlus, Plus, MessageCircle, MessageSquarePlus } from "lucide-react";
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { createDirectMessageRoom } from "@/services/chat";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCoachClients, ClientData } from "@/services/coach-clients-service";

interface ChatSidebarProps {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onChatCreated?: (roomId: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  rooms,
  activeRoomId,
  onSelectRoom,
  onChatCreated,
}) => {
  const { user } = useAuth();
  const [isNewDmDialogOpen, setIsNewDmDialogOpen] = useState(false);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isCreatingDm, setIsCreatingDm] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Group rooms by type
  const groupChats = rooms.filter(room => room.is_group_chat && !room.is_buddy_chat);
  const directMessages = rooms.filter(room => !room.is_group_chat);
  const buddyChats = rooms.filter(room => room.is_buddy_chat);

  console.log("Chat rooms by category:", {
    all: rooms.length,
    groupChats: groupChats.length,
    directMessages: directMessages.length,
    buddyChats: buddyChats.length
  });

  // Subscribe to online presence
  useEffect(() => {
    if (!user?.id) return;
    
    // Set current user as online
    const channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        
        // Process presence state to extract online users
        Object.keys(state).forEach(presenceKey => {
          // Fix type issue by properly accessing the user_id from presence data
          const presences = state[presenceKey] as any[];
          presences.forEach(presence => {
            if (presence.user_id) {
              online.add(presence.user_id);
            }
          });
        });
        
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
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
  }, [user?.id]);

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ")[0][0].toUpperCase();
  };

  // Format name to show first name and first initial of last name
  const formatName = (fullName: string) => {
    if (!fullName) return "Unknown";
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0];
    const lastInitial = nameParts.length > 1 ? nameParts[1][0] + '.' : "";
    return lastInitial ? `${firstName} ${lastInitial}` : firstName;
  };

  // Fetch coach's clients when opening the new DM dialog
  const handleOpenNewDmDialog = async () => {
    if (!user?.id) return;

    setIsLoadingClients(true);
    try {
      // Fetch all clients associated with this coach
      const fetchedClients = await fetchCoachClients(user.id);
      setClients(fetchedClients);
    } catch (error) {
      console.error("Error fetching coach clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setIsLoadingClients(false);
    }

    setIsNewDmDialogOpen(true);
  };

  // Handle creating a direct message with a selected client
  const handleCreateDirectMessage = async (clientId: string) => {
    if (!user?.id) return;
    
    setIsCreatingDm(true);
    try {
      const roomId = await createDirectMessageRoom(user.id, clientId);
      if (roomId) {
        setIsNewDmDialogOpen(false);
        
        // Call the onChatCreated callback to refresh rooms and immediately redirect
        if (onChatCreated) {
          onChatCreated(roomId);
        } else {
          // Fall back to just selecting the room if no callback provided
          onSelectRoom(roomId);
        }
        
        toast.success("Direct message created");
      } else {
        toast.error("Failed to create direct message - user may not exist in the system");
      }
    } catch (error) {
      console.error("Error creating direct message:", error);
      toast.error("Failed to create direct message");
    } finally {
      setIsCreatingDm(false);
    }
  };

  // Check if a user is online
  const isUserOnline = (userId?: string): boolean => {
    if (!userId) return false;
    return onlineUsers.has(userId);
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(client => 
    (client.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (client.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (client.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col border-r">
      <div className="p-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          Chats
        </h2>
      </div>
      
      <ScrollArea className="flex-1">
        {buddyChats.length > 0 && (
          <div className="py-2">
            <div className="px-4 py-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                Accountability Buddies
              </h3>
            </div>
            <div className="space-y-1">
              {buddyChats.map((room) => (
                <Button
                  key={room.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-4 py-3 h-auto min-h-[64px]",
                    activeRoomId === room.id && "bg-accent hover:bg-accent/90"
                  )}
                  onClick={() => onSelectRoom(room.id)}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback className="bg-orange-500 text-primary-foreground text-sm">
                      {getInitials(room.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="truncate font-medium text-base">{room.name}</span>
                    <span className="text-xs text-muted-foreground truncate mt-0.5">
                      {room.last_message || "No messages yet"}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {groupChats.length > 0 && (
          <div className="py-2">
            <div className="px-4 py-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Group Chats
              </h3>
            </div>
            <div className="space-y-1">
              {groupChats.map((room) => (
                <Button
                  key={room.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-4 py-3 h-auto min-h-[64px]",
                    activeRoomId === room.id && "bg-accent hover:bg-accent/90"
                  )}
                  onClick={() => onSelectRoom(room.id)}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback className="bg-blue-500 text-primary-foreground text-sm">
                      {getInitials(room.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="truncate font-medium text-base">{room.name}</span>
                    <span className="text-xs text-muted-foreground truncate mt-0.5">
                      {room.last_message || "No messages yet"}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <div className="py-2">
          <div className="px-4 py-2 flex justify-between items-center">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center">
              <MessageCircle className="h-4 w-4 mr-2" />
              Direct Messages
            </h3>
            
            <Button 
              onClick={handleOpenNewDmDialog} 
              variant="ghost" 
              size="icon"
              className="h-7 w-7"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">New Message</span>
            </Button>
          </div>
          <div className="space-y-1">
            {directMessages.map((room) => {
              const isOnline = isUserOnline(room.other_user_id);
              
              return (
                <Button
                  key={room.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start px-4 py-3 h-auto min-h-[64px] relative",
                    activeRoomId === room.id && "bg-accent hover:bg-accent/90"
                  )}
                  onClick={() => onSelectRoom(room.id)}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={room.other_user_avatar || ""} alt={room.other_user_name || "User"} />
                      <AvatarFallback className="bg-green-500 text-primary-foreground text-sm">
                        {getInitials(room.other_user_name || "DM")}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online status indicator */}
                    <span 
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background",
                        isOnline ? "bg-green-500" : "bg-gray-400"
                      )}
                      title={isOnline ? "Online" : "Offline"}
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center">
                      <span className="truncate font-medium text-base">
                        {room.other_user_name ? formatName(room.other_user_name) : "Direct Message"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate mt-0.5">
                      {room.last_message || "No messages yet"}
                    </span>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button 
          onClick={handleOpenNewDmDialog} 
          variant="outline" 
          className="w-full flex items-center"
        >
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          New Chat with Client
        </Button>
      </div>

      {/* New DM Dialog */}
      <Dialog open={isNewDmDialogOpen} onOpenChange={setIsNewDmDialogOpen}>
        <DialogContent className="max-w-md w-[90vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Message a Client</DialogTitle>
            <DialogDescription>
              Select a client to start a conversation
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search clients..."
                className="w-full p-2 border rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {isLoadingClients ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                <span className="ml-2">Loading clients...</span>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? (
                  <p>No clients match your search</p>
                ) : (
                  <>
                    <p>No clients available to message</p>
                    <p className="text-sm mt-2">You need to have clients assigned to you</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredClients.map((client) => {
                  const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim();
                  const formattedName = formatName(fullName);
                  const isOnline = isUserOnline(client.id);
                  
                  return (
                    <Button
                      key={client.id}
                      variant="outline"
                      className="w-full justify-start py-4 min-h-[64px]"
                      onClick={() => handleCreateDirectMessage(client.id)}
                      disabled={isCreatingDm}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                            {formattedName[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online status indicator */}
                        <span 
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background",
                            isOnline ? "bg-green-500" : "bg-gray-400"
                          )}
                          title={isOnline ? "Online" : "Offline"}
                        />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-base">{formattedName}</span>
                        <span className="text-xs text-muted-foreground">
                          {client.email}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
