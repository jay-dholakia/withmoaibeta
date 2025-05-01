
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
    // Using explicit join syntax instead of nested select to avoid foreign key issues
    const { data: activities, error } = await supabase
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
        distance
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

    // Fetch profiles and workouts separately with the collected IDs
    const userIds = activities.map(activity => activity.user_id);
    const workoutIds = activities.filter(a => a.workout_id).map(a => a.workout_id);
    
    // Get profiles data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, avatar_url
      `)
      .in('id', userIds);
      
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }
    
    // Get workouts data if there are any workout IDs
    let workouts = [];
    if (workoutIds.length > 0) {
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select(`
          id, title, description, workout_type
        `)
        .in('id', workoutIds);
        
      if (workoutsError) {
        console.error('Error fetching workouts:', workoutsError);
      } else {
        workouts = workoutsData || [];
      }
    }
    
    // Get likes for all activities
    const activityIds = activities.map(activity => activity.id);
    const { data: likes, error: likesError } = await supabase
      .from('activity_likes')
      .select(`
        id, user_id, activity_id, created_at
      `)
      .in('activity_id', activityIds);
      
    if (likesError) {
      console.error('Error fetching likes:', likesError);
    }
    
    // Map profiles and workouts to activities
    const profilesMap = (profiles || []).reduce((map, profile) => {
      map[profile.id] = profile;
      return map;
    }, {});
    
    const workoutsMap = workouts.reduce((map, workout) => {
      map[workout.id] = workout;
      return map;
    }, {});
    
    const likesMap = (likes || []).reduce((map, like) => {
      if (!map[like.activity_id]) {
        map[like.activity_id] = [];
      }
      map[like.activity_id].push(like);
      return map;
    }, {});
    
    // Enrich activities with related data
    const enrichedActivities = activities.map(activity => {
      return {
        ...activity,
        profiles: profilesMap[activity.user_id] || null,
        workout: activity.workout_id ? workoutsMap[activity.workout_id] || null : null,
        likes: likesMap[activity.id] || []
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
