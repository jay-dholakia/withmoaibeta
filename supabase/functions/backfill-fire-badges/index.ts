
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// CORS headers for browser clients
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackfillOptions {
  userId?: string; // Optional: process only a specific user
  groupId?: string; // Optional: process only users from a specific group
  dryRun?: boolean; // If true, don't actually insert badges, just report what would be done
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const options: BackfillOptions = await req.json().catch(() => ({}));
    const { userId, groupId, dryRun = false } = options;
    
    console.log("Starting historical fire badge processing:", { userId, groupId, dryRun });
    
    // Get users to process
    let userQuery = supabase.from('profiles')
      .select('id')
      .eq('user_type', 'client');
    
    // Filter by user ID if provided
    if (userId) {
      userQuery = userQuery.eq('id', userId);
    }
    
    // Filter by group if provided
    if (groupId) {
      const { data: groupMembers, error: groupError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);
        
      if (groupError) {
        throw new Error(`Error fetching group members: ${groupError.message}`);
      }
      
      const userIds = groupMembers.map(member => member.user_id);
      if (userIds.length === 0) {
        return new Response(
          JSON.stringify({ message: "No members found in the specified group" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      userQuery = userQuery.in('id', userIds);
    }
    
    const { data: users, error: usersError } = await userQuery;
    
    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }
    
    console.log(`Found ${users?.length || 0} users to process`);
    
    const results = [];
    
    // Process each user
    for (const user of users || []) {
      console.log(`Processing user ${user.id}`);
      
      // Get all program assignments for this user
      const { data: assignments, error: assignmentsError } = await supabase
        .from('program_assignments')
        .select('id, program_id, start_date, end_date')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });
      
      if (assignmentsError) {
        console.error(`Error fetching program assignments for user ${user.id}:`, assignmentsError);
        results.push({ userId: user.id, error: assignmentsError.message });
        continue;
      }
      
      console.log(`Found ${assignments?.length || 0} program assignments for user ${user.id}`);
      
      if (!assignments || assignments.length === 0) {
        results.push({ userId: user.id, status: 'skipped', reason: 'no program assignments' });
        continue;
      }
      
      const userBadges = [];
      
      // Calculate all weeks from first assignment to now
      const firstAssignmentStartDate = new Date(assignments[0].start_date);
      const today = new Date();
      const totalWeeks = Math.ceil((today.getTime() - firstAssignmentStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      console.log(`Processing ${totalWeeks} weeks for user ${user.id}`);
      
      // Process each week
      for (let weekOffset = 0; weekOffset < totalWeeks; weekOffset++) {
        // Calculate week start date (Monday)
        const weekStartDate = new Date(firstAssignmentStartDate);
        weekStartDate.setDate(weekStartDate.getDate() + (weekOffset * 7));
        
        // Ensure we're looking at a Monday (week start)
        const dayOffset = weekStartDate.getDay();
        if (dayOffset !== 1) { // 1 is Monday, 0 is Sunday
          // If not Monday, adjust to the previous Monday
          weekStartDate.setDate(weekStartDate.getDate() - ((dayOffset === 0 ? 7 : dayOffset) - 1));
        }
        
        const weekStartStr = weekStartDate.toISOString().split('T')[0];
        
        // Skip weeks in the future
        if (weekStartDate > today) {
          console.log(`Skipping future week: ${weekStartStr}`);
          continue;
        }
        
        console.log(`Processing week starting ${weekStartStr} for user ${user.id}`);
        
        // Check if badge already exists for this week
        const { data: existingBadge, error: badgeError } = await supabase
          .from('fire_badges')
          .select('id')
          .eq('user_id', user.id)
          .eq('week_start', weekStartStr)
          .maybeSingle();
        
        if (badgeError) {
          console.error(`Error checking existing badge for user ${user.id}, week ${weekStartStr}:`, badgeError);
          continue;
        }
        
        if (existingBadge) {
          console.log(`Badge already exists for user ${user.id}, week ${weekStartStr}, skipping`);
          continue;
        }
        
        // Count distinct days with workouts (excluding rest days)
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6); // 6 days after Monday is Sunday
        const weekEndStr = weekEndDate.toISOString().split('T')[0];
        
        const { data: distinctDays, error: distinctDaysError } = await supabase.rpc(
          "check_user_weekly_completion",
          {
            check_user_id: user.id,
            week_start_date: weekStartStr
          }
        );
        
        if (distinctDaysError) {
          console.error(`Error checking completion for user ${user.id}, week ${weekStartStr}:`, distinctDaysError);
          continue;
        }
        
        if (distinctDays) {
          console.log(`User ${user.id} logged activities on 5+ distinct days for week ${weekStartStr}`);
          
          if (!dryRun) {
            const { data: newBadge, error: insertError } = await supabase
              .from('fire_badges')
              .insert({
                user_id: user.id,
                week_start: weekStartStr,
                created_at: new Date().toISOString()
              })
              .select('id')
              .single();
            
            if (insertError) {
              console.error(`Error inserting badge for user ${user.id}, week ${weekStartStr}:`, insertError);
              userBadges.push({ week: weekStartStr, status: 'error', error: insertError.message });
            } else {
              console.log(`Created badge ${newBadge.id} for user ${user.id}, week ${weekStartStr}`);
              userBadges.push({ week: weekStartStr, status: 'created', badge_id: newBadge.id });
            }
          } else {
            console.log(`[DRY RUN] Would create badge for user ${user.id}, week ${weekStartStr}`);
            userBadges.push({ week: weekStartStr, status: 'would_create' });
          }
        } else {
          console.log(`User ${user.id} did not log activities on 5+ distinct days for week ${weekStartStr}`);
          userBadges.push({ week: weekStartStr, status: 'incomplete' });
        }
      }
      
      results.push({
        userId: user.id,
        badges: userBadges,
        totalBadges: userBadges.filter(b => b.status === 'created' || b.status === 'would_create').length
      });
    }
    
    const totalAwarded = results.reduce((sum, user) => {
      return sum + (user.badges?.filter(b => b.status === 'created').length || 0);
    }, 0);
    
    const totalWouldAward = results.reduce((sum, user) => {
      return sum + (user.badges?.filter(b => b.status === 'would_create').length || 0);
    }, 0);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: dryRun 
          ? `Dry run completed. Would award ${totalWouldAward} badges to ${results.length} users`
          : `Successfully awarded ${totalAwarded} badges to ${results.length} users`,
        dryRun,
        results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error backfilling fire badges:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
