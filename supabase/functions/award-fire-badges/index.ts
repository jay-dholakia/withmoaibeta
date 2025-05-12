
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

interface ProcessFireBadgesOptions {
  groupId?: string;  // Optional: process only users from a specific group
  weekStart?: string; // Optional: process for a specific week
  isAutomatedRun?: boolean; // Is this an automated scheduled run
  processPreviousWeek?: boolean; // Explicitly process previous week
}

// CORS headers for browser clients
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  // Create a Supabase client with the Admin key
  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const options: ProcessFireBadgesOptions = await req.json().catch(() => ({}));
    const { groupId, weekStart, isAutomatedRun = false, processPreviousWeek = false } = options;

    console.log("Processing fire badges:", { groupId, weekStart, isAutomatedRun, processPreviousWeek });

    // Get the current week start date if not provided
    const { data: weekStartData, error: weekStartError } = await supabase
      .rpc("get_pacific_week_start");
    
    if (weekStartError) {
      throw new Error(`Failed to get week start date: ${weekStartError.message}`);
    }
    
    const weekStartDate = weekStart || weekStartData;
    
    if (!weekStartDate) {
      throw new Error("Failed to get week start date");
    }

    console.log("Using week start date:", weekStartDate);

    // Query to get user IDs to process
    let userQuery = supabase.from('profiles')
      .select('id')
      .eq('user_type', 'client');
    
    // If groupId is provided, filter users by that group
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
    
    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users found to process" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${users.length} users for week ${weekStartDate}`);
    
    // For automated runs, check if we need to process past week
    let processWeekStart = weekStartDate;
    
    if (isAutomatedRun || processPreviousWeek) {
      // If today is Monday and early morning, we probably want to process the previous week
      // Or if processPreviousWeek is true, process the previous week regardless
      if (processPreviousWeek || shouldProcessPreviousWeek()) {
        // Calculate previous week's Monday
        const prevWeekDate = new Date(weekStartDate);
        prevWeekDate.setDate(prevWeekDate.getDate() - 7);
        processWeekStart = prevWeekDate.toISOString().split('T')[0];
        console.log(`Processing for previous week: ${processWeekStart}`);
      }
    }
    
    // Process each user
    const results = await Promise.all(
      users.map(async (user) => {
        try {
          console.log(`Processing user ${user.id} for week ${processWeekStart}`);
          
          // Check if the user qualifies for a fire badge (has logged workouts on 5+ different days)
          const { data: qualifies, error: checkError } = await supabase
            .rpc("check_user_weekly_completion", { 
              check_user_id: user.id, 
              week_start_date: processWeekStart 
            });
            
          if (checkError) {
            console.error(`Error checking user qualification: ${checkError.message}`);
            return { userId: user.id, success: false, error: checkError.message };
          }
          
          console.log(`User ${user.id} qualification status for week ${processWeekStart}: ${qualifies}`);
          
          // If user doesn't qualify, skip badge award
          if (!qualifies) {
            return { userId: user.id, success: true, badgeAwarded: false };
          }
          
          // Check if badge already exists for this week and user
          const { data: existingBadge, error: existingError } = await supabase
            .from('fire_badges')
            .select('id')
            .eq('user_id', user.id)
            .eq('week_start', processWeekStart)
            .maybeSingle();
            
          if (existingError) {
            console.error(`Error checking existing badge: ${existingError.message}`);
            return { userId: user.id, success: false, error: existingError.message };
          }
          
          // If badge already exists, skip
          if (existingBadge) {
            return { userId: user.id, success: true, badgeAwarded: false };
          }
          
          // Award new badge
          const { data: newBadge, error: badgeError } = await supabase
            .from('fire_badges')
            .insert({
              user_id: user.id,
              week_start: processWeekStart
            })
            .select('id')
            .single();
            
          if (badgeError) {
            console.error(`Error awarding badge to user ${user.id}: ${badgeError.message}`);
            return { userId: user.id, success: false, error: badgeError.message };
          }
          
          return { 
            userId: user.id, 
            success: true, 
            badgeAwarded: true,
            badgeId: newBadge.id
          };
        } catch (error: any) {
          console.error(`Error processing user ${user.id}:`, error);
          return { userId: user.id, success: false, error: error.message };
        }
      })
    );

    const badgesAwarded = results.filter(r => r.badgeAwarded).length;
    
    return new Response(
      JSON.stringify({ 
        message: `Processed ${users.length} users, awarded ${badgesAwarded} new badges`,
        results,
        automated: isAutomatedRun,
        weekProcessed: processWeekStart
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error: any) {
    console.error("Error processing fire badges:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to determine if we should process the previous week
// This handles the case where the cron job runs early Monday
function shouldProcessPreviousWeek(): boolean {
  const pacificDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
  );
  
  const dayOfWeek = pacificDate.getDay(); // 0 is Sunday, 1 is Monday
  const hourOfDay = pacificDate.getHours();
  
  // If it's early Monday morning (before 6 AM), process for previous week
  return dayOfWeek === 1 && hourOfDay < 6;
}
