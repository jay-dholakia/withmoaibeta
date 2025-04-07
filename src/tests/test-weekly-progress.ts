
import { supabase } from '@/integrations/supabase/client';

/**
 * Test script to validate that the get_weekly_progress Edge Function 
 * is correctly deployed and callable from the frontend
 */
async function testWeeklyProgressFunction() {
  console.log("🧪 Testing get_weekly_progress Edge Function...");

  try {
    // Call the Edge Function with a test payload
    const { data, error } = await supabase.functions.invoke('get_weekly_progress', {
      method: 'POST',
      body: { client_id: 'test-client-id' },
    });

    // Log the results
    if (error) {
      console.error("❌ Error calling get_weekly_progress:", error);
      return;
    }

    console.log("✅ Successfully called get_weekly_progress Edge Function!");
    console.log("📊 Response structure:", JSON.stringify(data, null, 2));
    
    // Type validation
    const expectedFields = [
      'program_id', 'program_title', 'current_week', 'total_weeks', 
      'program_type', 'metrics'
    ];
    
    const metricsFields = [
      'strength_workouts', 'strength_mobility', 'miles_run', 'cardio_minutes'
    ];
    
    const missingFields = expectedFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      console.warn("⚠️ Response is missing expected fields:", missingFields);
    } else {
      console.log("✅ Response contains all expected top-level fields");
    }
    
    const metrics = data.metrics || {};
    const missingMetrics = metricsFields.filter(field => !(field in metrics));
    
    if (missingMetrics.length > 0) {
      console.warn("⚠️ Response metrics are missing expected fields:", missingMetrics);
    } else {
      console.log("✅ Response metrics contain all expected fields");
    }

  } catch (error) {
    console.error("❌ Exception calling get_weekly_progress:", error);
  }
}

// Execute test when imported directly
if (import.meta.url === import.meta.main) {
  testWeeklyProgressFunction();
}

// Export for use in other modules
export { testWeeklyProgressFunction };
