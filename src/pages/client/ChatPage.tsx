
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllChatRooms } from "@/services/chat";
import { ChatRoom as ChatRoomType } from "@/services/chat";
import { ArrowLeft } from "lucide-react";

export default function ChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoomType[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<ChatRoomType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={handleBackClick}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Moai
        </Button>
      </div>
      
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          <div className="flex h-[600px]">
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
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Select a conversation to start chatting</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
