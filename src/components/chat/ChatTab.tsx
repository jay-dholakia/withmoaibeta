
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, PlusCircle } from "lucide-react";
import { ChatRoom as ChatRoomType, fetchAllChatRooms, createDirectMessageRoom } from "@/services/chat";
import { ChatRoom } from "./ChatRoom";
import { ChatSidebar } from "./ChatSidebar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MemberProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  user_type: string;
}

export const ChatTab: React.FC<{ groupId: string }> = ({ groupId }) => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoomType[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<ChatRoomType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState<MemberProfile[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isNewDmDialogOpen, setIsNewDmDialogOpen] = useState(false);
  const [isCreatingDm, setIsCreatingDm] = useState(false);
  
  useEffect(() => {
    const loadChatRooms = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const rooms = await fetchAllChatRooms(user.id);
        setChatRooms(rooms);
        
        // Select the first room by default, prioritizing group chats that are relevant to the current group
        if (rooms.length > 0) {
          // Try to find a group chat room related to the current group
          const groupRoom = rooms.find(room => room.is_group_chat && !room.is_buddy_chat);
          if (groupRoom) {
            setActiveRoomId(groupRoom.id);
            setActiveRoom(groupRoom);
          } else {
            setActiveRoomId(rooms[0].id);
            setActiveRoom(rooms[0]);
          }
        }
      } catch (error) {
        console.error("Error loading chat rooms:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChatRooms();
  }, [user?.id, groupId]);
  
  useEffect(() => {
    const loadGroupMembers = async () => {
      if (!groupId) return;
      
      setIsLoadingMembers(true);
      try {
        // Fetch members of this group
        const { data: memberIds, error: memberError } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", groupId);
        
        if (memberError) {
          throw memberError;
        }
        
        if (memberIds && memberIds.length > 0) {
          const profiles: MemberProfile[] = [];
          
          // For each member, get their profile info
          for (const memberData of memberIds) {
            if (memberData.user_id === user?.id) continue; // Skip current user
            
            // Get user type
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("user_type")
              .eq("id", memberData.user_id)
              .single();
              
            if (profileError) {
              console.error("Error fetching profile:", profileError);
              continue;
            }
            
            if (profileData?.user_type === "coach") {
              const { data: coachProfile } = await supabase
                .from("coach_profiles")
                .select("first_name, last_name, avatar_url")
                .eq("id", memberData.user_id)
                .single();
                
              if (coachProfile) {
                profiles.push({
                  id: memberData.user_id,
                  first_name: coachProfile.first_name,
                  last_name: coachProfile.last_name,
                  avatar_url: coachProfile.avatar_url,
                  user_type: "coach"
                });
              }
            } else {
              const { data: clientProfile } = await supabase
                .from("client_profiles")
                .select("first_name, last_name, avatar_url")
                .eq("id", memberData.user_id)
                .single();
                
              if (clientProfile) {
                profiles.push({
                  id: memberData.user_id,
                  first_name: clientProfile.first_name,
                  last_name: clientProfile.last_name,
                  avatar_url: clientProfile.avatar_url,
                  user_type: "client"
                });
              }
            }
          }
          
          // Also fetch coaches for this group
          const { data: coachData, error: coachError } = await supabase
            .from("group_coaches")
            .select("coach_id")
            .eq("group_id", groupId);
            
          if (!coachError && coachData) {
            for (const coach of coachData) {
              if (coach.coach_id === user?.id) continue; // Skip if it's current user
              
              // Check if coach is already in the list
              if (!profiles.some(p => p.id === coach.coach_id)) {
                const { data: coachProfile } = await supabase
                  .from("coach_profiles")
                  .select("first_name, last_name, avatar_url")
                  .eq("id", coach.coach_id)
                  .single();
                  
                if (coachProfile) {
                  profiles.push({
                    id: coach.coach_id,
                    first_name: coachProfile.first_name,
                    last_name: coachProfile.last_name,
                    avatar_url: coachProfile.avatar_url,
                    user_type: "coach"
                  });
                }
              }
            }
          }
          
          setGroupMembers(profiles);
        }
      } catch (error) {
        console.error("Error loading group members:", error);
      } finally {
        setIsLoadingMembers(false);
      }
    };
    
    loadGroupMembers();
  }, [groupId, user?.id]);
  
  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    const room = chatRooms.find(r => r.id === roomId);
    setActiveRoom(room || null);
  };
  
  const handleCreateDirectMessage = async (memberId: string) => {
    if (!user?.id) return;
    
    setIsCreatingDm(true);
    try {
      const roomId = await createDirectMessageRoom(user.id, memberId);
      if (roomId) {
        // Refresh chat rooms
        const rooms = await fetchAllChatRooms(user.id);
        setChatRooms(rooms);
        
        // Select the new room
        const room = rooms.find(r => r.id === roomId);
        if (room) {
          setActiveRoomId(roomId);
          setActiveRoom(room);
        }
        
        setIsNewDmDialogOpen(false);
      } else {
        toast.error("Failed to create direct message");
      }
    } catch (error) {
      console.error("Error creating direct message:", error);
      toast.error("An error occurred while creating direct message");
    } finally {
      setIsCreatingDm(false);
    }
  };
  
  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName ? firstName[0] : '';
    const last = lastName ? lastName[0] : '';
    return (first + last).toUpperCase().substring(0, 2);
  };
  
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-client" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to access chats</p>
      </div>
    );
  }
  
  if (chatRooms.length === 0) {
    return (
      <div className="h-full flex items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">No chat rooms available</p>
        
        <Dialog open={isNewDmDialogOpen} onOpenChange={setIsNewDmDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Start a Conversation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Direct Message</DialogTitle>
            </DialogHeader>
            
            {isLoadingMembers ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-client" />
              </div>
            ) : groupMembers.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-muted-foreground">No members available to message</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2 p-2">
                  {groupMembers.map(member => (
                    <Button
                      key={member.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleCreateDirectMessage(member.id)}
                      disabled={isCreatingDm}
                    >
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={member.avatar_url || ""} />
                        <AvatarFallback>
                          {getInitials(member.first_name, member.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">
                          {member.first_name} {member.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {member.user_type}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  return (
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
            <p className="text-muted-foreground">Select a conversation</p>
          </div>
        )}
      </div>
      
      <Dialog open={isNewDmDialogOpen} onOpenChange={setIsNewDmDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="absolute top-4 right-4">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Direct Message</DialogTitle>
          </DialogHeader>
          
          {isLoadingMembers ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-client" />
            </div>
          ) : groupMembers.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-muted-foreground">No members available to message</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2 p-2">
                {groupMembers.map(member => (
                  <Button
                    key={member.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleCreateDirectMessage(member.id)}
                    disabled={isCreatingDm}
                  >
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={member.avatar_url || ""} />
                      <AvatarFallback>
                        {getInitials(member.first_name, member.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">
                        {member.first_name} {member.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {member.user_type}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
