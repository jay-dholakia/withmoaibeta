
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, format, isMonday } from 'date-fns';
import { generateWeeklyBuddies, getCurrentWeekStartDate } from './accountability-buddy-service';

/**
 * Run weekly maintenance tasks
 * This function regenerates accountability buddies for all groups
 * It should be called every Monday by a scheduled job
 */
export const runWeeklyMaintenance = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    // Only run this on Mondays to avoid multiple regenerations
    if (!isMonday(new Date())) {
      return { 
        success: false, 
        message: 'Weekly maintenance should only run on Mondays' 
      };
    }
    
    console.log('Starting weekly maintenance tasks');
    
    // Get all groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name');
      
    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      return { 
        success: false, 
        message: 'Failed to fetch groups', 
        details: groupsError 
      };
    }
    
    if (!groups || groups.length === 0) {
      return { 
        success: true, 
        message: 'No groups found to process' 
      };
    }
    
    console.log(`Processing ${groups.length} groups for weekly buddy assignments`);
    
    // Generate buddy pairings for each group
    const results = await Promise.all(
      groups.map(async (group) => {
        try {
          const success = await generateWeeklyBuddies(group.id);
          return {
            groupId: group.id,
            groupName: group.name,
            success
          };
        } catch (error) {
          console.error(`Error generating buddies for group ${group.name}:`, error);
          return {
            groupId: group.id,
            groupName: group.name,
            success: false,
            error
          };
        }
      })
    );
    
    const successCount = results.filter(r => r.success).length;
    
    return {
      success: true,
      message: `Weekly maintenance completed. Generated buddy pairings for ${successCount}/${groups.length} groups.`,
      details: results
    };
  } catch (error) {
    console.error('Unexpected error in weekly maintenance:', error);
    return {
      success: false,
      message: 'Unexpected error during weekly maintenance',
      details: error
    };
  }
};

/**
 * Check if we need to generate new buddy pairings for the current week
 * This can be called on app initialization to ensure buddy pairings exist
 * @returns boolean - true if buddies exist, false if they don't exist
 */
export const checkAndGenerateBuddies = async (groupId: string): Promise<boolean> => {
  try {
    // Get the start of the current week (Monday) using the shared function
    const weekStartDate = getCurrentWeekStartDate();
    
    console.log("Checking for buddy pairings for week starting:", weekStartDate);
    
    // Check if pairings already exist for this week
    const { data: existingPairings, error: checkError } = await supabase
      .from('accountability_buddies')
      .select('id')
      .eq('group_id', groupId)
      .eq('week_start', weekStartDate);
      
    if (checkError) {
      console.error('Error checking existing pairings:', checkError);
      return false;
    }
    
    const pairingsExist = existingPairings && existingPairings.length > 0;
    
    // If pairings don't exist for this week, log it but DON'T generate them yet
    // We'll handle generation separately
    if (!pairingsExist) {
      console.log('No buddy pairings found for this week');
      return false;
    }
    
    console.log(`Weekly buddy pairings already exist (${existingPairings.length} pairs)`);
    return true;
  } catch (error) {
    console.error('Error in checkAndGenerateBuddies:', error);
    return false;
  }
};
