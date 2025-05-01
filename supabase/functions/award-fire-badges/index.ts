
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
    const weekStartDate = weekStart || 
      (await supabase.rpc("get_pacific_week_start")).data;
    
    if (!weekStartDate) {
      throw new Error("Failed to get week start date");
    }

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
          // Call the updated database function which now checks for 5 distinct workout days
          const { data: badgeId, error: badgeError } = await supabase
            .rpc("award_fire_badge", {
              award_user_id: user.id,
              award_week_start: processWeekStart
            });
            
          if (badgeError) {
            console.error(`Error awarding badge to user ${user.id}: ${badgeError.message}`);
            return { userId: user.id, success: false, error: badgeError.message };
          }
          
          return { 
            userId: user.id, 
            success: true, 
            badgeAwarded: !!badgeId
          };
        } catch (error) {
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
    
  } catch (error) {
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
