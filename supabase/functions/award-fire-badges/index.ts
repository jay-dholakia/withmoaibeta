
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

interface ProcessFireBadgesOptions {
  groupId?: string;  // Optional: process only users from a specific group
  weekStart?: string; // Optional: process for a specific week
}

serve(async (req) => {
  // Create a Supabase client with the Admin key
  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const options: ProcessFireBadgesOptions = await req.json().catch(() => ({}));
    const { groupId, weekStart } = options;

    console.log("Processing fire badges:", { groupId, weekStart });

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
          { status: 200, headers: { "Content-Type": "application/json" } }
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
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${users.length} users for week ${weekStartDate}`);
    
    // Process each user
    const results = await Promise.all(
      users.map(async (user) => {
        try {
          const { data: badgeId, error: badgeError } = await supabase
            .rpc("award_fire_badge", {
              award_user_id: user.id,
              award_week_start: weekStartDate
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
        results 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing fire badges:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
})
