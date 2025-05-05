
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type ChatMessage = {
  id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  content: string;
  created_at: string;
  room_id: string;
  is_direct_message: boolean;
};

export type ChatRoom = {
  id: string;
  name: string;
  is_group_chat: boolean;
  group_id?: string;
  other_user_id?: string;
  other_user_name?: string;
  other_user_avatar?: string;
  created_at: string;
};

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
 * Fetches messages for a specific chat room
 */
export const fetchMessages = async (roomId: string, limit = 50): Promise<ChatMessage[]> => {
  if (!roomId) return [];
  
  const { data, error } = await supabase
    .from("chat_messages")
    .select(`
      id,
      sender_id,
      content,
      created_at,
      room_id,
      is_direct_message
    `)
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  const messages = await Promise.all((data || []).map(async (message) => {
    // Get sender profile info
    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", message.sender_id)
      .single();
    
    let senderName = "Unknown User";
    let senderAvatar = null;
    
    // Based on user type, get the appropriate profile
    if (profileData?.user_type === "coach") {
      const { data: coachProfile } = await supabase
        .from("coach_profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", message.sender_id)
        .single();
      
      if (coachProfile) {
        senderName = `${coachProfile.first_name || ''} ${coachProfile.last_name || ''}`.trim();
        senderAvatar = coachProfile.avatar_url;
      }
    } else {
      const { data: clientProfile } = await supabase
        .from("client_profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", message.sender_id)
        .single();
      
      if (clientProfile) {
        senderName = `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim();
        senderAvatar = clientProfile.avatar_url;
      }
    }

    return {
      ...message,
      sender_name: senderName,
      sender_avatar: senderAvatar
    } as ChatMessage;
  }));

  return messages.reverse(); // Return messages in chronological order
};

/**
 * Sends a message to a chat room
 */
export const sendMessage = async (
  roomId: string,
  content: string,
  senderId: string,
  isDirectMessage = false
): Promise<ChatMessage | null> => {
  if (!roomId || !content || !senderId) return null;
  
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      room_id: roomId,
      sender_id: senderId,
      content,
      is_direct_message: isDirectMessage
    })
    .select("*")
    .single();
  
  if (error) {
    console.error("Error sending message:", error);
    return null;
  }
  
  return data as ChatMessage;
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

/**
 * Sets up a realtime subscription for a chat room
 */
export const subscribeToRoom = (
  roomId: string,
  callback: (message: ChatMessage) => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      },
      async (payload) => {
        const newMessage = payload.new as ChatMessage;
        
        // Fetch user profile info for the sender
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", newMessage.sender_id)
          .single();
        
        let senderName = "Unknown User";
        let senderAvatar = null;
        
        if (profileData?.user_type === "coach") {
          const { data: coachProfile } = await supabase
            .from("coach_profiles")
            .select("first_name, last_name, avatar_url")
            .eq("id", newMessage.sender_id)
            .single();
          
          if (coachProfile) {
            senderName = `${coachProfile.first_name || ''} ${coachProfile.last_name || ''}`.trim();
            senderAvatar = coachProfile.avatar_url;
          }
        } else {
          const { data: clientProfile } = await supabase
            .from("client_profiles")
            .select("first_name, last_name, avatar_url")
            .eq("id", newMessage.sender_id)
            .single();
          
          if (clientProfile) {
            senderName = `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim();
            senderAvatar = clientProfile.avatar_url;
          }
        }

        callback({
          ...newMessage,
          sender_name: senderName,
          sender_avatar: senderAvatar
        });
      }
    )
    .subscribe();
  
  return channel;
};
