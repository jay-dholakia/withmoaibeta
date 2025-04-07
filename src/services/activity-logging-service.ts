
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

// Generic function to log activities through edge function
const logActivity = async (type: 'run' | 'cardio' | 'rest', data: any): Promise<string | null> => {
  try {
    const { data: responseData, error } = await supabase.functions.invoke('log_activity', {
      method: 'POST',
      body: { 
        activity_type: type, 
        activity_data: {
          ...data,
          date: data.log_date.toISOString()
        }
      },
    });
    
    if (error) {
      console.error(`Error logging ${type} activity:`, error);
      throw error;
    }
    
    return responseData?.id || null;
  } catch (error) {
    console.error(`Error in log${type.charAt(0).toUpperCase() + type.slice(1)}Activity:`, error);
    throw error;
  }
}

// Generic function to log a run activity
export const logRunActivity = async (runData: RunLog): Promise<string | null> => {
  try {
    const result = await logActivity('run', runData);
    toast.success("Run activity logged successfully!");
    return result;
  } catch (error) {
    toast.error("Failed to log run activity");
    return null;
  }
};

// Function to log a cardio activity
export const logCardioActivity = async (cardioData: CardioLog): Promise<string | null> => {
  try {
    const result = await logActivity('cardio', cardioData);
    toast.success("Cardio activity logged successfully!");
    return result;
  } catch (error) {
    toast.error("Failed to log cardio activity");
    return null;
  }
};

// Function to log a rest day
export const logRestDay = async (restData: RestLog): Promise<string | null> => {
  try {
    const result = await logActivity('rest', restData);
    toast.success("Rest day logged successfully!");
    return result;
  } catch (error) {
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
    })) as RunLog[];
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
    })) as CardioLog[];
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
    })) as RestLog[];
  } catch (error) {
    console.error("Error in getClientRestDays:", error);
    return [];
  }
};
