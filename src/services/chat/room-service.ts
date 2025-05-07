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
  buddies: string[]
): Promise<string | null> => {
  if (!buddies || buddies.length < 2) return null;
  
  // Sort the buddy IDs to ensure consistency
  const sortedBuddyIds = [...buddies].sort();
  
  // Create a name for the chat room
  const roomName = `Accountability Buddies Chat`;
  const idString = sortedBuddyIds.join('_');
  
  try {
    // Check if a buddy chat room already exists with these members
    const { data: existingRooms } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("is_group_chat", true)
      .eq("buddy_id_string", idString);
    
    if (existingRooms && existingRooms.length > 0) {
      return existingRooms[0].id;
    }
    
    // Create a new chat room if one doesn't exist
    const { data: newRoom, error: roomError } = await supabase
      .from("chat_rooms")
      .insert({
        name: roomName,
        is_group_chat: true,
        buddy_id_string: idString
      })
      .select("id")
      .single();
    
    if (roomError) {
      console.error("Error creating buddy chat room:", roomError);
      return null;
    }
    
    return newRoom.id;
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
    console.log(`Fetching accountability buddy chat rooms for user: ${userId}`);
    
    // First get all groups the user is a member of
    const { data: userGroups, error: groupError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);
    
    if (groupError) {
      console.error("Error fetching user groups:", groupError);
      return [];
    }
    
    if (!userGroups || userGroups.length === 0) {
      console.log("User is not a member of any groups");
      return [];
    }
    
    console.log(`User is a member of ${userGroups.length} groups`);
    const groupIds = userGroups.map(g => g.group_id);
    
    // Find buddies for each group the user belongs to
    const buddyRooms: ChatRoom[] = [];
    
    // Get the current week (Monday as first day)
    const monday = new Date();
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    const weekStart = monday.toISOString().split('T')[0];
    console.log(`Checking for buddy pairings for week starting: ${weekStart}`);
    
    // We'll get buddy pairings for all groups the user is a member of
    for (const groupId of groupIds) {
      // Find the user's accountability buddies for this week in this group
      const { data: buddyPairings, error: buddyError } = await supabase
        .from("accountability_buddies")
        .select("*")
        .eq("week_start", weekStart)
        .eq("group_id", groupId)
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId},user_id_3.eq.${userId}`);
      
      if (buddyError) {
        console.error(`Error fetching buddy pairings for group ${groupId}:`, buddyError);
        continue;
      }
      
      if (!buddyPairings || buddyPairings.length === 0) {
        console.log(`No buddy pairings found for group ${groupId} for week ${weekStart}`);
        continue;
      }
      
      console.log(`Found ${buddyPairings.length} buddy pairings for group ${groupId}`);
      
      for (const pairing of buddyPairings) {
        // Get all buddy IDs in this pairing (including current user)
        const buddyIds = [pairing.user_id_1, pairing.user_id_2, pairing.user_id_3]
          .filter(id => id !== null) as string[];
        
        // Create a consistent string of sorted IDs to identify this buddy group
        const idString = [...buddyIds].sort().join('_');
        
        // Check if a chat room exists for these buddies
        const { data: rooms } = await supabase
          .from("chat_rooms")
          .select("*")
          .eq("is_group_chat", true)
          .eq("buddy_id_string", idString);
        
        if (rooms && rooms.length > 0) {
          // Get member names for the chat room display
          const memberNames: string[] = [];
          
          for (const buddyId of buddyIds) {
            if (buddyId === userId) continue; // Skip current user
            
            const { data: profile } = await supabase
              .from("client_profiles")
              .select("first_name, last_name")
              .eq("id", buddyId)
              .single();
            
            if (profile) {
              const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
              if (name) memberNames.push(name);
            }
          }
          
          let roomName = "You";
          if (memberNames.length > 0) {
            roomName = `You & ${memberNames.join(' & ')}`;
            if (roomName.length > 35) {
              roomName = `You & ${memberNames.length} accountability buddies`;
            }
          }
          
          buddyRooms.push({
            id: rooms[0].id,
            name: roomName,
            is_group_chat: true,
            is_buddy_chat: true,
            created_at: rooms[0].created_at,
            buddy_ids: buddyIds.filter(id => id !== userId),
            buddy_id_string: idString
          });
        } else {
          // Create a new chat room for these buddies
          const roomId = await getBuddyChatRoom(buddyIds);
          
          if (roomId) {
            const memberNames: string[] = [];
            
            for (const buddyId of buddyIds) {
              if (buddyId === userId) continue;
              
              const { data: profile } = await supabase
                .from("client_profiles")
                .select("first_name, last_name")
                .eq("id", buddyId)
                .single();
              
              if (profile) {
                const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
                if (name) memberNames.push(name);
              }
            }
            
            let roomName = "You";
            if (memberNames.length > 0) {
              roomName = `You & ${memberNames.join(' & ')}`;
              if (roomName.length > 35) {
                roomName = `You & ${memberNames.length} accountability buddies`;
              }
            }
            
            buddyRooms.push({
              id: roomId,
              name: roomName,
              is_group_chat: true,
              is_buddy_chat: true,
              created_at: new Date().toISOString(),
              buddy_ids: buddyIds.filter(id => id !== userId),
              buddy_id_string: idString
            });
          }
        }
      }
    }
    
    console.log(`Returning ${buddyRooms.length} buddy chat rooms`);
    return buddyRooms;
  } catch (error) {
    console.error("Error fetching buddy chat rooms:", error);
    return [];
  }
};
