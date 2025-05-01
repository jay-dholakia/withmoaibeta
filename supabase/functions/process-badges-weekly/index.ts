
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// This function can be called by a cron job or scheduler
// to automatically process badges weekly
serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log("Starting automatic weekly fire badge processing");
    
    // Call the award-fire-badges function as an automated run
    const { data, error } = await supabase.functions.invoke('award-fire-badges', {
      body: { isAutomatedRun: true }
    });
    
    if (error) {
      throw error;
    }
    
    console.log("Weekly badge processing completed:", data.message);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Weekly badge processing completed", 
        details: data 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in weekly badge processing:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
