
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "./types";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Fetch all messages for a chat room
 * @param roomId - The ID of the chat room
 */
export const fetchMessages = async (roomId: string): Promise<ChatMessage[]> => {
  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select(`
      *,
      sender:sender_id (
        id,
        email,
        client_profiles:profiles!inner(first_name, last_name, avatar_url),
        coach_profiles:profiles!inner(first_name, last_name, avatar_url)
      )
    `)
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  // Process messages to include sender name and profile picture
  return messages.map((message: any) => {
    // Determine if the sender has a client or coach profile
    const hasClientProfile = message.sender?.client_profiles?.length > 0;
    const hasCoachProfile = message.sender?.coach_profiles?.length > 0;
    
    // Extract profile data based on what's available
    const firstName = hasClientProfile ? message.sender.client_profiles[0]?.first_name : 
                      hasCoachProfile ? message.sender.coach_profiles[0]?.first_name : null;
    const lastName = hasClientProfile ? message.sender.client_profiles[0]?.last_name : 
                     hasCoachProfile ? message.sender.coach_profiles[0]?.last_name : null;
    const avatarUrl = hasClientProfile ? message.sender.client_profiles[0]?.avatar_url : 
                      hasCoachProfile ? message.sender.coach_profiles[0]?.avatar_url : null;
    
    // Format sender name
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : 
                      firstName ? firstName : 
                      message.sender?.email || "Unknown User";
    
    return {
      id: message.id,
      room_id: message.room_id,
      sender_id: message.sender_id,
      sender_name: fullName,
      sender_profile_picture: avatarUrl,
      content: message.content,
      created_at: message.created_at,
    };
  });
};

/**
 * Send a message to a chat room
 * @param roomId - The ID of the chat room
 * @param content - The message content
 * @param senderId - The ID of the message sender
 * @param isDirectMessage - Whether this is a direct message
 * @returns The sent message if successful, null otherwise
 */
export const sendMessage = async (
  roomId: string, 
  content: string, 
  senderId: string,
  isDirectMessage: boolean = false
): Promise<ChatMessage | null> => {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        room_id: roomId,
        content,
        sender_id: senderId,
        is_direct_message: isDirectMessage
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return null;
    }

    // Fetch sender details
    const { data: senderData } = await supabase
      .from("profiles")
      .select("id, user_type")
      .eq("id", senderId)
      .single();

    let senderName = "Unknown User";
    let profilePicture = null;

    // Based on user type, get the appropriate profile
    if (senderData?.user_type === "client") {
      const { data: clientProfile } = await supabase
        .from("client_profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", senderId)
        .single();

      if (clientProfile) {
        senderName = `${clientProfile.first_name || ""} ${clientProfile.last_name || ""}`.trim();
        profilePicture = clientProfile.avatar_url;
      }
    } else if (senderData?.user_type === "coach") {
      const { data: coachProfile } = await supabase
        .from("coach_profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", senderId)
        .single();

      if (coachProfile) {
        senderName = `${coachProfile.first_name || ""} ${coachProfile.last_name || ""}`.trim();
        profilePicture = coachProfile.avatar_url;
      }
    }

    return {
      id: data.id,
      room_id: data.room_id,
      sender_id: data.sender_id,
      sender_name: senderName,
      sender_profile_picture: profilePicture,
      content: data.content,
      created_at: data.created_at
    };
  } catch (error) {
    console.error("Exception in sendMessage:", error);
    return null;
  }
};

/**
 * Subscribe to a chat room to receive new messages
 * @param roomId - The ID of the chat room
 * @param callback - The callback to handle new messages
 */
export const subscribeToRoom = (
  roomId: string,
  callback: (message: ChatMessage) => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `room_id=eq.${roomId}`
      },
      async (payload: any) => {
        // Get the new message data
        const newMessage = payload.new;
        
        // Fetch sender details
        const { data: senderData } = await supabase
          .from("profiles")
          .select("id, user_type")
          .eq("id", newMessage.sender_id)
          .single();
  
        let senderName = "Unknown User";
        let profilePicture = null;
  
        // Based on user type, get the appropriate profile
        if (senderData?.user_type === "client") {
          const { data: clientProfile } = await supabase
            .from("client_profiles")
            .select("first_name, last_name, avatar_url")
            .eq("id", newMessage.sender_id)
            .maybeSingle();
  
          if (clientProfile) {
            senderName = `${clientProfile.first_name || ""} ${clientProfile.last_name || ""}`.trim();
            profilePicture = clientProfile.avatar_url;
          }
        } else if (senderData?.user_type === "coach") {
          const { data: coachProfile } = await supabase
            .from("coach_profiles")
            .select("first_name, last_name, avatar_url")
            .eq("id", newMessage.sender_id)
            .maybeSingle();
  
          if (coachProfile) {
            senderName = `${coachProfile.first_name || ""} ${coachProfile.last_name || ""}`.trim();
            profilePicture = coachProfile.avatar_url;
          }
        }
      
        // Call the callback with the formatted message
        callback({
          id: newMessage.id,
          room_id: newMessage.room_id,
          sender_id: newMessage.sender_id,
          sender_name: senderName,
          sender_profile_picture: profilePicture,
          content: newMessage.content,
          created_at: newMessage.created_at
        });
      }
    )
    .subscribe();

  return channel;
};
