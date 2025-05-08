import { supabase } from "@/integrations/supabase/client";

/**
 * Client Profile type definition
 */
export interface ClientProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  weight?: string;
  height?: string;
  birthday?: string | null;
  city?: string;
  state?: string;
  fitness_goals?: string[];
  favorite_movements?: string[];
  program_type?: string;
  event_type?: string;
  event_name?: string;
  event_date?: string | null;
  avatar_url?: string;
  profile_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const saveWorkoutJournalNotes = async (
  workoutCompletionId: string,
  notes: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_completions')
      .update({ notes })
      .eq('id', workoutCompletionId);

    if (error) {
      console.error('Error saving workout journal notes:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveWorkoutJournalNotes:', error);
    return false;
  }
};

export const fetchClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching client profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchClientProfile:', error);
    return null;
  }
};

export const createClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    const { data: existingProfile } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) return existingProfile;

    const { data, error } = await supabase
      .from('client_profiles')
      .insert([{ id: userId }])
      .select()
      .single();

    if (error) {
      console.error('Error creating client profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createClientProfile:', error);
    return null;
  }
};

export const updateClientProfile = async (
  userId: string,
  profileData: Partial<ClientProfile>
): Promise<ClientProfile | null> => {
  try {
    const processedData: Partial<ClientProfile> = { ...profileData };

    if (profileData.birthday !== undefined) {
      const birthday = profileData.birthday;
      processedData.birthday =
        birthday === null ? null :
        typeof birthday === 'object' && 'toISOString' in birthday ? (birthday as Date).toISOString() :
        birthday;
    }

    if (profileData.event_date !== undefined) {
      const eventDate = profileData.event_date;
      processedData.event_date =
        eventDate === null ? null :
        typeof eventDate === 'object' && 'toISOString' in eventDate ? (eventDate as Date).toISOString() :
        eventDate;
    }

    const { data, error } = await supabase
      .from('client_profiles')
      .update(processedData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateClientProfile:', error);
    return null;
  }
};

export const fetchAllClientProfiles = async (): Promise<ClientProfile[]> => {
  try {
    const { data, error } = await supabase.from('client_profiles').select('*');
    if (error) {
      console.error('Error fetching all client profiles:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error in fetchAllClientProfiles:', error);
    return [];
  }
};

export const uploadClientAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-avatar.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('user-content')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('user-content').getPublicUrl(filePath);
    await updateClientProfile(userId, { avatar_url: data.publicUrl });
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadClientAvatar:', error);
    return null;
  }
};

export const fetchPersonalRecords = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select('*, exercise:exercise_id(*)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching personal records:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchPersonalRecords:', error);
    return [];
  }
};

export const trackWorkoutSet = async (
  workoutId: string,
  exerciseId: string,
  setData: any
) => {
  try {
    const data = {
      ...setData,
      workout_exercise_id: exerciseId,
      user_id: (await supabase.auth.getUser()).data.user?.id
    };

    const { data: result, error } = await supabase
      .from('workout_set_completions')
      .insert([data])
      .select();

    if (error) {
      console.error('Error tracking workout set:', error);
      return null;
    }

    return result?.[0] || null;
  } catch (error) {
    console.error('Error in trackWorkoutSet:', error);
    return null;
  }
};

export const completeWorkout = async (workoutData: any) => {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .insert([workoutData])
      .select();

    if (error) {
      console.error('Error completing workout:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in completeWorkout:', error);
    return null;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: userId }
    });

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    return false;
  }
};

export interface GroupLeaderboardItem {
  id: string;
  name: string;
  description?: string;
  totalFireBadges: number;
  activeMembersCount: number;
  iconOrEmoji?: string;
}

export const fetchGroupLeaderboard = async (): Promise<GroupLeaderboardItem[]> => {
  try {
    // Get all groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, description');

    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      return [];
    }

    // For each group, get total fire badges and member count
    const leaderboardItems: GroupLeaderboardItem[] = [];

    for (const group of groups) {
      // Get all members of the group
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', group.id);

      if (membersError) {
        console.error(`Error fetching members for group ${group.id}:`, membersError);
        continue;
      }

      const memberIds = members.map(member => member.user_id);
      
      // Skip groups with no members
      if (memberIds.length === 0) {
        continue;
      }

      // Count total fire badges for all members
      const { count: totalFireBadges, error: badgesError } = await supabase
        .from('fire_badges')
        .select('id', { count: 'exact', head: false })
        .in('user_id', memberIds);

      if (badgesError) {
        console.error(`Error fetching fire badges for group ${group.id}:`, badgesError);
        continue;
      }

      leaderboardItems.push({
        id: group.id,
        name: group.name,
        description: group.description,
        totalFireBadges: totalFireBadges || 0,
        activeMembersCount: memberIds.length,
      });
    }

    // Sort by total fire badges in descending order
    return leaderboardItems.sort((a, b) => b.totalFireBadges - a.totalFireBadges);
  } catch (error) {
    console.error('Error in fetchGroupLeaderboard:', error);
    return [];
  }
};
