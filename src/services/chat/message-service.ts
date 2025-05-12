
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "./types";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
