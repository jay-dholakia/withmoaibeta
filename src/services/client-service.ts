import { supabase } from "@/integrations/supabase/client";

// Client Profile Types
export interface ClientProfile {
  id?: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  state: string | null;
  birthday: string | null;
  height: string | null;
  weight: string | null;
  avatar_url: string | null;
  fitness_goals: string[];
  favorite_movements: string[];
  profile_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

// Coach Profile Types - Updated to match the actual database schema
export interface CoachProfile {
  id?: string;
  bio: string | null;
  avatar_url: string | null;
  favorite_movements: string[] | null;
  created_at?: string;
  updated_at?: string;
}

// Client Data Types for Coach Views
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

// Group Types
export interface GroupData {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  member_count: number;
}

// Leaderboard Entry Type
export interface LeaderboardEntry {
  user_id: string;
  email: string;
  total_workouts: number;
}

// Current Program Fetching Function
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
    
    const { data: programData, error: programError } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', currentAssignment.program_id)
      .single();
      
    if (programError) {
      console.error('Error fetching program details:', programError);
      throw programError;
    }
    
    console.log("Program data fetched:", programData);
    
    if (!programData) {
      console.log("No program details found for assignment", currentAssignment.id);
      return null;
    }
    
    const { data: weeksData, error: weeksError } = await supabase
      .from('workout_weeks')
      .select('*')
      .eq('program_id', programData.id)
      .order('week_number', { ascending: true });
      
    if (weeksError) {
      console.error('Error fetching program weeks:', weeksError);
      throw weeksError;
    }
    
    console.log("Program weeks fetched:", weeksData?.length || 0);
    
    const weeksWithWorkouts = [];
    
    for (const week of weeksData || []) {
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            exercise:exercise_id (*)
          )
        `)
        .eq('week_id', week.id)
        .order('day_of_week', { ascending: true });
        
      if (workoutsError) {
        console.error(`Error fetching workouts for week ${week.week_number}:`, workoutsError);
        continue;
      }
      
      console.log(`Week ${week.week_number} workouts:`, workoutsData?.length || 0);
      
      weeksWithWorkouts.push({
        ...week,
        workouts: workoutsData || []
      });
    }
    
    const fullProgramData = {
      ...currentAssignment,
      program: {
        ...programData,
        weeks: weeksWithWorkouts
      }
    };
    
    console.log("Full program data constructed:", 
      fullProgramData.program.title, 
      "with", fullProgramData.program.weeks.length, "weeks"
    );
    
    // Since client_workout_info is a view and not directly updatable, we shouldn't try to insert/update it directly
    // Instead, we can query it to check if we need to update any other tables that affect it
    try {
      const { data: clientInfo, error: clientInfoError } = await supabase
        .from('client_workout_info')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (clientInfoError) {
        console.error('Error checking client workout info:', clientInfoError);
      } else {
        console.log("Current client workout info:", clientInfo);
        // We would update the underlying tables here if needed
        // But for now, we won't try to update any tables directly
      }
    } catch (err) {
      console.error('Error querying client workout info:', err);
    }
    
    return fullProgramData;
  } catch (err) {
    console.error("Error in fetchCurrentProgram:", err);
    throw err;
  }
};

// Client Profile Functions
export const fetchClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data as ClientProfile;
  } catch (error) {
    console.error("Error fetching client profile:", error);
    return null;
  }
};

export const updateClientProfile = async (userId: string, profileData: Partial<ClientProfile>): Promise<ClientProfile> => {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data as ClientProfile;
  } catch (error) {
    console.error("Error updating client profile:", error);
    throw error;
  }
};

export const uploadClientAvatar = async (userId: string, file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('client-avatars')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('client-avatars')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
};

// Coach Profile Functions - Updated to match the database schema
export const fetchCoachProfile = async (coachId: string): Promise<CoachProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('coach_profiles')
      .select('*')
      .eq('id', coachId)
      .single();
    
    if (error) throw error;
    return data as CoachProfile;
  } catch (error) {
    console.error("Error fetching coach profile:", error);
    return null;
  }
};

export const updateCoachProfile = async (coachId: string, profileData: Partial<CoachProfile>): Promise<CoachProfile> => {
  try {
    const { data, error } = await supabase
      .from('coach_profiles')
      .update(profileData)
      .eq('id', coachId)
      .select()
      .single();
    
    if (error) throw error;
    return data as CoachProfile;
  } catch (error) {
    console.error("Error updating coach profile:", error);
    throw error;
  }
};

export const uploadCoachAvatar = async (coachId: string, file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${coachId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('coach-avatars')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from('coach-avatars')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
};

// Coach Client Functions
export const fetchCoachClients = async (coachId: string): Promise<ClientData[]> => {
  try {
    const { data, error } = await supabase.rpc('get_coach_clients', { coach_id: coachId });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching coach clients:", error);
    return [];
  }
};

export const fetchAllClientProfiles = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'client');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching client profiles:", error);
    return [];
  }
};

// Group Functions
export const fetchCoachGroups = async (coachId: string): Promise<GroupData[]> => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_coaches!inner (coach_id),
        group_members (user_id)
      `)
      .eq('group_coaches.coach_id', coachId);
    
    if (error) throw error;
    
    // Transform the data to include member count
    return data.map(group => ({
      ...group,
      member_count: Array.isArray(group.group_members) ? group.group_members.length : 0
    }));
  } catch (error) {
    console.error("Error fetching coach groups:", error);
    return [];
  }
};

export const fetchAllGroups = async (): Promise<GroupData[]> => {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members (user_id)
      `);
    
    if (error) throw error;
    
    return data.map(group => ({
      ...group,
      member_count: Array.isArray(group.group_members) ? group.group_members.length : 0
    }));
  } catch (error) {
    console.error("Error fetching all groups:", error);
    return [];
  }
};

// Workout Functions
export const startWorkout = async (userId: string, workoutId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .insert({
        user_id: userId,
        workout_id: workoutId,
        started_at: new Date().toISOString(),
        status: 'in_progress'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error("Error starting workout:", error);
    throw error;
  }
};

export const trackWorkoutSet = async (
  workoutCompletionId: string,
  exerciseId: string,
  userId: string,
  setNumber: number,
  weight: number | null,
  reps: number | null
): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_set_completions')
      .upsert({
        workout_completion_id: workoutCompletionId,
        workout_exercise_id: exerciseId,
        user_id: userId,
        set_number: setNumber,
        weight: weight,
        reps_completed: reps,
        completed: true
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error tracking workout set:", error);
    throw error;
  }
};

export const completeWorkout = async (
  workoutCompletionId: string,
  rating: number | null,
  notes: string
): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .update({
        completed_at: new Date().toISOString(),
        status: 'completed',
        rating: rating,
        notes: notes
      })
      .eq('id', workoutCompletionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error completing workout:", error);
    throw error;
  }
};

export const fetchOngoingWorkout = async (userId: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('workout_completions')
      .select(`
        *,
        workout:workout_id (
          *,
          workout_exercises (
            *,
            exercise:exercise_id (*)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .maybeSingle();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching ongoing workout:", error);
    return null;
  }
};

export const fetchPersonalRecords = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('personal_records')
      .select(`
        *,
        exercise:exercise_id (*)
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching personal records:", error);
    return [];
  }
};

export const fetchClientWorkoutHistory = async (clientId: string): Promise<any[]> => {
  try {
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
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching client workout history:", error);
    return [];
  }
};

export const fetchClientPrograms = async (clientId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select(`
        *,
        program:program_id (*)
      `)
      .eq('user_id', clientId)
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching client programs:", error);
    return [];
  }
};

// Leaderboard Functions
export const fetchGroupLeaderboardWeekly = async (groupId: string): Promise<LeaderboardEntry[]> => {
  try {
    // Get the start of the current week (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
    const startOfWeek = new Date(today.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase.rpc(
      'get_group_weekly_leaderboard', 
      { 
        group_id: groupId,
        start_date: startOfWeek.toISOString()
      }
    );
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching weekly leaderboard:", error);
    return [];
  }
};

export const fetchGroupLeaderboardMonthly = async (groupId: string): Promise<LeaderboardEntry[]> => {
  try {
    // Get the start of the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase.rpc(
      'get_group_monthly_leaderboard', 
      { 
        group_id: groupId,
        start_date: startOfMonth.toISOString()
      }
    );
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching monthly leaderboard:", error);
    return [];
  }
};
