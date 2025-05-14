
// Import needed dependencies
import { supabase } from "@/integrations/supabase/client";
import { ChatRoom } from "./types";

/**
 * Fetch all chat rooms for a user
 * @param userId - The ID of the user
 */
export const fetchUserChatRooms = async (userId: string): Promise<ChatRoom[]> => {
  // Fetch direct message rooms where the user is a participant
  const { data: directMessageRooms, error: dmError } = await supabase
    .from("direct_message_rooms")
    .select(`
      room_id,
      chat_rooms:room_id (id, name, is_group_chat, created_at, group_id),
      user1:user1_id (id, email),
      user2:user2_id (id, email)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  if (dmError) {
    console.error("Error fetching direct message rooms:", dmError);
    return [];
  }

  // Fetch group chat rooms where the user is a member
  // Not using group_chat_members as it's not in the Supabase schema
  const { data: userGroups, error: userGroupsError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);
  
  let groupChatRooms = [];
  if (!userGroupsError && userGroups) {
    for (const groupMembership of userGroups) {
      const { data: groupRoom, error: groupRoomError } = await supabase
        .from("chat_rooms")
        .select("id, name, is_group_chat, created_at, group_id")
        .eq("group_id", groupMembership.group_id)
        .eq("is_group_chat", true)
        .maybeSingle();
        
      if (!groupRoomError && groupRoom) {
        groupChatRooms.push(groupRoom);
      }
    }
  }

  // Fetch buddy chat rooms
  let buddyChatRoomsData: any[] = [];
  const { data: fetchedBuddyChatRooms, error: buddyError } = await supabase
    .from("chat_rooms")
    .select("id, name, is_group_chat, is_buddy_chat, created_at, group_id")
    .eq("is_buddy_chat", true)
    .filter("id", "in", (
      supabase
        .from("chat_messages")
        .select("room_id")
        .eq("sender_id", userId)
    ));

  if (buddyError) {
    console.error("Error fetching buddy chat rooms:", buddyError);
  } else if (fetchedBuddyChatRooms) {
    buddyChatRoomsData = fetchedBuddyChatRooms;
  }

  // Process direct message rooms to get the other user's information
  const processedDmRooms = directMessageRooms?.map(room => {
    // For direct messages, determine the other user
    const otherUserId = room.user1?.id === userId ? room.user2?.id : room.user1?.id;
    const otherUserEmail = room.user1?.id === userId ? room.user2?.email : room.user1?.email;
    
    return {
      id: room.chat_rooms.id,
      name: "Direct Message",
      is_group_chat: false,
      is_buddy_chat: false,
      created_at: room.chat_rooms.created_at,
      group_id: room.chat_rooms.group_id,
      other_user_id: otherUserId,
      other_user_name: otherUserEmail || "Unknown User",
      other_user_profile_picture: null,
    };
  }) || [];

  // Process group chat rooms
  const processedGroupRooms = groupChatRooms.map(chatRoom => ({
    id: chatRoom.id,
    name: chatRoom.name || "Group Chat",
    is_group_chat: true,
    is_buddy_chat: false,
    created_at: chatRoom.created_at,
    group_id: chatRoom.group_id,
  })) || [];

  // Process buddy chat rooms
  const processedBuddyRooms = buddyChatRoomsData.map(room => ({
    id: room.id,
    name: "Accountability Buddies",
    is_group_chat: true,
    is_buddy_chat: true,
    created_at: room.created_at,
    group_id: room.group_id,
  })) || [];

  // Combine all rooms and sort by most recent
  const allRooms = [
    ...processedDmRooms,
    ...processedGroupRooms,
    ...processedBuddyRooms
  ].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return allRooms;
};

/**
 * Create a direct message room between two users
 * @param currentUserId - The ID of the current user
 * @param otherUserId - The ID of the other user
 * @returns The room ID if successful, null otherwise
 */
export const createDirectMessageRoom = async (currentUserId: string, otherUserId: string): Promise<string | null> => {
  try {
    return await createOrGetDirectMessageRoom(currentUserId, otherUserId);
  } catch (error) {
    console.error("Error in createDirectMessageRoom:", error);
    return null;
  }
};

/**
 * Create or get a direct message room between two users
 * @param currentUserId - The ID of the current user
 * @param otherUserId - The ID of the other user
 */
export const createOrGetDirectMessageRoom = async (currentUserId: string, otherUserId: string): Promise<string | null> => {
  try {
    // Call the database function to create or get direct message room
    const { data, error } = await supabase
      .rpc("create_or_get_direct_message_room", {
        user1: currentUserId,
        user2: otherUserId
      });

    if (error) {
      console.error("Error creating/getting DM room:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Exception in createOrGetDirectMessageRoom:", error);
    return null;
  }
};

/**
 * Create or get a buddy chat room for accountability buddies
 * @param userIds - Array of user IDs who are accountability buddies
 * @param buddyRecordId - The ID of the accountability buddy record
 * @returns The room ID if successful, null otherwise
 */
export const getBuddyChatRoom = async (userIds: string[], buddyRecordId: string): Promise<string | null> => {
  try {
    // Check if a buddy chat room already exists for this record
    const { data: existingRooms, error: existingError } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("is_buddy_chat", true)
      .eq("accountability_pairing_id", buddyRecordId);
      
    if (existingError) {
      console.error("Error checking for existing buddy chat room:", existingError);
      return null;
    }
    
    // If room exists, return it
    if (existingRooms && existingRooms.length > 0) {
      return existingRooms[0].id;
    }
    
    // If not, create a new chat room
    const { data: roomData, error: roomError } = await supabase
      .from("chat_rooms")
      .insert({
        name: "Accountability Buddies",
        is_group_chat: true,
        is_buddy_chat: true,
        accountability_pairing_id: buddyRecordId
      })
      .select();
      
    if (roomError || !roomData || roomData.length === 0) {
      console.error("Error creating buddy chat room:", roomError);
      return null;
    }
    
    const roomId = roomData[0].id;
    
    // For each user, make sure they're linked to this chat room
    for (const userId of userIds) {
      // We need to add each user as a chat room participant
      // This implementation depends on your schema
      // For direct messages we'd use direct_message_rooms
      // For group chats we might use a different table
    }
    
    return roomId;
  } catch (error) {
    console.error("Exception in getBuddyChatRoom:", error);
    return null;
  }
};

/**
 * Fetch all chat rooms for the current user
 * @param userId - The ID of the current user
 */
export const fetchAllChatRooms = async (userId: string): Promise<ChatRoom[]> => {
  return await fetchUserChatRooms(userId);
};
