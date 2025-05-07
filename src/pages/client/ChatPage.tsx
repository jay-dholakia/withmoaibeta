
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllChatRooms } from "@/services/chat";
import { ChatRoom as ChatRoomType } from "@/services/chat";
import { Menu, ArrowLeft, Loader2 } from "lucide-react";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadRetryCount, setLoadRetryCount] = useState(0);
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const buddyChatId = searchParams.get('buddy');

  const loadChatRooms = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log("Fetching chat rooms for user:", user.id);
      const rooms = await fetchAllChatRooms(user.id);
      console.log(`Fetched ${rooms.length} total chat rooms`);
      
      const buddyRooms = rooms.filter(r => r.is_buddy_chat);
      const groupRooms = rooms.filter(r => r.is_group_chat && !r.is_buddy_chat);
      const directRooms = rooms.filter(r => !r.is_group_chat);
      
      console.log(`Buddy rooms: ${buddyRooms.length}, Group rooms: ${groupRooms.length}, Direct messages: ${directRooms.length}`);
      
      setChatRooms(rooms);
      
      // Handle room selection priority:
      // 1. Buddy chat room from URL parameter
      // 2. Group chat room from URL parameter
      // 3. First buddy chat room (if available)
      // 4. First available room
      
      if (buddyChatId) {
        console.log(`Looking for buddy chat room with ID: ${buddyChatId}`);
        const buddyRoom = rooms.find(room => room.id === buddyChatId && room.is_buddy_chat);
        if (buddyRoom) {
          console.log(`Found buddy chat room: ${buddyRoom.name}`);
          setActiveRoomId(buddyRoom.id);
          setActiveRoom(buddyRoom);
          return;
        } else {
          console.log(`Buddy chat room with ID ${buddyChatId} not found`);
        }
      }
      
      if (groupId) {
        console.log(`Looking for group chat with group ID: ${groupId}`);
        const groupRoom = rooms.find(room => room.is_group_chat && room.group_id === groupId);
        if (groupRoom) {
          console.log(`Found group chat room: ${groupRoom.name}`);
          setActiveRoomId(groupRoom.id);
          setActiveRoom(groupRoom);
          return;
        } else {
          console.log(`Group chat room for group ${groupId} not found`);
        }
      }
      
      // Prioritize buddy chat if available
      if (buddyRooms.length > 0) {
        console.log(`Selecting first buddy chat room: ${buddyRooms[0].name}`);
        setActiveRoomId(buddyRooms[0].id);
        setActiveRoom(buddyRooms[0]);
        return;
      }
      
      if (rooms.length > 0) {
        console.log(`Selecting first available room: ${rooms[0].name}`);
        setActiveRoomId(rooms[0].id);
        setActiveRoom(rooms[0]);
      }
    } catch (error) {
      console.error("Error loading chat rooms:", error);
      setLoadError("Failed to load chat rooms. Please try again.");
      
      // If we've had multiple failures, show a toast
      if (loadRetryCount > 1) {
        toast.error("There was a problem loading your chats. Please refresh the page.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, groupId, buddyChatId, loadRetryCount]);

  useEffect(() => {
    loadChatRooms();
  }, [loadChatRooms]);

  // Add retry logic if we encounter an error
  useEffect(() => {
    if (loadError && loadRetryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`Retrying chat room load (attempt ${loadRetryCount + 1})...`);
        setLoadRetryCount(prev => prev + 1);
        loadChatRooms();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [loadError, loadRetryCount, loadChatRooms]);

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

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-client mb-2" />
        <p className="text-sm text-muted-foreground">Loading your conversations...</p>
      </div>
    );
  }

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
              ) : loadError ? (
                <div className="h-full flex items-center justify-center flex-col gap-4">
                  <p className="text-muted-foreground">{loadError}</p>
                  <Button onClick={() => {
                    setLoadRetryCount(prev => prev + 1);
                    loadChatRooms();
                  }}>
                    Try Again
                  </Button>
                </div>
              ) : chatRooms.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">No conversations available</p>
                </div>
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
