
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/user';

export interface GroupMember {
  id: string;
  name: string;
  profile_picture_url: string;
  completed_workout_ids: string[];
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
    
    // Then, get all members of those groups
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select(`
        user_id,
        profiles:user_id (
          id,
          user_type
        ),
        client_profiles:user_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .in('group_id', groupIds);
      
    if (membersError) {
      console.error("Error fetching group members:", membersError);
      return [];
    }
    
    // Get the user IDs to fetch their workout completions
    const memberIds = groupMembers.map(m => m.user_id);
    
    // Fetch workout completions for all members
    const { data: workoutCompletions, error: completionsError } = await supabase
      .from('workout_completions')
      .select('id, user_id, workout_id, completed_at')
      .in('user_id', memberIds)
      .not('completed_at', 'is', null);
      
    if (completionsError) {
      console.error("Error fetching workout completions:", completionsError);
      return [];
    }
    
    // Map to the required format
    const mappedMembers: GroupMember[] = groupMembers.map(member => {
      // Get all workout IDs completed by this member
      const completedWorkoutIds = workoutCompletions
        .filter(completion => completion.user_id === member.user_id && completion.workout_id)
        .map(completion => completion.workout_id);
        
      const profile = member.client_profiles || {};
      
      const firstName = profile.first_name || '';
      const lastName = profile.last_name || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown User';
      
      return {
        id: member.user_id,
        name: fullName,
        profile_picture_url: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`,
        completed_workout_ids: completedWorkoutIds
      };
    });
    
    return mappedMembers;
  } catch (error) {
    console.error("Error in fetchGroupMembers:", error);
    return [];
  }
};
