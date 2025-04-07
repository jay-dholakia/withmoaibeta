
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export interface RunLog {
  id?: string;
  client_id?: string;
  program_week_id?: string | null;
  log_date: Date;
  notes?: string;
  distance: number;
  duration: number;
  location?: string;
}

export interface CardioLog {
  id?: string;
  client_id?: string;
  program_week_id?: string | null;
  log_date: Date;
  notes?: string;
  activity_type: string;
  duration: number;
}

export interface RestLog {
  id?: string;
  client_id?: string;
  program_week_id?: string | null;
  log_date: Date;
  notes?: string;
}

// Generic function to log a run activity
export const logRunActivity = async (runData: RunLog): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Format the data for insertion
    const runLogData = {
      ...runData,
      client_id: user.id,
      log_date: runData.log_date.toISOString()
    };
    
    const { data, error } = await supabase
      .from('run_logs')
      .insert(runLogData)
      .select('id')
      .single();
    
    if (error) {
      console.error("Error logging run activity:", error);
      throw error;
    }
    
    toast.success("Run activity logged successfully!");
    return data.id;
  } catch (error) {
    console.error("Error in logRunActivity:", error);
    toast.error("Failed to log run activity");
    return null;
  }
};

// Function to log a cardio activity
export const logCardioActivity = async (cardioData: CardioLog): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Format the data for insertion
    const cardioLogData = {
      ...cardioData,
      client_id: user.id,
      log_date: cardioData.log_date.toISOString()
    };
    
    const { data, error } = await supabase
      .from('cardio_logs')
      .insert(cardioLogData)
      .select('id')
      .single();
    
    if (error) {
      console.error("Error logging cardio activity:", error);
      throw error;
    }
    
    toast.success("Cardio activity logged successfully!");
    return data.id;
  } catch (error) {
    console.error("Error in logCardioActivity:", error);
    toast.error("Failed to log cardio activity");
    return null;
  }
};

// Function to log a rest day
export const logRestDay = async (restData: RestLog): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Format the data for insertion
    const restLogData = {
      ...restData,
      client_id: user.id,
      log_date: restData.log_date.toISOString()
    };
    
    const { data, error } = await supabase
      .from('rest_logs')
      .insert(restLogData)
      .select('id')
      .single();
    
    if (error) {
      console.error("Error logging rest day:", error);
      throw error;
    }
    
    toast.success("Rest day logged successfully!");
    return data.id;
  } catch (error) {
    console.error("Error in logRestDay:", error);
    toast.error("Failed to log rest day");
    return null;
  }
};

// Function to get client's run activities for a date range
export const getClientRunActivities = async (startDate: Date, endDate: Date): Promise<RunLog[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .from('run_logs')
      .select('*')
      .eq('client_id', user.id)
      .gte('log_date', startDate.toISOString())
      .lte('log_date', endDate.toISOString())
      .order('log_date', { ascending: false });
    
    if (error) {
      console.error("Error fetching run activities:", error);
      throw error;
    }
    
    // Transform the data to match the interface
    return data.map(item => ({
      ...item,
      log_date: new Date(item.log_date)
    }));
  } catch (error) {
    console.error("Error in getClientRunActivities:", error);
    return [];
  }
};

// Function to get client's cardio activities for a date range
export const getClientCardioActivities = async (startDate: Date, endDate: Date): Promise<CardioLog[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .from('cardio_logs')
      .select('*')
      .eq('client_id', user.id)
      .gte('log_date', startDate.toISOString())
      .lte('log_date', endDate.toISOString())
      .order('log_date', { ascending: false });
    
    if (error) {
      console.error("Error fetching cardio activities:", error);
      throw error;
    }
    
    // Transform the data to match the interface
    return data.map(item => ({
      ...item,
      log_date: new Date(item.log_date)
    }));
  } catch (error) {
    console.error("Error in getClientCardioActivities:", error);
    return [];
  }
};

// Function to get client's rest days for a date range
export const getClientRestDays = async (startDate: Date, endDate: Date): Promise<RestLog[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const { data, error } = await supabase
      .from('rest_logs')
      .select('*')
      .eq('client_id', user.id)
      .gte('log_date', startDate.toISOString())
      .lte('log_date', endDate.toISOString())
      .order('log_date', { ascending: false });
    
    if (error) {
      console.error("Error fetching rest days:", error);
      throw error;
    }
    
    // Transform the data to match the interface
    return data.map(item => ({
      ...item,
      log_date: new Date(item.log_date)
    }));
  } catch (error) {
    console.error("Error in getClientRestDays:", error);
    return [];
  }
};
