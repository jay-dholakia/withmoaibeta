
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/user';

export interface GroupMember {
  id: string;
  name: string;
  profile_picture_url: string;
  completed_workout_ids: string[];
}

// Define interfaces for the raw data returned from Supabase
interface RawGroupMember {
  user_id: string;
  client_profiles?: {
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

interface WorkoutCompletion {
  id: string;
  user_id: string;
  workout_id: string;
  completed_at: string;
}

/**
 * Fetches group members for the current user's group
 */
export const fetchGroupMembers = async (userId: string): Promise<GroupMember[]> => {
  try {
    if (!userId) {
      console.error("Cannot fetch group members: User ID is missing");
      return [];
    }
    
    console.log("Fetching group members for user:", userId);
    
    // First, get the group IDs that the user belongs to
    const { data: userGroups, error: groupError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);
      
    if (groupError) {
      console.error("Error fetching user groups:", groupError);
      return [];
    }
    
    if (!userGroups || userGroups.length === 0) {
      console.log("User doesn't belong to any groups");
      return [];
    }
    
    const groupIds = userGroups.map(g => g.group_id);
    console.log("User belongs to these groups:", groupIds);
    
    // Then, get all members of those groups
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        client_profiles:user_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .in('group_id', groupIds)
      .returns<RawGroupMember[]>();
      
    if (membersError) {
      console.error("Error fetching group members:", membersError);
      return [];
    }
    
    console.log("Found group members:", groupMembers?.length || 0);
    
    // Get the user IDs to fetch their workout completions
    const memberIds = groupMembers.map(m => m.user_id);
    
    // Fetch workout completions for all members
    const { data: workoutCompletions, error: completionsError } = await supabase
      .from('workout_completions')
      .select('id, user_id, workout_id, completed_at')
      .in('user_id', memberIds)
      .not('completed_at', 'is', null)
      .returns<WorkoutCompletion[]>();
      
    if (completionsError) {
      console.error("Error fetching workout completions:", completionsError);
      return [];
    }
    
    console.log("Found workout completions:", workoutCompletions?.length || 0);
    
    // Map to the required format
    const mappedMembers: GroupMember[] = groupMembers.map(member => {
      // Get all workout IDs completed by this member
      const completedWorkoutIds = workoutCompletions
        .filter(completion => completion.user_id === member.user_id && completion.workout_id)
        .map(completion => completion.workout_id);
        
      // Handle null/undefined profile safely
      const profile = member.client_profiles || {};
      
      // Use nullish coalescing for safer access
      const firstName = profile.first_name ?? '';
      const lastName = profile.last_name ?? '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown User';
      
      return {
        id: member.user_id,
        name: fullName,
        profile_picture_url: profile.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`,
        completed_workout_ids: completedWorkoutIds
      };
    });
    
    console.log("Mapped members result:", mappedMembers);
    return mappedMembers;
  } catch (error) {
    console.error("Error in fetchGroupMembers:", error);
    return [];
  }
};
