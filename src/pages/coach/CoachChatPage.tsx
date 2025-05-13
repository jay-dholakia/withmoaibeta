
import React, { useState, useEffect } from 'react';
import { CoachLayout } from '@/layouts/CoachLayout';
import { useAuth } from '@/contexts/AuthContext';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatRoom } from '@/components/chat/ChatRoom';
import { Card } from '@/components/ui/card';
import { ChatRoom as ChatRoomType, fetchAllChatRooms, createDirectMessageRoom } from '@/services/chat';
import { useQuery } from '@tanstack/react-query';
import { useIsMobile } from '@/lib/hooks';
import { MessageSquare } from 'lucide-react';

const CoachChatPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoomType | null>(null);
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  // Fetch all chat rooms for the current coach
  const { data: chatRooms, isLoading, error, refetch } = useQuery({
    queryKey: ['coach-chat-rooms', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await fetchAllChatRooms(user.id);
    },
    enabled: !!user?.id
  });

  // Set first room as selected by default when data loads
  useEffect(() => {
    if (chatRooms && chatRooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(chatRooms[0].id);
      setSelectedRoom(chatRooms[0]);
    }
  }, [chatRooms, selectedRoomId]);

  // Update selected room when room ID changes
  useEffect(() => {
    if (selectedRoomId && chatRooms) {
      const room = chatRooms.find(r => r.id === selectedRoomId);
      if (room) {
        setSelectedRoom(room);
      }
    }
  }, [selectedRoomId, chatRooms]);

  // Handle room selection
  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Handle back button in mobile view
  const handleBack = () => {
    setShowSidebar(true);
  };

  // Create a new direct message with a client
  const handleCreateDirectMessage = async (clientId: string) => {
    if (!user?.id) return;
    
    try {
      const roomId = await createDirectMessageRoom(user.id, clientId);
      if (roomId) {
        await refetch();
        setSelectedRoomId(roomId);
      }
    } catch (error) {
      console.error("Error creating direct message:", error);
    }
  };

  return (
    <CoachLayout>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-coach" />
          <h1 className="text-3xl font-bold text-coach">Chat</h1>
        </div>
        
        <div className="grid grid-cols-1 gap-4 h-[calc(100vh-240px)]">
          <div className="flex h-full overflow-hidden border rounded-xl bg-background">
            {/* Only show sidebar in desktop or when showSidebar is true in mobile */}
            {(!isMobile || (isMobile && showSidebar)) && (
              <div className={`${isMobile ? 'w-full' : 'w-80 border-r'}`}>
                <ChatSidebar 
                  chatRooms={chatRooms || []}
                  selectedRoomId={selectedRoomId}
                  onSelectRoom={handleRoomSelect}
                  isLoading={isLoading}
                  error={error instanceof Error ? error.message : undefined}
                  userId={user?.id || ''}
                />
              </div>
            )}
            
            {/* Show chat room in desktop or when a room is selected and sidebar is hidden in mobile */}
            {(!isMobile || (isMobile && !showSidebar)) && (
              <div className="flex-1">
                {selectedRoom ? (
                  <ChatRoom 
                    roomId={selectedRoom.id}
                    isDirectMessage={!selectedRoom.is_group_chat}
                    roomName={selectedRoom.name}
                    isMobile={isMobile}
                    onBack={handleBack}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Select a chat room to start messaging</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </CoachLayout>
  );
};

export default CoachChatPage;
