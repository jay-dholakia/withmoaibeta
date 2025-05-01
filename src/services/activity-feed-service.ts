
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
      .select('*')
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

    // Extract user IDs for batch queries
    const userIds = activities.map(activity => activity.user_id);
    console.log(`Found ${activities.length} activities for ${userIds.length} users`);
    
    // Fetch client profiles directly
    const { data: profiles, error: profilesError } = await supabase
      .from('client_profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', userIds);
    
    if (profilesError) {
      console.error('Error fetching client profiles:', profilesError);
      // Continue even if profiles have an error - we'll just have missing profile data
    }

    // Create a map of user profiles for easy lookup
    const profileMap = profiles ? 
      profiles.reduce((map: Record<string, any>, profile: any) => {
        map[profile.id] = profile;
        return map;
      }, {}) : {};
    
    console.log(`Found ${profiles?.length || 0} profiles`);

    // Fetch likes in batch
    const activityIds = activities.map(a => a.id);
    
    const { data: allLikes, error: likesError } = await supabase
      .from('activity_likes')
      .select('id, user_id, activity_id, created_at')
      .in('activity_id', activityIds);
    
    if (likesError) {
      console.error('Error fetching likes:', likesError);
      // Continue even if likes have an error
    }
    
    console.log(`Found ${allLikes?.length || 0} likes`);

    // Combine all data
    const enrichedActivities = activities.map(activity => {
      // Add profile data
      const profile = profileMap[activity.user_id] || null;
      
      // Add likes
      const likes = allLikes ? 
        allLikes.filter(like => like.activity_id === activity.id) : [];
      
      return {
        ...activity,
        profiles: profile,
        likes
      };
    });

    console.log(`Returning ${enrichedActivities.length} enriched activities`);
    return enrichedActivities;
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
