
import { supabase } from "@/integrations/supabase/client";
import { QueryFunctionContext } from "@tanstack/react-query";
import { Activity, FetchActivitiesOptions } from "./types";

/**
 * Fetches recent activities from the workout_completions table
 */
export const fetchRecentActivities = async (
  context?: QueryFunctionContext
): Promise<Activity[]> => {
  try {
    // Default values
    let limit = 20;
    let offset = 0;
    let retryCount = 0;

    // Extract any options if they were passed
    if (context && 'meta' in context && context.meta) {
      const options = context.meta as FetchActivitiesOptions;
      if (options.limit) limit = options.limit;
      if (options.offset) offset = options.offset;
      if (options.retryCount) retryCount = options.retryCount;
    }

    console.log("Fetching activities with limit:", limit, "offset:", offset);
    
    // Query workout completions that are not rest days or life happens passes
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
    
    // Get client_profiles data
    const { data: profiles, error: profilesError } = await supabase
      .from('client_profiles')
      .select(`
        id, first_name, last_name, avatar_url
      `)
      .in('id', userIds);
      
    if (profilesError) {
      console.error('Error fetching client profiles:', profilesError);
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
            meta: { 
              limit, 
              offset, 
              retryCount: retryCount + 1 
            } 
          } as QueryFunctionContext));
        }, delay);
      });
    }
    
    throw error;
  }
};
