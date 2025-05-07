import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChatRoom } from "@/components/chat/ChatRoom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllChatRooms, createDirectMessageRoom } from "@/services/chat";
import { ChatRoom as ChatRoomType } from "@/services/chat";
import { Menu, ArrowLeft, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GroupMember {
  id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  user_type: string;
}

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
  const [isNewDmDialogOpen, setIsNewDmDialogOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isCreatingDm, setIsCreatingDm] = useState(false);
  const [userGroups, setUserGroups] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    const loadChatRooms = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const rooms = await fetchAllChatRooms(user.id);
        setChatRooms(rooms);
        
        // Handle room selection priority:
        // 1. Buddy chat room from URL parameter
        // 2. Group chat room from URL parameter
        // 3. First available room
        
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
        
        if (rooms.length > 0) {
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
  }, [user?.id, groupId, buddyChatId]);

  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!user?.id) return;
      
      try {
        const { data: groups, error } = await supabase
          .from('group_members')
          .select('group_id, groups:group_id(id, name)')
          .eq('user_id', user.id);
          
        if (error) {
          throw error;
        }
        
        if (groups && groups.length > 0) {
          const formattedGroups = groups.map(g => ({
            id: g.groups.id,
            name: g.groups.name
          }));
          
          setUserGroups(formattedGroups);
        }
      } catch (error) {
        console.error("Error fetching user groups:", error);
      }
    };
    
    fetchUserGroups();
  }, [user?.id]);

  const loadGroupMembers = async (selectedGroupId: string) => {
    if (!user?.id) return;
    
    setIsLoadingMembers(true);
    try {
      // Fetch members of this group
      const { data: memberIds, error: memberError } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", selectedGroupId);
      
      if (memberError) {
        throw memberError;
      }
      
      if (memberIds && memberIds.length > 0) {
        const profiles: GroupMember[] = [];
        
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
          .eq("group_id", selectedGroupId);
          
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
  
  const handleOpenNewDmDialog = () => {
    setIsNewDmDialogOpen(true);
    
    if (userGroups.length > 0) {
      // Load members for the first group by default
      loadGroupMembers(userGroups[0].id);
    }
  };

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
        toast.success("Direct message created successfully");
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

  // Get initials from name
  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName ? firstName[0] : '';
    const last = lastName ? lastName[0] : '';
    return (first + last).toUpperCase().substring(0, 2);
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
                    onNewDirectMessage={handleOpenNewDmDialog}
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
                onNewDirectMessage={handleOpenNewDmDialog}
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

      <Dialog open={isNewDmDialogOpen} onOpenChange={setIsNewDmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Direct Message</DialogTitle>
          </DialogHeader>
          
          {userGroups.length > 0 && (
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Select Group</label>
              <select 
                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                onChange={(e) => loadGroupMembers(e.target.value)}
                defaultValue={userGroups[0].id}
              >
                {userGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
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
                    {isCreatingDm && <Loader2 className="h-4 w-4 ml-auto animate-spin" />}
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
