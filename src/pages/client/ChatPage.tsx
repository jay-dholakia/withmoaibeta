
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllChatRooms } from "@/services/chat";
import { ChatRoom as ChatRoomType } from "@/services/chat";
import { Menu, ArrowLeft, RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoomType[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<ChatRoomType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const buddyChatId = searchParams.get('buddy');
  const [loadAttempt, setLoadAttempt] = useState(0);

  const loadChatRooms = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;
    
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      console.log("Fetching chat rooms for user:", user.id);
      const rooms = await fetchAllChatRooms(user.id);
      console.log("Fetched chat rooms:", rooms);
      setChatRooms(rooms);
      
      // Handle room selection priority:
      // 1. Buddy chat room from URL parameter
      // 2. Group chat room from URL parameter
      // 3. First buddy chat room (if any)
      // 4. First available room
      
      if (buddyChatId) {
        const buddyRoom = rooms.find(room => room.id === buddyChatId && room.is_buddy_chat);
        if (buddyRoom) {
          setActiveRoomId(buddyRoom.id);
          setActiveRoom(buddyRoom);
          return;
        }
      }
      
      if (groupId) {
        const groupRoom = rooms.find(room => room.is_group_chat && room.group_id === groupId);
        if (groupRoom) {
          setActiveRoomId(groupRoom.id);
          setActiveRoom(groupRoom);
          return;
        }
      }
      
      // Check for buddy chat rooms first - always prioritize buddy chats
      const buddyRooms = rooms.filter(room => room.is_buddy_chat);
      if (buddyRooms.length > 0) {
        setActiveRoomId(buddyRooms[0].id);
        setActiveRoom(buddyRooms[0]);
        return;
      }
      
      if (rooms.length > 0) {
        setActiveRoomId(rooms[0].id);
        setActiveRoom(rooms[0]);
      }

      if (isRefresh) {
        toast.success("Chats refreshed successfully");
      }
    } catch (error) {
      console.error("Error loading chat rooms:", error);
      if (isRefresh) {
        toast.error("Failed to refresh chats");
      } else if (loadAttempt < 2) {
        // Retry loading once more after a short delay
        setTimeout(() => {
          setLoadAttempt(prev => prev + 1);
        }, 2000);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, groupId, buddyChatId, loadAttempt]);

  useEffect(() => {
    loadChatRooms();
  }, [loadChatRooms]);

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

  const handleRefresh = () => {
    loadChatRooms(true);
  };

  // Extract first name from full name
  const getFirstName = (fullName: string) => {
    return fullName ? fullName.split(" ")[0] : "";
  };

  // Get display name for the active room
  const getActiveRoomDisplayName = () => {
    if (!activeRoom) return "";
    
    if (activeRoom.is_group_chat) {
      if (activeRoom.is_buddy_chat) {
        // Filter out empty names and format the buddy chat name properly
        const buddyNames = activeRoom.name
          .split(" &")
          .map(name => name.trim())
          .filter(name => name.length > 0 && name !== "You" && name !== "you")
          .map(name => getFirstName(name));
          
        // Format it as "You, Name1, Name2" or just "You" if no other names
        return buddyNames.length > 0 ? `You, ${buddyNames.join(", ")}` : "You";
      }
      return activeRoom.name;
    } else {
      return activeRoom.other_user_name ? getFirstName(activeRoom.other_user_name) : "Direct Message";
    }
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to access your chats</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">      
      <div className="flex flex-1 border rounded-lg dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <div className="w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-client" />
              <p className="text-muted-foreground">Loading your chats...</p>
              {loadAttempt > 0 && (
                <p className="text-xs text-muted-foreground">Retry attempt {loadAttempt}/2...</p>
              )}
            </div>
          </div>
        ) : (
          <>
            {isMobile ? (
              <div className="w-full flex flex-col h-full">
                <div className="flex items-center p-2 border-b justify-between">
                  <div className="flex items-center">
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
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
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
                
                <div className="flex-1 relative">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="absolute top-2 right-2 z-10"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                  
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
          </>
        )}
      </div>
    </div>
  );
}
