
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
    
    // Use the Supabase RPC function to create or get a direct message room
    const { data, error } = await (supabase.rpc as any)(
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
    // Fetch profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('id', clientId)
      .maybeSingle();
      
    if (profileError || !profileData) {
      console.error("Error fetching client profile:", profileError);
      return null;
    }

    // Get email from auth.users using RPC function
    const { data: emailData, error: emailError } = await (supabase.rpc as any)(
      'get_users_email',
      { user_ids: [clientId] }
    );
    
    if (emailError || !emailData || emailData.length === 0) {
      console.error("Error fetching client email:", emailError);
      return null;
    }

    return {
      id: clientId,
      email: emailData[0].email,
      metadata: {
        user_type: profileData.user_type
      },
      coach_id: undefined
    };
  } catch (error) {
    console.error("Exception fetching client data:", error);
    return null;
  }
};
