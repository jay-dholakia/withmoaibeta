
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllChatRooms } from "@/services/chat";
import { ChatRoom as ChatRoomType } from "@/services/chat";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const fromGroupId = searchParams.get('fromGroup');

  // Set up presence tracking for online status
  useEffect(() => {
    if (!user?.id) return;
    
    // Create a presence channel for tracking online status
    const channel = supabase.channel('online-users')
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

  // Function to load chat rooms that can be called multiple times
  const loadChatRooms = useCallback(async (newRoomIdToSelect?: string) => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const rooms = await fetchAllChatRooms(user.id);
      setChatRooms(rooms);
      
      // Handle room selection based on provided ID or priority
      if (newRoomIdToSelect) {
        // If we have a specific room ID to select, prioritize it
        const newRoom = rooms.find(room => room.id === newRoomIdToSelect);
        if (newRoom) {
          setActiveRoomId(newRoomIdToSelect);
          setActiveRoom(newRoom);
          // Update URL to include the new room ID
          navigate(`/client-dashboard/chat/${newRoomIdToSelect}`, { replace: true });
          return;
        }
      }
      
      // Otherwise use existing priority logic
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
        const buddyRoom = rooms.find(room => room.id === buddyChatId && room.is_buddy_chat);
        if (buddyRoom) {
          setActiveRoomId(buddyRoom.id);
          setActiveRoom(buddyRoom);
          return;
        } else {
          toast.error("The buddy chat room could not be found");
        }
      }
      
      // If we have a roomId in the URL path, use that
      if (groupId) {
        const roomById = rooms.find(room => room.id === groupId);
        if (roomById) {
          setActiveRoomId(roomById.id);
          setActiveRoom(roomById);
          return;
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
  }, [user?.id, directMessageId, buddyChatId, groupId, navigate]);

  // Initial load of chat rooms
  useEffect(() => {
    loadChatRooms();
  }, [loadChatRooms]);

  const handleSelectRoom = (roomId: string) => {
    // If it's already the active room, no need to update
    if (roomId === activeRoomId) return;
    
    // Otherwise update the active room
    setActiveRoomId(roomId);
    const room = chatRooms.find(r => r.id === roomId);
    setActiveRoom(room || null);
    
    // Update URL to include the selected room ID
    navigate(`/client-dashboard/chat/${roomId}`, { replace: true });
  };

  // Handle new chat creation - refresh rooms and select the new room
  const handleChatCreated = async (roomId: string) => {
    await loadChatRooms(roomId);
  };

  const handleBackClick = () => {
    // If we came from a specific group, go back to that group
    if (fromGroupId) {
      navigate(`/client-dashboard/moai/${fromGroupId}`);
    } 
    // If we're currently in a group chat and know its group ID, use that
    else if (activeRoom?.group_id) {
      navigate(`/client-dashboard/moai/${activeRoom.group_id}`);
    } 
    // Default fallback
    else {
      navigate('/client-dashboard/moai');
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

  // Get display name for the active room
  const getActiveRoomDisplayName = () => {
    if (!activeRoom) return "";
    
    if (activeRoom.is_group_chat) {
      return activeRoom.name;
    } else {
      return activeRoom.other_user_name ? formatName(activeRoom.other_user_name) : "Direct Message";
    }
  };

  return (
    <div className="h-full flex flex-col">      
      <div className="flex flex-1 border rounded-lg dark:border-gray-700 dark:bg-gray-800 h-full">
        {isMobile ? (
          <div className="w-full flex flex-col h-full relative">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute left-0 top-1/2 -translate-y-1/2 transform z-10 h-14 w-10 p-0 rounded-r-md rounded-l-none border border-gray-300 dark:border-gray-500 bg-background/95 backdrop-blur-sm hover:bg-background/90 transition-all duration-200 shadow-md touch-manipulation"
                >
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="p-0 w-[85vw] sm:w-[320px] border-r bg-background/95 backdrop-blur-sm" 
                hideCloseButton
              >
                <div className="relative h-full">
                  <ChatSidebar 
                    rooms={chatRooms} 
                    activeRoomId={activeRoomId} 
                    onSelectRoom={(roomId) => {
                      handleSelectRoom(roomId);
                      // Close the sheet after selecting a room on mobile
                      const closeButton = document.querySelector('[data-sheet-close]');
                      if (closeButton instanceof HTMLElement) {
                        closeButton.click();
                      }
                    }}
                    onChatCreated={handleChatCreated}
                  />
                  
                  <SheetClose asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-1/2 -translate-y-1/2 transform h-14 w-10 p-0 rounded-l-md rounded-r-none border border-gray-300 dark:border-gray-500 bg-background/95 backdrop-blur-sm hover:bg-background/90 transition-all duration-200 shadow-md touch-manipulation"
                    >
                      <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
            
            <div className="flex-1 overflow-hidden">
              {activeRoom && activeRoomId ? (
                <ChatRoom 
                  roomId={activeRoomId}
                  isDirectMessage={!activeRoom.is_group_chat}
                  roomName={activeRoom.name}
                  isMobile={isMobile}
                  onBack={handleBackClick}
                />
              ) : (
                <div className="h-full flex items-center justify-center p-4">
                  <p className="text-muted-foreground text-center">Select a conversation to start chatting</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="w-64 border-r bg-background/95 backdrop-blur-sm">
              <ChatSidebar 
                rooms={chatRooms} 
                activeRoomId={activeRoomId} 
                onSelectRoom={handleSelectRoom}
                onChatCreated={handleChatCreated}
              />
            </div>
            
            <div className="flex-1">
              {activeRoom && activeRoomId ? (
                <ChatRoom 
                  roomId={activeRoomId}
                  isDirectMessage={!activeRoom.is_group_chat}
                  roomName={activeRoom.name}
                  isMobile={isMobile}
                  onBack={handleBackClick}
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
};
