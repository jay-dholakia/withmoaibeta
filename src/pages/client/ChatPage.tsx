
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllChatRooms } from "@/services/chat";
import { ChatRoom as ChatRoomType } from "@/services/chat";
import { Menu, ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function ChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoomType[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<ChatRoomType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadChatRooms = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const rooms = await fetchAllChatRooms(user.id);
        setChatRooms(rooms);
        
        // Select the group chat room by default if groupId is provided
        if (groupId) {
          const groupRoom = rooms.find(room => room.is_group_chat && room.group_id === groupId);
          if (groupRoom) {
            setActiveRoomId(groupRoom.id);
            setActiveRoom(groupRoom);
          } else if (rooms.length > 0) {
            // Fallback to the first room if group chat room not found
            setActiveRoomId(rooms[0].id);
            setActiveRoom(rooms[0]);
          }
        } else if (rooms.length > 0) {
          // If no groupId is specified, select the first room
          setActiveRoomId(rooms[0].id);
          setActiveRoom(rooms[0]);
        }
      } catch (error) {
        console.error("Error loading chat rooms:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChatRooms();
  }, [user?.id, groupId]);

  const handleSelectRoom = (roomId: string) => {
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
                {activeRoom?.is_group_chat 
                  ? activeRoom.name 
                  : (activeRoom?.other_user_name || "Direct Message")}
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {activeRoom && activeRoomId ? (
                <ChatRoom 
                  roomId={activeRoomId}
                  isDirectMessage={!activeRoom.is_group_chat}
                  roomName={activeRoom.is_group_chat ? activeRoom.name : (activeRoom.other_user_name || "Direct Message")}
                  isMobile={isMobile}
                  onBack={handleBackClick}
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
                  roomName={activeRoom.is_group_chat ? activeRoom.name : (activeRoom.other_user_name || "Direct Message")}
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
