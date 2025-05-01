
import { supabase } from "@/integrations/supabase/client";

interface FetchActivitiesOptions {
  limit?: number;
  offset?: number;
  retryCount?: number;
}

export const fetchRecentActivities = async ({ 
  limit = 20, 
  offset = 0,
  retryCount = 0
}: FetchActivitiesOptions = {}) => {
  try {
    console.log("Fetching activities with limit:", limit, "offset:", offset);
    
    // Query workout completions that are not rest days or life happens passes
    const { data: activities, error } = await supabase
      .from('workout_completions')
      .select(`
        *,
        profiles:user_id (
          id, first_name, last_name, avatar_url
        ),
        workout:workout_id (
          id, title, description, workout_type
        ),
        likes:activity_likes (
          id, user_id, activity_id, created_at
        )
      `)
      .is('rest_day', false)
      .is('life_happens_pass', false)
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching activity feed:', error);
      throw error;
    }

    // If no activities, return empty array
    if (!activities || activities.length === 0) {
      console.log("No activities found");
      return [];
    }

    console.log(`Returning ${activities.length} enriched activities`);
    return activities;
  } catch (error) {
    console.error('Error in fetchRecentActivities:', error);
    
    // Implement retry logic with exponential backoff for transient errors
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
      console.log(`Retrying after ${delay}ms (attempt ${retryCount + 1}/3)`);
      
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(fetchRecentActivities({ 
            limit, 
            offset, 
            retryCount: retryCount + 1 
          }));
        }, delay);
      });
    }
    
    throw error;
  }
};

export const likeActivity = async (activityId: string) => {
  try {
    // Get current user ID from auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('activity_likes')
      .insert({
        activity_id: activityId,
        user_id: user.id
      })
      .select('id');

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violated, user already liked this activity
        console.log('User already liked this activity');
        return null;
      }
      console.error('Error liking activity:', error);
      throw error;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in likeActivity:', error);
    throw error;
  }
};

export const unlikeActivity = async (activityId: string) => {
  try {
    // Get current user ID from auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('activity_likes')
      .delete()
      .match({ 
        activity_id: activityId,
        user_id: user.id
      });

    if (error) {
      console.error('Error unliking activity:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in unlikeActivity:', error);
    return false;
  }
};
