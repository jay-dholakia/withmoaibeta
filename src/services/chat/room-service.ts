
import { supabase } from "@/integrations/supabase/client";
import { ChatRoom } from "./types";

/**
 * Fetches group chat rooms for the user
 */
export const fetchGroupChatRooms = async (userId: string): Promise<ChatRoom[]> => {
  if (!userId) return [];
  
  // First, get the groups that the user is a member of
  const { data: userGroups, error: groupError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  if (groupError) {
    console.error("Error fetching user groups:", groupError);
    return [];
  }

  if (!userGroups || userGroups.length === 0) {
    return [];
  }

  // Extract the group IDs into an array
  const groupIds = userGroups.map(item => item.group_id);
  
  // Then fetch the chat rooms for these groups
  const { data, error } = await supabase
    .from("chat_rooms")
    .select(`
      id,
      name,
      is_group_chat,
      group_id,
      created_at
    `)
    .eq("is_group_chat", true)
    .in("group_id", groupIds);

  if (error) {
    console.error("Error fetching group chat rooms:", error);
    return [];
  }

  return data || [];
};

/**
 * Fetches direct message rooms for the user
 */
export const fetchDirectMessageRooms = async (userId: string): Promise<ChatRoom[]> => {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from("direct_message_rooms")
    .select(`
      id,
      room_id,
      user1_id,
      user2_id,
      created_at,
      chat_rooms:room_id (
        id, 
        name,
        is_group_chat,
        created_at
      )
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  if (error) {
    console.error("Error fetching direct message rooms:", error);
    return [];
  }

  // Transform the data to include the other user's information
  const dmRooms: ChatRoom[] = [];
  
  for (const room of data) {
    const otherUserId = room.user1_id === userId ? room.user2_id : room.user1_id;
    
    // Get other user's profile info
    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", otherUserId)
      .single();
    
    let otherUserName = "Unknown User";
    let otherUserAvatar = null;
    
    // Based on user type, get the appropriate profile
    if (profileData?.user_type === "coach") {
      const { data: coachProfile } = await supabase
        .from("coach_profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", otherUserId)
        .single();
      
      if (coachProfile) {
        otherUserName = `${coachProfile.first_name || ''} ${coachProfile.last_name || ''}`.trim();
        otherUserAvatar = coachProfile.avatar_url;
      }
    } else {
      const { data: clientProfile } = await supabase
        .from("client_profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", otherUserId)
        .single();
      
      if (clientProfile) {
        otherUserName = `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim();
        otherUserAvatar = clientProfile.avatar_url;
      }
    }
    
    dmRooms.push({
      id: room.chat_rooms.id,
      name: otherUserName,
      is_group_chat: false,
      other_user_id: otherUserId,
      other_user_name: otherUserName,
      other_user_avatar: otherUserAvatar,
      created_at: room.chat_rooms.created_at
    });
  }

  return dmRooms;
};

/**
 * Fetches all chat rooms for the user
 */
export const fetchAllChatRooms = async (userId: string): Promise<ChatRoom[]> => {
  const [groupRooms, dmRooms] = await Promise.all([
    fetchGroupChatRooms(userId),
    fetchDirectMessageRooms(userId)
  ]);
  
  return [...groupRooms, ...dmRooms];
};

/**
 * Creates a direct message room between two users
 */
export const createDirectMessageRoom = async (
  currentUserId: string,
  otherUserId: string
): Promise<string | null> => {
  if (!currentUserId || !otherUserId) return null;
  
  const { data, error } = await supabase
    .rpc('create_or_get_direct_message_room', {
      user1: currentUserId,
      user2: otherUserId
    });
  
  if (error) {
    console.error("Error creating direct message room:", error);
    return null;
  }
  
  return data as string;
};
