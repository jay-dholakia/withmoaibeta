
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatRoom } from "@/services/chat";
import { MessageSquare, Users, UserPlus, PlusCircle } from "lucide-react";

interface ChatSidebarProps {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onNewDirectMessage?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  rooms,
  activeRoomId,
  onSelectRoom,
  onNewDirectMessage,
}) => {
  // Group rooms by type
  const groupChats = rooms.filter(room => room.is_group_chat && !room.is_buddy_chat);
  const directMessages = rooms.filter(room => !room.is_group_chat);
  const buddyChats = rooms.filter(room => room.is_buddy_chat);

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Extract first name from a full name
  const getFirstName = (fullName: string) => {
    return fullName.split(" ")[0];
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
              {buddyChats.map((room) => {
                // Filter out empty names and format the display properly
                const buddyNames = room.name
                  .split(" &")
                  .map(name => name.trim())
                  .filter(name => name.length > 0 && name !== "You" && name !== "you")
                  .map(name => getFirstName(name));
                
                // Format properly with "You" and others, avoiding empty commas
                const displayName = buddyNames.length > 0 ? `You, ${buddyNames.join(", ")}` : "You";
                
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
                      <AvatarFallback className="bg-orange-500 text-primary-foreground text-xs">
                        {getInitials(room.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{displayName}</span>
                  </Button>
                );
              })}
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
            {onNewDirectMessage && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0" 
                onClick={onNewDirectMessage}
              >
                <PlusCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                <span className="sr-only">New Direct Message</span>
              </Button>
            )}
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
                      <AvatarImage src={room.other_user_avatar || ""} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        {firstName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{firstName}</span>
                  </Button>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground text-center px-4">
                No direct messages yet
              </p>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
