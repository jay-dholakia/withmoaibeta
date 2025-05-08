
import { supabase } from "@/integrations/supabase/client";
import { Activity, FetchActivitiesOptions } from "./types";
import { QueryFunctionContext } from "@tanstack/react-query";

/**
 * Fetch recent activity posts for the activity feed
 */
export const fetchRecentActivities = async (
  context?: QueryFunctionContext<string[]>
): Promise<Activity[]> => {
  // Default options
  const options: FetchActivitiesOptions = {
    limit: 10,
    offset: 0,
    retryCount: 0
  };

  try {
    // Extract options from context if provided
    if (context?.meta) {
      const meta = context.meta as Record<string, any>;
      if (meta.limit) options.limit = meta.limit;
      if (meta.offset) options.offset = meta.offset;
      if (meta.retryCount) options.retryCount = meta.retryCount;
    }

    // Fetch completed workouts that should show in the activity feed
    let query = supabase
      .from('workout_completions')
      .select(`
        id,
        user_id,
        workout_id,
        completed_at,
        notes,
        rating,
        rest_day,
        life_happens_pass,
        title,
        description,
        workout_type,
        duration,
        distance,
        profiles:user_id (
          id,
          first_name,
          last_name,
          avatar_url
        ),
        workout:workout_id (
          title,
          description
        ),
        likes:activity_likes (*)
      `)
      .order('completed_at', { ascending: false })
      .range(options.offset || 0, (options.offset || 0) + (options.limit || 10) - 1);
    
    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }

    // Process the data to make it easier to work with
    const activities = data.map((activity: any) => {
      // Format the likes array
      const formattedLikes = Array.isArray(activity.likes) ? activity.likes : [];
      
      return {
        ...activity,
        likes: formattedLikes
      };
    });

    return activities;
  } catch (error) {
    console.error('Error in fetchRecentActivities:', error);
    
    // If retry count is specified and not exceeded, retry the fetch
    if (options.retryCount && options.retryCount > 0) {
      console.log(`Retrying... (${options.retryCount} attempts remaining)`);
      return fetchRecentActivities({
        meta: {
          limit: options.limit,
          offset: options.offset,
          retryCount: options.retryCount - 1
        }
      } as any);
    }
    
    throw error;
  }
};
