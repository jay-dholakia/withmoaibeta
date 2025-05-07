
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivityPost {
  id: string;
  created_at: string;
  user_id: string;
  content?: string;
  workout_id?: string;
  workout_type?: string;
  workout_name?: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  description?: string;
  notes?: string;
  duration?: string;
  distance?: string;
  completed_at?: string;
  workout?: {
    title?: string;
  };
  likes?: {
    user_id: string;
  }[];
}

export function useActivityFeed() {
  const { user } = useAuth();
  
  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Get activities from user's groups
      const { data: userGroups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);
      
      if (groupsError) throw groupsError;
      if (!userGroups || userGroups.length === 0) return [];
      
      const groupIds = userGroups.map(g => g.group_id);
      
      // Get all users in these groups
      const { data: groupMembers, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .in('group_id', groupIds);
      
      if (membersError) throw membersError;
      if (!groupMembers || groupMembers.length === 0) return [];
      
      const memberIds = [...new Set(groupMembers.map(m => m.user_id))];
      
      // Get activities from these users - using workout_completions which exists in the schema
      const { data: activities, error: activitiesError } = await supabase
        .from('workout_completions')
        .select(`
          *,
          profiles:client_profiles(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .in('user_id', memberIds)
        .order('completed_at', { ascending: false })
        .limit(20);
      
      if (activitiesError) throw activitiesError;
      
      // Get the likes for these activities
      const activityIds = activities ? activities.map(a => a.id) : [];
      const { data: likes, error: likesError } = await supabase
        .from('activity_likes')
        .select('activity_id, user_id')
        .in('activity_id', activityIds);
      
      if (likesError) throw likesError;
      
      // Attach likes to each activity
      const activitiesWithLikes = activities ? activities.map(activity => {
        const activityLikes = likes ? likes.filter(like => like.activity_id === activity.id) : [];
        return {
          ...activity,
          likes: activityLikes,
          has_liked: activityLikes.some(like => like.user_id === user.id)
        };
      }) : [];
      
      return activitiesWithLikes as ActivityPost[];
    },
    staleTime: 60000, // 1 minute
    enabled: !!user?.id,
  });
  
  return {
    posts,
    isLoading,
    error,
    refetch,
  };
}
