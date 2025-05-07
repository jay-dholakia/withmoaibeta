import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllChatRooms } from "@/services/chat";
import { ChatRoom as ChatRoomType } from "@/services/chat";
import { Menu, ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

export default function ChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoomType[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<ChatRoomType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const buddyChatId = searchParams.get('buddy');
  const directMessageId = searchParams.get('dm');

  useEffect(() => {
    const loadChatRooms = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const rooms = await fetchAllChatRooms(user.id);
        setChatRooms(rooms);
        
        // Handle room selection priority:
        // 1. Direct message from URL parameter
        // 2. Buddy chat room from URL parameter
        // 3. First available room
        
        if (directMessageId) {
          const dmRoom = rooms.find(room => room.id === directMessageId && !room.is_group_chat);
          if (dmRoom) {
            setActiveRoomId(dmRoom.id);
            setActiveRoom(dmRoom);
            return;
          } else {
            toast.error("The direct message room could not be found");
          }
        }
        
        if (buddyChatId) {
          console.log("Looking for buddy chat room:", buddyChatId);
          const buddyRoom = rooms.find(room => room.id === buddyChatId && room.is_buddy_chat);
          if (buddyRoom) {
            console.log("Found buddy chat room:", buddyRoom);
            setActiveRoomId(buddyRoom.id);
            setActiveRoom(buddyRoom);
            return;
          } else {
            console.log("Buddy chat room not found");
            toast.error("The buddy chat room could not be found");
          }
        }
        
        if (rooms.length > 0) {
          setActiveRoomId(rooms[0].id);
          setActiveRoom(rooms[0]);
        }
      } catch (error) {
        console.error("Error loading chat rooms:", error);
        toast.error("Failed to load chat rooms");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChatRooms();
  }, [user?.id, buddyChatId, directMessageId]);

  const handleSelectRoom = (roomId: string) => {
    // If it's already the active room, no need to update
    if (roomId === activeRoomId) return;
    
    // Otherwise update the active room
    setActiveRoomId(roomId);
    const room = chatRooms.find(r => r.id === roomId);
    setActiveRoom(room || null);
  };

  const handleBackClick = () => {
    if (groupId) {
      navigate(`/client-dashboard/moai/${groupId}`);
    } else {
      navigate('/client-dashboard/moai');
    }
  };

  // Extract first name from full name
  const getFirstName = (fullName: string) => {
    return fullName ? fullName.split(" ")[0] : "";
  };

  // Get display name for the active room
  const getActiveRoomDisplayName = () => {
    if (!activeRoom) return "";
    
    if (activeRoom.is_group_chat) {
      return activeRoom.name;
    } else {
      return activeRoom.other_user_name ? getFirstName(activeRoom.other_user_name) : "Direct Message";
    }
  };

  // Handle refreshing the chat rooms list (useful after creating a new DM)
  const refreshChatRooms = async () => {
    if (!user?.id) return;
    
    try {
      const rooms = await fetchAllChatRooms(user.id);
      setChatRooms(rooms);
    } catch (error) {
      console.error("Error refreshing chat rooms:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">      
      <div className="flex flex-1 border rounded-lg dark:border-gray-700 dark:bg-gray-800">
        {isMobile ? (
          <div className="w-full flex flex-col h-full">
            <div className="flex items-center p-2 border-b">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="mr-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[250px]">
                  <ChatSidebar 
                    rooms={chatRooms} 
                    activeRoomId={activeRoomId} 
                    onSelectRoom={handleSelectRoom}
                  />
                </SheetContent>
              </Sheet>
              <div className="font-medium truncate flex items-center">
                <Button 
                  variant="ghost" 
                  onClick={handleBackClick}
                  className="mr-2 flex items-center"
                  size="sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                {getActiveRoomDisplayName()}
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {activeRoom && activeRoomId ? (
                <ChatRoom 
                  roomId={activeRoomId}
                  isDirectMessage={!activeRoom.is_group_chat}
                  roomName={activeRoom.name}
                  isMobile={isMobile}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Select a conversation to start chatting</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="w-64 border-r">
              <ChatSidebar 
                rooms={chatRooms} 
                activeRoomId={activeRoomId} 
                onSelectRoom={handleSelectRoom}
              />
            </div>
            
            <div className="flex-1">
              {activeRoom && activeRoomId ? (
                <ChatRoom 
                  roomId={activeRoomId}
                  isDirectMessage={!activeRoom.is_group_chat}
                  roomName={activeRoom.name}
                  isMobile={isMobile}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Select a conversation to start chatting</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
