
// Import needed dependencies
import { supabase } from "@/integrations/supabase/client";
import { ChatRoom } from "./types";
import { toast } from "sonner";

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
      user1:user1_id (id, profiles:id (id, full_name, profile_picture_url)),
      user2:user2_id (id, profiles:id (id, full_name, profile_picture_url))
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  if (dmError) {
    console.error("Error fetching direct message rooms:", dmError);
    return [];
  }

  // Fetch group chat rooms where the user is a member
  const { data: groupChatRooms, error: groupError } = await supabase
    .from("group_chat_members")
    .select(`
      chat_rooms:room_id (id, name, is_group_chat, created_at, group_id)
    `)
    .eq("user_id", userId);

  if (groupError) {
    console.error("Error fetching group chat rooms:", groupError);
    return [];
  }

  // Fetch buddy chat rooms
  const { data: buddyChatRooms, error: buddyError } = await supabase
    .from("buddy_chat_rooms")
    .select(`
      chat_rooms:room_id (id, name, is_group_chat, created_at, group_id),
      accountability_buddy_id
    `)
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId},user_id_3.eq.${userId}`);

  if (buddyError) {
    console.error("Error fetching buddy chat rooms:", buddyError);
  }

  // Process direct message rooms to get the other user's information
  const processedDmRooms = directMessageRooms?.map(room => {
    const otherUser = room.user1.id === userId ? room.user2 : room.user1;
    return {
      id: room.chat_rooms.id,
      name: room.chat_rooms.name || "Direct Message",
      is_group_chat: false,
      is_buddy_chat: false,
      created_at: room.chat_rooms.created_at,
      group_id: room.chat_rooms.group_id,
      other_user_id: otherUser.id,
      other_user_name: otherUser.profiles?.full_name || "Unknown User",
      other_user_profile_picture: otherUser.profiles?.profile_picture_url || null,
    };
  }) || [];

  // Process group chat rooms
  const processedGroupRooms = groupChatRooms?.map(({ chat_rooms }) => ({
    id: chat_rooms.id,
    name: chat_rooms.name || "Group Chat",
    is_group_chat: true,
    is_buddy_chat: false,
    created_at: chat_rooms.created_at,
    group_id: chat_rooms.group_id,
  })) || [];

  // Process buddy chat rooms
  const processedBuddyRooms = buddyChatRooms?.map(room => ({
    id: room.chat_rooms.id,
    name: "Accountability Buddies",
    is_group_chat: true,
    is_buddy_chat: true,
    created_at: room.chat_rooms.created_at,
    group_id: room.chat_rooms.group_id,
    accountability_buddy_id: room.accountability_buddy_id,
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
      .from("buddy_chat_rooms")
      .select("room_id")
      .eq("accountability_buddy_id", buddyRecordId);
      
    if (existingError) {
      console.error("Error checking for existing buddy chat room:", existingError);
      return null;
    }
    
    // If room exists, return it
    if (existingRooms && existingRooms.length > 0) {
      return existingRooms[0].room_id;
    }
    
    // If not, create a new chat room
    const { data: roomData, error: roomError } = await supabase
      .from("chat_rooms")
      .insert({
        name: "Accountability Buddies",
        is_group_chat: true
      })
      .select();
      
    if (roomError || !roomData || roomData.length === 0) {
      console.error("Error creating buddy chat room:", roomError);
      return null;
    }
    
    const roomId = roomData[0].id;
    
    // Now create the buddy_chat_rooms record
    const { error: buddyRoomError } = await supabase
      .from("buddy_chat_rooms")
      .insert({
        room_id: roomId,
        accountability_buddy_id: buddyRecordId,
        user_id_1: userIds[0],
        user_id_2: userIds[1],
        user_id_3: userIds.length > 2 ? userIds[2] : null
      });
      
    if (buddyRoomError) {
      console.error("Error creating buddy chat room link:", buddyRoomError);
      return null;
    }
    
    // Add all users as members of the group chat
    const membersToInsert = userIds.map(userId => ({
      room_id: roomId,
      user_id: userId
    }));
    
    const { error: memberError } = await supabase
      .from("group_chat_members")
      .insert(membersToInsert);
      
    if (memberError) {
      console.error("Error adding members to buddy chat room:", memberError);
      // We'll still return the roomId since the room was created
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
