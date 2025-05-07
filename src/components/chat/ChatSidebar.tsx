import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatRoom } from "@/services/chat";
import { MessageSquare, Users, UserPlus, Plus } from "lucide-react";
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { createDirectMessageRoom } from "@/services/chat";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ChatSidebarProps {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  rooms,
  activeRoomId,
  onSelectRoom,
}) => {
  const { user } = useAuth();
  const [isNewDmDialogOpen, setIsNewDmDialogOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<Array<{
    id: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  }>>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isCreatingDm, setIsCreatingDm] = useState(false);

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

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ")[0][0].toUpperCase();
  };

  // Extract first name from a full name
  const getFirstName = (fullName: string) => {
    if (!fullName) return "Unknown";
    return fullName.split(" ")[0];
  };

  // Handle opening the new DM dialog - fetch group members
  const handleOpenNewDmDialog = async () => {
    if (!user?.id) return;

    setIsLoadingMembers(true);
    try {
      // First get all groups the user is a member of
      const { data: userGroups, error: groupError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (groupError) {
        throw groupError;
      }

      if (!userGroups || userGroups.length === 0) {
        toast.error("You're not a member of any groups");
        setIsLoadingMembers(false);
        return;
      }

      const groupIds = userGroups.map(g => g.group_id);

      // Get all members of these groups excluding current user
      const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("user_id")
        .in("group_id", groupIds)
        .neq("user_id", user.id);

      if (membersError) {
        throw membersError;
      }

      if (!members || members.length === 0) {
        toast.error("No other members found in your groups");
        setIsLoadingMembers(false);
        return;
      }

      // Get unique member IDs
      const uniqueMemberIds = [...new Set(members.map(m => m.user_id))];
      
      // Get client profiles for these users
      const { data: clientProfiles, error: profileError } = await supabase
        .from("client_profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", uniqueMemberIds);

      if (profileError) {
        throw profileError;
      }

      setGroupMembers(clientProfiles || []);
    } catch (error) {
      console.error("Error fetching group members:", error);
      toast.error("Failed to load group members");
    } finally {
      setIsLoadingMembers(false);
    }

    setIsNewDmDialogOpen(true);
  };

  // Handle creating a direct message with a selected user
  const handleCreateDirectMessage = async (userId: string) => {
    if (!user?.id) return;
    
    setIsCreatingDm(true);
    try {
      const roomId = await createDirectMessageRoom(user.id, userId);
      if (roomId) {
        setIsNewDmDialogOpen(false);
        onSelectRoom(roomId);
        toast.success("Direct message created");
      } else {
        toast.error("Failed to create direct message");
      }
    } catch (error) {
      console.error("Error creating direct message:", error);
      toast.error("Failed to create direct message");
    } finally {
      setIsCreatingDm(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col border-r">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Chats</h2>
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
                    "w-full justify-start px-4",
                    activeRoomId === room.id && "bg-accent"
                  )}
                  onClick={() => onSelectRoom(room.id)}
                >
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback className="bg-orange-500 text-primary-foreground text-xs">
                      {getInitials(room.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{room.name}</span>
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
                    "w-full justify-start px-4",
                    activeRoomId === room.id && "bg-accent"
                  )}
                  onClick={() => onSelectRoom(room.id)}
                >
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(room.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{room.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <div className="py-2">
          <div className="px-4 py-2 flex justify-between items-center">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Direct Messages
            </h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center"
              onClick={handleOpenNewDmDialog}
              aria-label="New Message"
            >
              <Plus className="h-4 w-4 text-foreground" />
            </Button>
          </div>
          <div className="space-y-1">
            {directMessages.length > 0 ? (
              directMessages.map((room) => {
                const firstName = room.other_user_name ? getFirstName(room.other_user_name) : "Unknown";
                
                return (
                  <Button
                    key={room.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-4",
                      activeRoomId === room.id && "bg-accent"
                    )}
                    onClick={() => onSelectRoom(room.id)}
                  >
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={room.other_user_avatar || ""} alt={firstName} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        {firstName ? firstName[0] : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{firstName}</span>
                  </Button>
                );
              })
            ) : (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                No direct messages yet
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* New DM Dialog */}
      <Dialog open={isNewDmDialogOpen} onOpenChange={setIsNewDmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Direct Message</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {isLoadingMembers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                <span className="ml-2">Loading members...</span>
              </div>
            ) : groupMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No members available to message</p>
                <p className="text-sm mt-2">You need to be in the same group with other members</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {groupMembers.map((member) => (
                  <Button
                    key={member.id}
                    variant="outline"
                    className="w-full justify-start py-6"
                    onClick={() => handleCreateDirectMessage(member.id)}
                    disabled={isCreatingDm}
                  >
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={member.avatar_url || ""} alt={member.first_name || "Member"} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {member.first_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.first_name} {member.last_name}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
