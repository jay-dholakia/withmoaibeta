import { supabase } from "@/integrations/supabase/client";
import { ChatRoom } from "./types";
import type { RealtimeChannel, PostgrestSingleResponse } from "@supabase/supabase-js";
import { getCurrentWeekStart } from "../accountability-buddy-service";

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
  
  // Then fetch the chat rooms that are group chats but not buddy chats
  const { data, error } = await supabase
    .from("chat_rooms")
    .select(`
      id,
      name,
      is_group_chat,
      created_at,
      group_id
    `)
    .eq("is_group_chat", true)
    .eq("is_buddy_chat", false);

  if (error) {
    console.error("Error fetching group chat rooms:", error);
    return [];
  }

  // Filter the rooms to only include those where the user is a member through a group
  // This will need to be refined if we add functionality to link chat rooms with groups
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
      .maybeSingle();
    
    let otherUserName = "Unknown User";
    let otherUserAvatar = null;
    
    // Based on user type, get the appropriate profile
    if (profileData?.user_type === "coach") {
      const { data: coachProfile } = await supabase
        .from("coach_profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", otherUserId)
        .maybeSingle();
      
      if (coachProfile) {
        otherUserName = `${coachProfile.first_name || ''} ${coachProfile.last_name || ''}`.trim();
        otherUserAvatar = coachProfile.avatar_url;
      }
    } else {
      const { data: clientProfile } = await supabase
        .from("client_profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", otherUserId)
        .maybeSingle();
      
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
  const [groupRooms, dmRooms, buddyRooms] = await Promise.all([
    fetchGroupChatRooms(userId),
    fetchDirectMessageRooms(userId),
    fetchBuddyChatRooms(userId)
  ]);
  
  return [...groupRooms, ...dmRooms, ...buddyRooms];
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
 * Fetches or creates a chat room for accountability buddies
 */
export const getBuddyChatRoom = async (
  buddies: string[],
  pairingRecordId: string
): Promise<string | null> => {
  if (!buddies || buddies.length < 2) {
    console.error("Cannot create buddy chat with fewer than 2 users");
    return null;
  }
  
  if (!pairingRecordId) {
    console.error("Accountability buddy pairing record ID is required to create buddy chat room");
    return null;
  }
  
  // Create a name for the chat room
  const roomName = `Accountability Buddies Chat`;
  
  try {
    // Check if a buddy chat room already exists with this accountability pairing ID
    const { data: existingRooms, error: existingError } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("is_buddy_chat", true)
      .eq("accountability_pairing_id", pairingRecordId);
    
    if (existingError) {
      console.error("Error checking for existing buddy chat rooms:", existingError);
      return null;
    }
    
    if (existingRooms && existingRooms.length > 0) {
      console.log("Found existing buddy chat room:", existingRooms[0].id);
      return existingRooms[0].id;
    }
    
    // Create a new chat room if one doesn't exist
    console.log("Creating new buddy chat room for buddies with pairing ID:", pairingRecordId);
    
    // Sort the buddy IDs to ensure consistency for the buddy_id_string
    const sortedBuddyIds = [...buddies].sort();
    
    const { data: newRoom, error: roomError } = await supabase
      .from("chat_rooms")
      .insert({
        name: roomName,
        is_group_chat: true,
        is_buddy_chat: true,
        accountability_pairing_id: pairingRecordId
      })
      .select("id")
      .single();
    
    if (roomError) {
      console.error("Error creating buddy chat room:", roomError);
      return null;
    }
    
    if (newRoom) {
      console.log("Created new buddy chat room:", newRoom.id);
      return newRoom.id;
    }
    
    return null;
  } catch (error) {
    console.error("Error in getBuddyChatRoom:", error);
    return null;
  }
};

/**
 * Fetches buddy chat rooms for the user
 */
export const fetchBuddyChatRooms = async (userId: string): Promise<ChatRoom[]> => {
  if (!userId) return [];
  
  try {
    // Get the current week start date (Monday)
    const weekStart = getCurrentWeekStart();
    
    console.log(`Fetching buddy pairings for week starting ${weekStart} for user ${userId}`);
    
    // Find the user's accountability buddies for this week
    const { data: buddyPairings, error: buddyError } = await supabase
      .from("accountability_buddies")
      .select("*")
      .eq("week_start", weekStart)
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId},user_id_3.eq.${userId}`);
    
    if (buddyError) {
      console.error("Error fetching buddy pairings:", buddyError);
      return [];
    }
    
    if (!buddyPairings || buddyPairings.length === 0) {
      console.log("No buddy pairings found for this week, checking for any recent pairings");
      
      // If no pairings found for current week, look for any recent pairings
      const { data: recentPairings, error: recentError } = await supabase
        .from("accountability_buddies")
        .select("*")
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId},user_id_3.eq.${userId}`)
        .order("week_start", { ascending: false })
        .limit(1);
      
      if (recentError || !recentPairings || recentPairings.length === 0) {
        console.log("No buddy pairings found at all for user");
        return [];
      }
      
      console.log("Found recent pairing from week:", recentPairings[0].week_start);
      const recentRooms = await processBuddyPairings(recentPairings, userId);
      return recentRooms;
    }
    
    console.log(`Found ${buddyPairings.length} buddy pairings for this week`);
    const buddyRooms = await processBuddyPairings(buddyPairings, userId);
    return buddyRooms;
  } catch (error) {
    console.error("Error fetching buddy chat rooms:", error);
    return [];
  }
};

/**
 * Process buddy pairings to create chat rooms
 */
const processBuddyPairings = async (
  buddyPairings: Array<{
    id: string;
    user_id_1: string;
    user_id_2: string;
    user_id_3: string | null;
    group_id: string;
  }>,
  userId: string
): Promise<ChatRoom[]> => {
  const buddyRooms: ChatRoom[] = [];
  
  if (!buddyPairings || !buddyPairings.length) {
    return [];
  }
  
  for (const pairing of buddyPairings) {
    try {
      // Get all buddy IDs in this pairing (including current user)
      const buddyIds: string[] = [];
      
      // Add valid IDs to our array
      if (pairing.user_id_1) buddyIds.push(pairing.user_id_1);
      if (pairing.user_id_2) buddyIds.push(pairing.user_id_2);
      if (pairing.user_id_3) buddyIds.push(pairing.user_id_3);
      
      // Use the accountability_buddies.id as the unique identifier for this buddy group
      const pairingId = pairing.id;
      
      if (!pairingId) {
        console.error("No ID found in buddy pairing:", pairing);
        continue;
      }
      
      // Check if a chat room exists for this accountability buddy pairing ID
      const { data: rooms, error: roomsError } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("is_buddy_chat", true)
        .eq("accountability_pairing_id", pairingId);
      
      if (roomsError) {
        console.error("Error fetching chat rooms for buddies:", roomsError);
        continue;
      }
      
      // Process member names for room display
      const memberNames = await getMemberNames(buddyIds, userId);
      let roomName = generateRoomName(memberNames);
      
      if (rooms && rooms.length > 0) {
        // Room exists, add it to the list
        buddyRooms.push({
          id: rooms[0].id,
          name: roomName,
          is_group_chat: true,
          is_buddy_chat: true,
          accountability_pairing_id: pairingId,
          created_at: rooms[0].created_at,
          buddy_ids: buddyIds.filter(id => id !== userId),
        });
      } else {
        // Create a new chat room for these buddies
        const roomId = await getBuddyChatRoom(buddyIds, pairingId);
        
        if (roomId) {
          buddyRooms.push({
            id: roomId,
            name: roomName,
            is_group_chat: true,
            is_buddy_chat: true,
            accountability_pairing_id: pairingId,
            created_at: new Date().toISOString(),
            buddy_ids: buddyIds.filter(id => id !== userId),
          });
        }
      }
    } catch (err) {
      console.error("Error processing buddy pairing:", err);
      // Continue with next pairing if there's an error
    }
  }
  
  return buddyRooms;
};

/**
 * Get member names for a list of user IDs
 */
const getMemberNames = async (
  buddyIds: string[],
  currentUserId: string
): Promise<string[]> => {
  const memberNames: string[] = [];
  
  for (const buddyId of buddyIds) {
    if (buddyId === currentUserId) continue; // Skip current user
    
    try {
      const { data: profile, error } = await supabase
        .from("client_profiles")
        .select("first_name, last_name")
        .eq("id", buddyId)
        .maybeSingle(); // Use maybeSingle instead of single
      
      if (error) {
        console.error(`Error fetching profile for buddy ${buddyId}:`, error);
        continue;
      }
      
      if (profile) {
        // Format name to show full first name and first initial of last name
        const firstName = profile.first_name || '';
        const lastNameInitial = profile.last_name ? profile.last_name[0] + '.' : '';
        const name = `${firstName} ${lastNameInitial}`.trim();
        if (name) memberNames.push(name);
      }
    } catch (err) {
      console.error(`Error getting member name for ${buddyId}:`, err);
    }
  }
  
  return memberNames;
};

/**
 * Generate a room name based on member names
 */
const generateRoomName = (memberNames: string[]): string => {
  if (memberNames.length === 0) {
    return "Accountability Buddies";
  }
  
  const roomName = `You, ${memberNames.join(' & ')}`;
  if (roomName.length > 35) {
    return `You & ${memberNames.length} accountability buddies`;
  }
  
  return roomName;
};
