import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClientData {
  id: string;
  email: string;
  user_type: string;
  last_workout_at: string | null;
  total_workouts_completed: number;
  current_program_id: string | null;
  current_program_title: string | null;
  days_since_last_workout: number | null;
  group_ids: string[];
}

export interface GroupData {
  id: string;
  name: string;
  description: string | null;
}

export interface CoachProfile {
  id: string;
  bio: string | null;
  avatar_url: string | null;
  favorite_movements: string[] | null;
}

export interface ClientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  state: string | null;
  birthday: string | null;
  height: string | null;
  weight: string | null;
  avatar_url: string | null;
  fitness_goals: string[] | null;
  favorite_movements: string[] | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSetCompletion {
  id: string;
  workout_completion_id: string;
  workout_exercise_id: string;
  set_number: number;
  weight: number | null;
  reps_completed: number | null;
  completed: boolean;
  created_at: string;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  achieved_at: string;
  workout_completion_id: string | null;
  exercise?: {
    name: string;
    category: string;
  };
}

export const fetchCoachClients = async (coachId: string): Promise<ClientData[]> => {
  const { data, error } = await supabase
    .rpc('get_coach_clients', { coach_id: coachId });

  if (error) {
    console.error('Error fetching coach clients:', error);
    throw error;
  }

  return data || [];
};

export const fetchCoachGroups = async (coachId: string): Promise<GroupData[]> => {
  const { data: groupCoaches, error: groupCoachesError } = await supabase
    .from('group_coaches')
    .select('group_id')
    .eq('coach_id', coachId);
    
  if (groupCoachesError) throw groupCoachesError;
  
  if (groupCoaches.length === 0) return [];
  
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupCoaches.map(gc => gc.group_id));
    
  if (groupsError) throw groupsError;
  
  return groups || [];
};

export const fetchClientWorkoutHistory = async (clientId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('workout_completions')
    .select(`
      *,
      workout:workout_id (
        *,
        week:week_id (
          *,
          program:program_id (*)
        )
      )
    `)
    .eq('user_id', clientId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching client workout history:', error);
    throw error;
  }

  return data || [];
};

export const fetchClientPrograms = async (clientId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('program_assignments')
    .select(`
      *,
      program:program_id (*)
    `)
    .eq('user_id', clientId)
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching client programs:', error);
    throw error;
  }

  return data || [];
};

export const fetchCoachProfile = async (coachId: string): Promise<CoachProfile | null> => {
  const { data, error } = await supabase
    .from('coach_profiles')
    .select('id, bio, avatar_url, favorite_movements')
    .eq('id', coachId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching coach profile:', error);
    throw error;
  }

  return data as CoachProfile | null;
};

export const updateCoachProfile = async (coachId: string, profile: Partial<CoachProfile>): Promise<CoachProfile> => {
  const { data, error } = await supabase
    .from('coach_profiles')
    .upsert({ 
      id: coachId, 
      bio: profile.bio, 
      avatar_url: profile.avatar_url,
      favorite_movements: profile.favorite_movements,
      updated_at: new Date().toISOString()
    })
    .select('id, bio, avatar_url, favorite_movements')
    .single();

  if (error) {
    console.error('Error updating coach profile:', error);
    throw error;
  }

  return data as CoachProfile;
};

export const uploadCoachAvatar = async (coachId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${coachId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${coachId}/${fileName}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const fetchAllGroups = async (): Promise<GroupData[]> => {
  const { data: groups, error } = await supabase
    .from('groups')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching all groups:', error);
    throw error;
  }
  
  return groups || [];
};

export interface LeaderboardEntry {
  user_id: string;
  email: string;
  total_workouts: number;
}

export const fetchGroupLeaderboardWeekly = async (groupId: string): Promise<LeaderboardEntry[]> => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .rpc('get_group_weekly_leaderboard', {
      group_id: groupId,
      start_date: startOfWeek.toISOString()
    });

  if (error) {
    console.error('Error fetching weekly leaderboard:', error);
    throw error;
  }

  return data as LeaderboardEntry[] || [];
};

export const fetchGroupLeaderboardMonthly = async (groupId: string): Promise<LeaderboardEntry[]> => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .rpc('get_group_monthly_leaderboard', {
      group_id: groupId,
      start_date: startOfMonth.toISOString()
    });

  if (error) {
    console.error('Error fetching monthly leaderboard:', error);
    throw error;
  }

  return data as LeaderboardEntry[] || [];
};

export const fetchClientProfile = async (clientId: string): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', clientId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching client profile:', error);
      throw error;
    }

    if (!data) {
      const initialProfile = {
        id: clientId,
        first_name: null,
        last_name: null,
        city: null,
        state: null,
        birthday: null,
        height: null,
        weight: null,
        avatar_url: null,
        fitness_goals: [],
        favorite_movements: [],
        profile_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return initialProfile;
    }

    return data as ClientProfile;
  } catch (error) {
    console.error('Error in fetchClientProfile:', error);
    return {
      id: clientId,
      first_name: null,
      last_name: null,
      city: null,
      state: null,
      birthday: null,
      height: null,
      weight: null,
      avatar_url: null,
      fitness_goals: [],
      favorite_movements: [],
      profile_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};

export const updateClientProfile = async (clientId: string, profile: Partial<ClientProfile>): Promise<ClientProfile> => {
  try {
    const existingProfile = await fetchClientProfile(clientId);
    
    if (!existingProfile) {
      throw new Error('Could not find or create client profile');
    }
    
    const updatedProfile = {
      ...existingProfile,
      ...profile,
      updated_at: new Date().toISOString()
    };
    
    console.log('Updating profile with merged data:', updatedProfile);
    
    const { data, error } = await supabase
      .from('client_profiles')
      .upsert(updatedProfile)
      .select()
      .single();

    if (error) {
      console.error('Error updating client profile:', error);
      throw error;
    }

    return data as ClientProfile;
  } catch (error) {
    console.error('Error in updateClientProfile:', error);
    try {
      const updatedProfile = {
        id: clientId,
        ...profile,
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        city: profile.city || null,
        state: profile.state || null,
        birthday: profile.birthday || null,
        height: profile.height || null,
        weight: profile.weight || null,
        avatar_url: profile.avatar_url || null,
        fitness_goals: profile.fitness_goals || [],
        favorite_movements: profile.favorite_movements || [],
        profile_completed: profile.profile_completed || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return updatedProfile as ClientProfile;
    } catch (fallbackError) {
      console.error('Fallback error in updateClientProfile:', fallbackError);
      toast.error('Failed to update profile. Please try again.');
      throw fallbackError;
    }
  }
};

export const uploadClientAvatar = async (clientId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${clientId}/${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export const startWorkout = async (userId: string, workoutId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('workout_completions')
    .insert({
      user_id: userId,
      workout_id: workoutId,
      completed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error starting workout:', error);
    throw error;
  }

  return data.id;
};

export const fetchOngoingWorkout = async (userId: string): Promise<any | null> => {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { data: completions, error: completionsError } = await supabase
    .from('workout_completions')
    .select(`
      *,
      workout:workout_id (
        *,
        workout_exercises:workout_exercises (
          *,
          exercise:exercise_id (*)
        )
      ),
      workout_set_completions (*)
    `)
    .eq('user_id', userId)
    .gte('completed_at', oneDayAgo.toISOString())
    .order('completed_at', { ascending: false })
    .limit(5);

  if (completionsError) {
    console.error('Error fetching ongoing workout:', completionsError);
    throw completionsError;
  }

  if (!completions || !Array.isArray(completions) || completions.length === 0) {
    return null;
  }

  for (const completion of completions) {
    if (!completion.workout || !completion.workout.workout_exercises) {
      continue;
    }
    
    const exercises = Array.isArray(completion.workout.workout_exercises) 
      ? completion.workout.workout_exercises 
      : [];
      
    const totalSets = exercises.reduce((acc: number, ex: any) => acc + ex.sets, 0);
    
    const completedSets = Array.isArray(completion.workout_set_completions) 
      ? completion.workout_set_completions.filter((set: any) => set.completed).length 
      : 0;

    if (completedSets < totalSets) {
      return completion;
    }
  }

  return null;
};

export const trackWorkoutSet = async (
  workoutCompletionId: string,
  workoutExerciseId: string,
  userId: string,
  setNumber: number,
  weight: number | null,
  repsCompleted: number | null
): Promise<WorkoutSetCompletion> => {
  const { data: existingSets, error: existingSetsError } = await supabase
    .from('workout_set_completions')
    .select('*')
    .eq('workout_completion_id', workoutCompletionId)
    .eq('workout_exercise_id', workoutExerciseId)
    .eq('set_number', setNumber);

  if (existingSetsError) {
    console.error('Error checking for existing set:', existingSetsError);
    throw existingSetsError;
  }

  if (existingSets && existingSets.length > 0) {
    const { data, error } = await supabase
      .from('workout_set_completions')
      .update({
        weight,
        reps_completed: repsCompleted,
        completed: true
      })
      .eq('id', existingSets[0].id)
      .select()
      .single();

    if (error) {
      console.error('Error updating workout set:', error);
      throw error;
    }

    return data as WorkoutSetCompletion;
  } else {
    const { data, error } = await supabase
      .from('workout_set_completions')
      .insert({
        workout_completion_id: workoutCompletionId,
        workout_exercise_id: workoutExerciseId,
        set_number: setNumber,
        weight,
        reps_completed: repsCompleted,
        completed: true,
        user_id: userId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating workout set:', error);
      throw error;
    }

    return data as WorkoutSetCompletion;
  }
};

export const completeWorkout = async (
  workoutCompletionId: string,
  rating: number | null,
  notes: string | null
): Promise<void> => {
  const { error } = await supabase
    .from('workout_completions')
    .update({
      rating,
      notes,
      completed_at: new Date().toISOString()
    })
    .eq('id', workoutCompletionId);

  if (error) {
    console.error('Error completing workout:', error);
    throw error;
  }
};

export const fetchPersonalRecords = async (userId: string): Promise<PersonalRecord[]> => {
  const { data, error } = await supabase
    .from('personal_records')
    .select(`
      *,
      exercise:exercise_id (*)
    `)
    .eq('user_id', userId)
    .order('achieved_at', { ascending: false });

  if (error) {
    console.error('Error fetching personal records:', error);
    throw error;
  }

  return data as PersonalRecord[];
};

export const fetchCurrentProgram = async (userId: string): Promise<any | null> => {
  console.log("Fetching current program for user:", userId);
  
  if (!userId) {
    console.error("Cannot fetch current program: No user ID provided");
    return null;
  }
  
  const today = new Date();
  const todayISODate = today.toISOString().split('T')[0];
  console.log("Today's date for comparison:", todayISODate);
  
  try {
    const { data: assignments, error: assignmentError } = await supabase
      .from('program_assignments')
      .select('*')
      .eq('user_id', userId)
      .lte('start_date', todayISODate)
      .or(`end_date.is.null,end_date.gte.${todayISODate}`)
      .order('start_date', { ascending: false });
      
    if (assignmentError) {
      console.error('Error fetching program assignments:', assignmentError);
      throw assignmentError;
    }
    
    console.log("Program assignments found:", assignments?.length || 0, assignments);
    
    if (!assignments || assignments.length === 0) {
      console.log("No active program assignments found for user", userId);
      return null;
    }
    
    const currentAssignment = assignments[0];
    console.log("Using program assignment:", currentAssignment);
    
    const { data, error } = await supabase
      .from('program_assignments')
      .select(`
        *,
        program:program_id (
          *,
          weeks:workout_weeks (
            *,
            workouts (
              *,
              workout_exercises (
                *,
                exercise:exercise_id (*)
              )
            )
          )
        )
      `)
      .eq('id', currentAssignment.id)
      .single();

    if (error) {
      console.error('Error fetching current program details:', error);
      throw error;
    }

    console.log("Current program data fetched:", data ? "Success" : "No data");
    
    if (!data || !data.program) {
      console.log("No program details found for assignment", currentAssignment.id);
      return null;
    }
    
    if (data.program) {
      console.log("Program title:", data.program.title);
      console.log("Program ID:", data.program_id);
      
      const weeksArray = data.program.weeks && Array.isArray(data.program.weeks) 
        ? data.program.weeks 
        : [];
      
      console.log("Program weeks count:", weeksArray.length || 0);
      
      if (weeksArray.length > 0) {
        weeksArray.sort((a: any, b: any) => a.week_number - b.week_number);
        
        console.log("Weeks data available:", weeksArray.length, "weeks");
        
        try {
          console.log(`User ${userId} is currently on program ${data.program_id}`);
        } catch (err) {
          console.error('Error updating client program info:', err);
        }
        
        weeksArray.forEach((week: any) => {
          const workoutsArray = week.workouts && Array.isArray(week.workouts) 
            ? week.workouts 
            : [];
          const workoutsCount = workoutsArray.length || 0;
          
          console.log(`Week ${week.week_number}: ${workoutsCount} workouts`);
          
          if (workoutsCount > 0) {
            workoutsArray.forEach((workout: any) => {
              const exercisesArray = workout.workout_exercises && Array.isArray(workout.workout_exercises)
                ? workout.workout_exercises
                : [];
              console.log(`  Workout "${workout.title}": ${exercisesArray.length} exercises`);
            });
          }
        });
      } else {
        console.log("Weeks data is missing or not an array");
      }
    } else {
      console.log("Program data is missing");
    }

    return data;
  } catch (err) {
    console.error("Error in fetchCurrentProgram:", err);
    throw err;
  }
};

export const fetchGroupWeeklyProgress = async (groupId: string): Promise<any> => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select(`
      user_id,
      profiles!inner (
        *
      )
    `)
    .eq('group_id', groupId);

  if (membersError) {
    console.error('Error fetching group members:', membersError);
    throw membersError;
  }
  
  const memberProgress = [];
  
  for (const member of members) {
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', member.user_id)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user data:', userError);
      continue;
    }
    
    const { data: completions, error: completionsError } = await supabase
      .from('workout_completions')
      .select('*, workout:workout_id (*)')
      .eq('user_id', member.user_id)
      .gte('completed_at', startOfWeek.toISOString())
      .order('completed_at', { ascending: true });
      
    if (completionsError) {
      console.error('Error fetching completions:', completionsError);
      continue;
    }
    
    const assignedWorkouts = Array.isArray(completions) ? completions : [];
      
    const weekData = Array(7).fill(null);
    
    if (Array.isArray(completions)) {
      for (const completion of completions) {
        const date = new Date(completion.completed_at);
        const dayOfWeek = date.getDay();
        
        weekData[dayOfWeek] = {
          completed: true,
          workoutId: completion.workout_id,
          workoutTitle: completion.workout?.title || 'Workout',
          completionId: completion.id
        };
      }
    }
    
    let emailAddress = `user_${member.user_id.substring(0, 8)}`;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', member.user_id)
        .single();
        
      if (profile) {
        emailAddress = `user_${profile.id.substring(0, 8)}`;
      }
    } catch (error) {
      console.error('Error fetching user email:', error);
    }
    
    memberProgress.push({
      userId: member.user_id,
      email: emailAddress,
      weekData,
      totalAssigned: assignedWorkouts.length,
      totalCompleted: Array.isArray(completions) ? completions.length : 0
    });
  }
  
  return {
    members: memberProgress,
    startOfWeek: startOfWeek.toISOString()
  };
};

const getUserEmail = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user profile:', error);
      return `user_${userId.substring(0, 8)}`;
    }
    
    return `user_${userId.substring(0, 8)}`;
  } catch (error) {
    console.error('Error fetching user email:', error);
    return `user_${userId.substring(0, 8)}`;
  }
};

const ensureClientProfilesTable = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('Error checking client_profiles table existence:', error);
    return false;
  }
};

export const fetchAllClientProfiles = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'client');
      
    if (error) {
      console.error('Error fetching client profiles:', error);
      throw error;
    }
    
    console.log("Client profiles fetched:", data?.length || 0);
    
    try {
      const clientIds = data.map(profile => profile.id);
      
      if (clientIds.length === 0) {
        return data || [];
      }
      
      const { data: emailsData, error: emailsError } = await supabase.rpc(
        'get_users_email',
        { user_ids: clientIds }
      );
      
      if (emailsError) {
        throw emailsError;
      }
      
      if (emailsData && Array.isArray(emailsData)) {
        const clientsWithEmails = data.map(client => {
          const emailRecord = emailsData.find((e: any) => e.id === client.id);
          return {
            ...client,
            email: emailRecord?.email || `${client.id.split('-')[0]}@client.com`
          };
        });
        
        return clientsWithEmails;
      } else {
        console.error('Unexpected response format from get_users_email:', emailsData);
        throw new Error('Invalid response format from get_users_email');
      }
    } catch (emailError) {
      console.error('Error fetching real emails:', emailError);
      return data.map(client => ({
        ...client,
        email: `${client.id.split('-')[0]}@client.com`
      }));
    }
  } catch (error) {
    console.error('Error in fetchAllClientProfiles:', error);
    return [];
  }
};
