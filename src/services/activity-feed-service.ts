
import { supabase } from "@/integrations/supabase/client";

interface FetchActivitiesOptions {
  limit?: number;
  offset?: number;
}

export const fetchRecentActivities = async ({ limit = 10, offset = 0 }: FetchActivitiesOptions = {}) => {
  try {
    const { data: activities, error } = await supabase
      .from('workout_completions')
      .select(`
        *,
        user:user_id (
          id, 
          email
        ),
        profile:profiles!workout_completions_user_id_fkey (
          first_name, 
          last_name,
          avatar_url
        ),
        likes:activity_likes (
          id,
          user_id,
          created_at
        ),
        comments:activity_comments (
          id,
          user_id,
          content,
          created_at,
          user:profiles!activity_comments_user_id_fkey (
            first_name,
            last_name,
            avatar_url
          )
        )
      `)
      .is('rest_day', false)
      .is('life_happens_pass', false)
      .order('completed_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching activity feed:', error);
      throw error;
    }

    return activities || [];
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
    
    const { data, error } = await supabase
      .from('activity_comments')
      .insert({
        activity_id: activityId,
        content,
        user_id: user.id
      })
      .select(`
        *,
        user:profiles!activity_comments_user_id_fkey (
          first_name,
          last_name,
          avatar_url
        )
      `);

    if (error) {
      console.error('Error adding comment:', error);
      throw error;
    }

    return data?.[0] || null;
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
