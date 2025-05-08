
import { supabase } from "@/integrations/supabase/client";
import { Activity, FetchActivitiesOptions } from "./types";
import { QueryFunctionContext } from "@tanstack/react-query";

/**
 * Fetch recent activity posts for the activity feed
 */
export const fetchRecentActivities = async (
  context?: QueryFunctionContext<string[]>
): Promise<Activity[]> => {
  // Define options outside try block to make them available in catch block
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

    console.log('Fetching activities with options:', options);

    // Fix: Instead of using a direct join between workout_completions and profiles,
    // fetch the user profiles separately after getting completions
    const { data: completions, error: completionsError } = await supabase
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
        workout:workout_id(title, description),
        likes:activity_likes(*)
      `)
      .order('completed_at', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);
    
    if (completionsError) {
      console.error('Error fetching workout completions:', completionsError);
      throw completionsError;
    }

    // If no completions, return empty array
    if (!completions || completions.length === 0) {
      console.log('No workout completions found');
      return [];
    }

    // Get unique user IDs from completions
    const userIds = [...new Set(completions.map(completion => completion.user_id))];
    
    // Fetch user profiles for these IDs
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_type
      `)
      .in('id', userIds);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }
    
    // Fetch client profiles for more user details
    const { data: clientProfiles, error: clientProfilesError } = await supabase
      .from('client_profiles')
      .select(`
        id,
        first_name,
        last_name,
        avatar_url
      `)
      .in('id', userIds);
    
    if (clientProfilesError) {
      console.error('Error fetching client profiles:', clientProfilesError);
      throw clientProfilesError;
    }

    // Build a map of user profiles for easy lookup
    const userProfilesMap = {};
    
    // First add basic profile info
    if (profiles) {
      profiles.forEach(profile => {
        userProfilesMap[profile.id] = { ...profile };
      });
    }
    
    // Then add client profile details
    if (clientProfiles) {
      clientProfiles.forEach(profile => {
        if (userProfilesMap[profile.id]) {
          userProfilesMap[profile.id] = {
            ...userProfilesMap[profile.id],
            ...profile
          };
        } else {
          userProfilesMap[profile.id] = { ...profile };
        }
      });
    }

    // Combine workout completions with user profile data
    const activities = completions.map((activity: any) => {
      // Format the likes array
      const formattedLikes = Array.isArray(activity.likes) ? activity.likes : [];
      
      return {
        ...activity,
        profiles: userProfilesMap[activity.user_id] || {},
        likes: formattedLikes
      };
    });

    console.log('Successfully fetched activities:', activities.length);
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
