
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatRoom } from "@/services/chat-service";
import { MessageSquare, Users } from "lucide-react";

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
  // Group rooms by type
  const groupChats = rooms.filter(room => room.is_group_chat);
  const directMessages = rooms.filter(room => !room.is_group_chat);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="w-full h-full flex flex-col border-r">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Chats</h2>
      </div>
      
      <ScrollArea className="flex-1">
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
        
        {directMessages.length > 0 && (
          <div className="py-2">
            <div className="px-4 py-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Direct Messages
              </h3>
            </div>
            <div className="space-y-1">
              {directMessages.map((room) => (
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
                      {room.other_user_name ? getInitials(room.other_user_name) : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{room.other_user_name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
