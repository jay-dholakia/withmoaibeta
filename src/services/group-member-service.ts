import { supabase } from '@/integrations/supabase/client';

export interface GroupMember {
  id: string;
  name: string;
  profile_picture_url: string | null;
  completed_workout_ids: string[];
}

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
 * Fetches group members for the current user's group,
 * including their profile data and completed workout IDs.
 */
export const fetchGroupMembers = async (userId: string): Promise<GroupMember[]> => {
  try {
    if (!userId) {
      console.error("Cannot fetch group members: User ID is missing");
      return [];
    }

    console.log("🔍 Fetching group members for user:", userId);

    // Step 1: Get group IDs the user is part of
    const { data: userGroups, error: groupError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (groupError) {
      console.error("❌ Error fetching user groups:", groupError);
      return [];
    }

    if (!userGroups || userGroups.length === 0) {
      console.log("ℹ️ User doesn't belong to any groups");
      return [];
    }

    const groupIds = userGroups.map(g => g.group_id);
    console.log("✅ User is in groups:", groupIds);

    // Step 2: Get all members of those groups with profile info
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
      console.error("❌ Error fetching group members:", membersError);
      return [];
    }

    // Step 3: Get workout completions for these users
    const memberIds = groupMembers.map(m => m.user_id);
    const { data: workoutCompletions, error: completionsError } = await supabase
      .from('workout_completions')
      .select('id, user_id, workout_id, completed_at')
      .in('user_id', memberIds)
      .not('completed_at', 'is', null)
      .returns<WorkoutCompletion[]>();

    if (completionsError) {
      console.error("❌ Error fetching workout completions:", completionsError);
      return [];
    }

    // Step 4: Assemble final result
    const mappedMembers: GroupMember[] = groupMembers.map(member => {
      const profile = member.client_profiles || {};
      const completedWorkoutIds = workoutCompletions
        .filter(wc => wc.user_id === member.user_id)
        .map(wc => wc.workout_id);

      const firstName = profile.first_name?.trim() ?? '';
      const lastName = profile.last_name?.trim() ?? '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown User';

      return {
        id: member.user_id,
        name: fullName,
        profile_picture_url: profile.avatar_url ?? null,
        completed_workout_ids: completedWorkoutIds
      };
    });

    console.log("✅ Final mapped members:", mappedMembers);
    return mappedMembers;
  } catch (error) {
    console.error("❌ Unexpected error in fetchGroupMembers:", error);
    return [];
  }
};

