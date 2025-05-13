
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/user";

/**
 * Creates a direct message room between a coach and client
 * @param coachId The coach's user ID
 * @param clientId The client's user ID
 * @returns The created or existing room ID, or null if an error occurred
 */
export const createDirectMessage = async (
  coachId: string, 
  clientId: string
): Promise<string | null> => {
  try {
    console.log("Creating direct message room between:", { coachId, clientId });
    
    // Ensure both IDs are valid UUIDs and different from each other
    if (!coachId || !clientId || coachId === clientId) {
      console.error("Invalid coach or client ID for direct message:", { coachId, clientId });
      return null;
    }
    
    // First check if users exist in auth.users using the get_users_email RPC function
    // This is more reliable than checking profiles as some users might not have profiles yet
    const { data: usersData, error: usersError } = await supabase.rpc(
      'get_users_email',
      { user_ids: [coachId, clientId] }
    );
    
    if (usersError) {
      console.error("Error checking users:", usersError);
      return null;
    }
    
    if (!usersData || usersData.length < 2) {
      console.error("One or both users don't exist in auth.users:", { 
        coachId, 
        clientId, 
        foundCount: usersData?.length || 0,
        foundIds: usersData?.map(u => u.id)
      });
      return null;
    }
    
    // Use the Supabase RPC function to create or get a direct message room
    const { data, error } = await supabase.rpc(
      'create_or_get_direct_message_room',
      { user1: coachId, user2: clientId }
    );
    
    if (error) {
      console.error("Error creating direct message room:", error);
      return null;
    }
    
    console.log("Created or got direct message room:", data);
    return data as string;
  } catch (error) {
    console.error("Exception creating direct message room:", error);
    return null;
  }
};

/**
 * Fetches client data based on client ID
 */
export const getClientData = async (clientId: string): Promise<User | null> => {
  try {
    // Check if the user exists in auth.users first
    const { data: userData, error: userError } = await supabase.rpc(
      'get_users_email',
      { user_ids: [clientId] }
    );
      
    if (userError || !userData || userData.length === 0) {
      console.error("Error: User doesn't exist in auth.users:", clientId, userError);
      return null;
    }

    // Try to get profile data if available
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('id', clientId)
      .maybeSingle();
      
    // We don't consider this a fatal error - the user might exist but not have a profile yet
    const userType = profileData?.user_type || 'client';

    return {
      id: clientId,
      email: userData[0].email,
      metadata: {
        user_type: userType
      },
      coach_id: undefined
    };
  } catch (error) {
    console.error("Exception fetching client data:", error);
    return null;
  }
};
