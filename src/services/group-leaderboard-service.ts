
import { supabase } from '@/integrations/supabase/client';

export interface GroupLeaderboardItem {
  id: string;
  name: string;
  description?: string;
  totalFireBadges: number;
  activeMembersCount: number;
  iconOrEmoji?: string;
}

interface GroupMember {
  id: string;
  name: string;
  profile_picture_url: string;
}

/**
 * Fetches the group leaderboard sorted by total fire badges
 */
export const fetchGroupLeaderboard = async (): Promise<GroupLeaderboardItem[]> => {
  try {
    // Get all groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, description');

    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      return [];
    }

    const leaderboardItems: GroupLeaderboardItem[] = [];
    for (const group of groups) {
      // Get members for each group
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', group.id);
      if (membersError) {
        console.error(`Error fetching members for group ${group.id}:`, membersError);
        continue;
      }

      const memberIds = members.map(m => m.user_id);
      if (memberIds.length === 0) {
        continue;
      }

      // Count fire badges
      const { count: totalFireBadges, error: badgesError } = await supabase
        .from('fire_badges')
        .select('id', { count: 'exact', head: false })
        .in('user_id', memberIds);
      if (badgesError) {
        console.error(`Error fetching fire badges for group ${group.id}:`, badgesError);
        continue;
      }

      leaderboardItems.push({
        id: group.id,
        name: group.name,
        description: group.description,
        totalFireBadges: totalFireBadges || 0,
        activeMembersCount: memberIds.length,
      });
    }

    return leaderboardItems.sort((a, b) => b.totalFireBadges - a.totalFireBadges);
  } catch (error) {
    console.error('Error in fetchGroupLeaderboard:', error);
    return [];
  }
};

/**
 * Fetches group members with their profile data and badge counts
 */
export const fetchGroupMembersWithBadges = async (groupId: string): Promise<GroupMember[]> => {
  try {
    // Get members of the group
    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    if (memberError) {
      console.error('Error fetching group members:', memberError);
      return [];
    }

    if (!memberData || memberData.length === 0) {
      return [];
    }

    // Get profiles for each member
    const memberIds = memberData.map(m => m.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, avatar_url')
      .in('id', memberIds);
      
    if (profilesError) {
      console.error('Error fetching member profiles:', profilesError);
      return [];
    }

    // Get client profiles for more info
    const { data: clientProfiles, error: clientProfilesError } = await supabase
      .from('client_profiles')
      .select('id, first_name, last_name')
      .in('id', memberIds);
      
    if (clientProfilesError) {
      console.error('Error fetching client profiles:', clientProfilesError);
    }

    // Format member data
    const members: GroupMember[] = profiles.map(profile => {
      const clientProfile = clientProfiles?.find(cp => cp.id === profile.id);
      let name = '';
      
      if (clientProfile) {
        if (clientProfile.first_name || clientProfile.last_name) {
          name = [clientProfile.first_name, clientProfile.last_name].filter(Boolean).join(' ');
        }
      }
      
      return {
        id: profile.id,
        name: name || `User ${profile.id.substring(0, 4)}`,
        profile_picture_url: profile.avatar_url || ''
      };
    });

    return members;
  } catch (error) {
    console.error('Error in fetchGroupMembersWithBadges:', error);
    return [];
  }
};
