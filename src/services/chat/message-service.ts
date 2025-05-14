
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "./types";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Fetches messages for a chat room
 */
export const fetchMessages = async (roomId: string): Promise<ChatMessage[]> => {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select(`
        id,
        content,
        sender_id,
        created_at,
        room_id,
        is_direct_message
      `)
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching chat messages:", error);
      return [];
    }

    // For each message, get sender's name and avatar based on their user type
    const messages: ChatMessage[] = [];
    
    for (const message of data) {
      // First get user type from the profiles table
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", message.sender_id)
        .maybeSingle();
      
      let senderName = "Unknown User";
      let senderAvatar = null;
      
      // Get user profile details based on user type
      if (profileData?.user_type === 'coach') {
        const { data: coachProfile } = await supabase
          .from("coach_profiles")
          .select("first_name, last_name, avatar_url")
          .eq("id", message.sender_id)
          .maybeSingle();
          
        if (coachProfile) {
          senderName = `${coachProfile.first_name || ''} ${coachProfile.last_name || ''}`.trim();
          senderAvatar = coachProfile.avatar_url;
        }
      } else if (profileData?.user_type === 'client') {
        const { data: clientProfile } = await supabase
          .from("client_profiles")
          .select("first_name, last_name, avatar_url")
          .eq("id", message.sender_id)
          .maybeSingle();
          
        if (clientProfile) {
          senderName = `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim();
          senderAvatar = clientProfile.avatar_url;
        }
      }
      
      messages.push({
        id: message.id,
        content: message.content,
        sender_id: message.sender_id,
        created_at: message.created_at,
        room_id: message.room_id,
        is_direct_message: message.is_direct_message,
        sender_name: senderName,
        sender_avatar: senderAvatar
      });
    }

    return messages;
  } catch (error) {
    console.error("Error in fetchMessages:", error);
    return [];
  }
};

/**
 * Sends a message to a chat room
 */
export const sendMessage = async (
  roomId: string,
  content: string,
  senderId: string,
  isDirectMessage: boolean = false
): Promise<ChatMessage | null> => {
  try {
    // First verify the room exists
    const { data: roomData, error: roomError } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("id", roomId)
      .maybeSingle();
    
    if (roomError || !roomData) {
      console.error("Chat room not found:", { roomId, error: roomError });
      return null;
    }
    
    // Insert the message
    const { data: messageData, error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        content,
        sender_id: senderId,
        room_id: roomId,
        is_direct_message: isDirectMessage
      })
      .select("*")
      .single();
    
    if (messageError) {
      console.error("Error sending chat message:", messageError);
      return null;
    }
    
    // Get sender's profile info for returning complete message data
    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", senderId)
      .maybeSingle();
      
    let senderName = "Unknown User";
    let senderAvatar = null;
    
    if (profileData) {
      // Based on user type, get the appropriate profile info
      if (profileData.user_type === 'coach') {
        const { data: coachProfile } = await supabase
          .from("coach_profiles")
          .select("first_name, last_name, avatar_url")
          .eq("id", senderId)
          .maybeSingle();
          
        if (coachProfile) {
          senderName = `${coachProfile.first_name || ''} ${coachProfile.last_name || ''}`.trim();
          senderAvatar = coachProfile.avatar_url;
        }
      } else {
        const { data: clientProfile } = await supabase
          .from("client_profiles")
          .select("first_name, last_name, avatar_url")
          .eq("id", senderId)
          .maybeSingle();
          
        if (clientProfile) {
          senderName = `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim();
          senderAvatar = clientProfile.avatar_url;
        }
      }
    }
    
    return {
      id: messageData.id,
      content: messageData.content,
      sender_id: messageData.sender_id,
      created_at: messageData.created_at,
      room_id: messageData.room_id,
      is_direct_message: messageData.is_direct_message,
      sender_name: senderName,
      sender_avatar: senderAvatar
    };
    
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return null;
  }
};

/**
 * Subscribes to new messages in a chat room
 */
export const subscribeToRoom = (
  roomId: string,
  onNewMessage: (message: ChatMessage) => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`room:${roomId}`)
    .on('postgres_changes', { 
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `room_id=eq.${roomId}`
    }, async (payload) => {
      // When a new message is received
      const message = payload.new as any;
      
      // Get sender details
      let senderName = "Unknown User";
      let senderAvatar = null;
      
      try {
        // First get user type
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", message.sender_id)
          .maybeSingle();
          
        if (profileData) {
          // Based on user type, get the appropriate profile info
          if (profileData.user_type === 'coach') {
            const { data: coachProfile } = await supabase
              .from("coach_profiles")
              .select("first_name, last_name, avatar_url")
              .eq("id", message.sender_id)
              .maybeSingle();
              
            if (coachProfile) {
              senderName = `${coachProfile.first_name || ''} ${coachProfile.last_name || ''}`.trim();
              senderAvatar = coachProfile.avatar_url;
            }
          } else {
            const { data: clientProfile } = await supabase
              .from("client_profiles")
              .select("first_name, last_name, avatar_url")
              .eq("id", message.sender_id)
              .maybeSingle();
              
            if (clientProfile) {
              senderName = `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim();
              senderAvatar = clientProfile.avatar_url;
            }
          }
        }
      } catch (error) {
        console.error("Error getting sender details:", error);
      }
      
      // Call the callback with the complete message data
      onNewMessage({
        id: message.id,
        content: message.content,
        sender_id: message.sender_id,
        created_at: message.created_at,
        room_id: message.room_id,
        is_direct_message: message.is_direct_message,
        sender_name: senderName,
        sender_avatar: senderAvatar
      });
    })
    .subscribe();

  return channel;
};
