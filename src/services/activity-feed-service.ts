
import { supabase } from "@/integrations/supabase/client";

interface FetchActivitiesOptions {
  limit?: number;
  offset?: number;
}

export const fetchRecentActivities = async ({ limit = 10, offset = 0 }: FetchActivitiesOptions = {}) => {
  try {
    // Query workout completions and manually join with other tables using in operator
    const { data: activities, error } = await supabase
      .from('workout_completions')
      .select('*, user_id')
      .is('rest_day', false)
      .is('life_happens_pass', false)
      .order('completed_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching activity feed:', error);
      throw error;
    }

    // If no activities, return empty array
    if (!activities || activities.length === 0) {
      return [];
    }

    // Extract user IDs for batch queries
    const userIds = activities.map(activity => activity.user_id);
    
    // Fetch profiles for all users in one query
    const { data: profiles } = await supabase
      .from('client_profiles')  // Using client_profiles instead of profiles
      .select('id, first_name, last_name, avatar_url')
      .in('id', userIds);
    
    // Create a map of user profiles for easy lookup
    const profileMap = profiles ? 
      profiles.reduce((map: Record<string, any>, profile: any) => {
        map[profile.id] = profile;
        return map;
      }, {}) : {};

    // Fetch likes and comments in batch
    const { data: allLikes } = await supabase
      .from('activity_likes')
      .select('id, user_id, activity_id, created_at')
      .in('activity_id', activities.map(a => a.id));
    
    const { data: allComments } = await supabase
      .from('activity_comments')
      .select('id, user_id, activity_id, content, created_at')
      .in('activity_id', activities.map(a => a.id));

    // Get profiles for comment authors
    const commentUserIds = allComments ? 
      [...new Set(allComments.map(comment => comment.user_id))] : [];
    
    const { data: commentProfiles } = await supabase
      .from('client_profiles')  // Using client_profiles instead of profiles
      .select('id, first_name, last_name, avatar_url')
      .in('id', commentUserIds);
    
    const commentProfileMap = commentProfiles ? 
      commentProfiles.reduce((map: Record<string, any>, profile: any) => {
        map[profile.id] = profile;
        return map;
      }, {}) : {};

    // Combine all data
    const enrichedActivities = activities.map(activity => {
      // Add profile data
      const profiles = profileMap[activity.user_id] || null;
      
      // Add likes
      const likes = allLikes ? 
        allLikes.filter(like => like.activity_id === activity.id) : [];
      
      // Add comments with author profiles
      const comments = allComments ? 
        allComments
          .filter(comment => comment.activity_id === activity.id)
          .map(comment => ({
            ...comment,
            profiles: commentProfileMap[comment.user_id] || null
          })) : [];
      
      return {
        ...activity,
        profiles,
        likes,
        comments
      };
    });

    return enrichedActivities;
  } catch (error) {
    console.error('Error in fetchRecentActivities:', error);
    return [];
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
    return null;
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

export const addComment = async (activityId: string, content: string) => {
  try {
    // Get current user ID from auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Insert the comment
    const { data: commentData, error: commentError } = await supabase
      .from('activity_comments')
      .insert({
        activity_id: activityId,
        content,
        user_id: user.id
      })
      .select('*');

    if (commentError) {
      console.error('Error adding comment:', commentError);
      throw commentError;
    }

    if (!commentData || commentData.length === 0) {
      throw new Error('Failed to create comment');
    }

    // Get user profile data
    const { data: profileData } = await supabase
      .from('client_profiles')
      .select('first_name, last_name, avatar_url')
      .eq('id', user.id)
      .single();

    // Return comment with profile data
    return {
      ...commentData[0],
      profiles: profileData
    };
  } catch (error) {
    console.error('Error in addComment:', error);
    return null;
  }
};

export const deleteComment = async (commentId: string) => {
  try {
    const { error } = await supabase
      .from('activity_comments')
      .delete()
      .match({ id: commentId });

    if (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteComment:', error);
    return false;
  }
};
