
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivityPost {
  id: string;
  created_at: string;
  user_id: string;
  content: string;
  workout_id?: string;
  workout_type?: string;
  workout_name?: string;
  user_profile?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  likes_count?: number;
  has_liked?: boolean;
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
      
      // Get activities from these users
      const { data: activities, error: activitiesError } = await supabase
        .from('activity_feed')
        .select(`
          *,
          user_profile:client_profiles(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .in('user_id', memberIds)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (activitiesError) throw activitiesError;
      
      return activities || [];
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
