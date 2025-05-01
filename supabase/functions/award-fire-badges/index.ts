
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get current week's start date
    const { data: currentWeekStart, error: weekError } = await supabase.rpc(
      'get_pacific_week_start'
    );
    
    if (weekError) {
      console.error("Error getting current week start:", weekError);
      throw weekError;
    }
    
    console.log("Current week start:", currentWeekStart);
    
    // Get all active users with program assignments
    const { data: activeUsers, error: userError } = await supabase
      .from('program_assignments')
      .select('user_id')
      .is('end_date', null)
      .order('user_id');
      
    if (userError) {
      console.error("Error fetching active users:", userError);
      throw userError;
    }
    
    console.log(`Processing ${activeUsers?.length || 0} active users`);
    
    const results = [];
    
    // For each active user, check and award badges
    for (const user of (activeUsers || [])) {
      try {
        const { data: badgeId, error: badgeError } = await supabase.rpc(
          'award_fire_badge',
          { 
            award_user_id: user.user_id,
            award_week_start: currentWeekStart
          }
        );
        
        if (badgeError) {
          console.error(`Error awarding badge to user ${user.user_id}:`, badgeError);
          results.push({ userId: user.user_id, success: false, error: badgeError.message });
          continue;
        }
        
        if (badgeId) {
          results.push({ userId: user.user_id, success: true, badgeId });
          console.log(`Awarded badge to user ${user.user_id}`);
        } else {
          results.push({ userId: user.user_id, success: false, reason: "Not eligible" });
          console.log(`User ${user.user_id} not eligible for badge`);
        }
      } catch (error) {
        console.error(`Error processing user ${user.user_id}:`, error);
        results.push({ userId: user.user_id, success: false, error: String(error) });
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${activeUsers?.length || 0} users`, 
      results 
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
    
  } catch (error) {
    console.error("Error in award-fire-badges function:", error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error) 
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 500,
    });
  }
});
