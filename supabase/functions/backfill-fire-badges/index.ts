
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
      
      // Process each program assignment
      for (const assignment of assignments) {
        console.log(`Processing program assignment ${assignment.id} (program ${assignment.program_id})`);
        
        // Get all weeks for this program
        const { data: weeks, error: weeksError } = await supabase
          .from('workout_weeks')
          .select('id, week_number')
          .eq('program_id', assignment.program_id)
          .order('week_number', { ascending: true });
        
        if (weeksError) {
          console.error(`Error fetching program weeks for program ${assignment.program_id}:`, weeksError);
          continue;
        }
        
        console.log(`Found ${weeks?.length || 0} weeks in program ${assignment.program_id}`);
        
        if (!weeks || weeks.length === 0) {
          continue;
        }
        
        // Calculate the start date of each week based on program_assignment.start_date
        const assignmentStartDate = new Date(assignment.start_date);
        
        // Process each week
        for (const week of weeks) {
          // Calculate the Monday of this week (week start date)
          const weekStartDate = new Date(assignmentStartDate);
          weekStartDate.setDate(weekStartDate.getDate() + (week.week_number - 1) * 7);
          
          // Ensure we're looking at a Monday (week start)
          const dayOffset = weekStartDate.getDay();
          if (dayOffset !== 1) { // 1 is Monday, 0 is Sunday
            // If not Monday, adjust to the previous Monday
            weekStartDate.setDate(weekStartDate.getDate() - ((dayOffset === 0 ? 7 : dayOffset) - 1));
          }
          
          const weekStartStr = weekStartDate.toISOString().split('T')[0];
          
          // Calculate the Sunday of this week (week end date)
          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekEndDate.getDate() + 6); // Sunday is 6 days after Monday
          const weekEndStr = weekEndDate.toISOString().split('T')[0];
          
          console.log(`Processing week ${week.week_number}, date range: ${weekStartStr} to ${weekEndStr}`);
          
          // Skip weeks in the future
          const today = new Date();
          if (weekStartDate > today) {
            console.log(`Skipping future week: ${weekStartStr}`);
            continue;
          }
          
          // Skip weeks outside the program assignment period
          if (assignment.end_date && weekStartDate > new Date(assignment.end_date)) {
            console.log(`Skipping week after program end date: ${weekStartStr}`);
            continue;
          }
          
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
          
          // Get all workouts assigned for this week
          const { data: workouts, error: workoutsError } = await supabase
            .from('workouts')
            .select('id')
            .eq('week_id', week.id);
          
          if (workoutsError) {
            console.error(`Error fetching workouts for week ${week.id}:`, workoutsError);
            continue;
          }
          
          const workoutCount = workouts?.length || 0;
          console.log(`Found ${workoutCount} assigned workouts for week ${week.week_number}`);
          
          if (workoutCount === 0) {
            console.log(`No workouts assigned for week ${week.week_number}, skipping`);
            continue;
          }
          
          // Get completed workouts for this week
          const workoutIds = workouts.map(w => w.id);
          
          // Query completed workouts within the week's date range
          const { data: completions, error: completionsError } = await supabase
            .from('workout_completions')
            .select('id, workout_id')
            .eq('user_id', user.id)
            .in('workout_id', workoutIds)
            .not('completed_at', 'is', null)
            .gte('completed_at', `${weekStartStr}T00:00:00Z`)
            .lte('completed_at', `${weekEndStr}T23:59:59Z`);
          
          if (completionsError) {
            console.error(`Error fetching workout completions for user ${user.id}, week ${weekStartStr}:`, completionsError);
            continue;
          }
          
          const completedCount = completions?.length || 0;
          console.log(`Found ${completedCount} completed workouts for user ${user.id}, week ${weekStartStr}`);
          
          // If all workouts were completed, award a badge
          if (completedCount >= workoutCount) {
            console.log(`User ${user.id} completed all ${workoutCount} workouts for week ${weekStartStr}`);
            
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
            console.log(`User ${user.id} completed only ${completedCount}/${workoutCount} workouts for week ${weekStartStr}`);
            userBadges.push({ week: weekStartStr, status: 'incomplete', completed: completedCount, total: workoutCount });
          }
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
