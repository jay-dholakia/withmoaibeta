
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "./types";
import { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Subscribe to new messages in a chat room
 * @param roomId - The ID of the chat room
 * @param onNewMessage - Callback function when a new message is received
 * @returns The subscription channel
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
      const message = payload.new as ChatMessage;
      
      // Fetch additional sender information
      const senderInfo = await fetchSenderInfo(message.sender_id);
      message.sender_name = senderInfo.name;
      message.sender_profile_picture = senderInfo.profile_picture;
      
      onNewMessage(message);
    })
    .subscribe();

  return channel;
};

/**
 * Fetch all messages for a chat room
 * @param roomId - The ID of the chat room
 * @param limit - Maximum number of messages to fetch (default: 50)
 */
export const fetchMessages = async (
  roomId: string,
  limit: number = 50
): Promise<ChatMessage[]> => {
  try {
    // Get all messages for the room
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    // Get user information for all sender IDs
    const senderIds = [...new Set(messages.map(message => message.sender_id))];
    
    // Get sender information
    const senderInfoMap = new Map();
    for (const senderId of senderIds) {
      const senderInfo = await fetchSenderInfo(senderId);
      senderInfoMap.set(senderId, senderInfo);
    }
    
    // Combine message with sender information
    const messagesWithSenderInfo = messages.map(message => {
      const senderInfo = senderInfoMap.get(message.sender_id) || { name: "Unknown User", profile_picture: null };
      
      return {
        ...message,
        sender_name: senderInfo.name,
        sender_profile_picture: senderInfo.profile_picture
      };
    });

    return messagesWithSenderInfo.reverse();
  } catch (error) {
    console.error('Error in fetchMessages:', error);
    return [];
  }
};

/**
 * Fetches information about a message sender
 * @param senderId - The ID of the sender
 */
export const fetchSenderInfo = async (senderId: string): Promise<{
  name: string;
  profile_picture: string | null;
}> => {
  try {
    // First try to fetch from client_profiles
    const { data: clientProfile, error: clientError } = await supabase
      .from('client_profiles')
      .select('first_name, last_name, avatar_url')
      .eq('id', senderId)
      .maybeSingle();
      
    if (!clientError && clientProfile) {
      const fullName = `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim();
      return {
        name: fullName || senderId,
        profile_picture: clientProfile.avatar_url
      };
    }
    
    // If not found, try coach_profiles
    const { data: coachProfile, error: coachError } = await supabase
      .from('coach_profiles')
      .select('first_name, last_name, avatar_url')
      .eq('id', senderId)
      .maybeSingle();
      
    if (!coachError && coachProfile) {
      const fullName = `${coachProfile.first_name || ''} ${coachProfile.last_name || ''}`.trim();
      return {
        name: fullName || senderId,
        profile_picture: coachProfile.avatar_url
      };
    }
    
    // Get email as fallback
    const { data: userData, error: userError } = await supabase.rpc(
      'get_users_email',
      { user_ids: [senderId] }
    );
    
    if (!userError && userData && userData.length > 0) {
      return {
        name: userData[0].email || senderId,
        profile_picture: null
      };
    }
    
    // Default fallback
    return {
      name: senderId,
      profile_picture: null
    };
  } catch (error) {
    console.error('Error fetching sender info:', error);
    return {
      name: senderId,
      profile_picture: null
    };
  }
};

/**
 * Send a message to a chat room
 * @param roomId - The ID of the chat room
 * @param content - The content of the message
 * @param senderId - The ID of the sender
 * @returns The sent message if successful, null otherwise
 */
export const sendMessage = async (
  roomId: string,
  content: string,
  senderId: string
): Promise<ChatMessage | null> => {
  try {
    // Check if room is a direct message room
    const { data: roomData, error: roomError } = await supabase
      .from('chat_rooms')
      .select('is_group_chat')
      .eq('id', roomId)
      .single();
      
    if (roomError) {
      console.error('Error checking room type:', roomError);
      return null;
    }
    
    const isDirectMessage = !roomData.is_group_chat;
    
    // Insert the message
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: senderId,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    // Get sender information
    const senderInfo = await fetchSenderInfo(senderId);
    
    // Return message with sender info
    return {
      ...data,
      sender_name: senderInfo.name,
      sender_profile_picture: senderInfo.profile_picture
    };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return null;
  }
};
