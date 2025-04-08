
import { supabase } from '@/integrations/supabase/client';

/**
 * Type definition for the expected response from get_weekly_progress
 */
export interface WeeklyProgressResponse {
  program_id: string;
  program_title: string;
  current_week: number;
  total_weeks: number;
  program_type: 'moai_run' | 'moai_strength';
  metrics: {
    strength_workouts: { target: number; actual: number };
    strength_mobility: { target: number; actual: number };
    miles_run: { target: number; actual: number };
    cardio_minutes: { target: number; actual: number };
  };
  error?: string; // Add optional error field
}

/**
 * Test script to validate that the get_weekly_progress Edge Function 
 * is correctly deployed and callable from the frontend
 */
async function testWeeklyProgressFunction() {
  console.log("🧪 Testing get_weekly_progress Edge Function...");
  
  try {
    console.log("📤 Sending request to get_weekly_progress...");
    // Call the Edge Function with a test payload
    const { data, error } = await supabase.functions.invoke('get_weekly_progress', {
      method: 'POST',
      body: { client_id: 'test-client-id' },
    });

    // Log the results
    if (error) {
      console.error("❌ Error calling get_weekly_progress:", error);
      console.error("📋 Error details:", JSON.stringify(error, null, 2));
      console.log("🔑 Verifying authentication...");
      const { data: authData } = await supabase.auth.getUser();
      console.log("🔐 Current auth state:", authData?.user ? "Authenticated" : "Not authenticated");
      
      throw error;
    }

    console.log("✅ Successfully called get_weekly_progress Edge Function!");
    
    // Check if the function returned an error
    if (data?.error) {
      console.warn("⚠️ Function returned with error:", data.error);
      if (data.details) {
        console.warn("📋 Error details:", data.details);
      }
    }
    
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
    
    const metrics = data?.metrics || {};
    const missingMetrics = metricsFields.filter(field => !(field in metrics));
    
    if (missingMetrics.length > 0) {
      console.warn("⚠️ Response metrics are missing expected fields:", missingMetrics);
    } else {
      console.log("✅ Response metrics contain all expected fields");
    }

    // Check that each metric has target and actual properties
    let metricsFormatValid = true;
    for (const metric of metricsFields) {
      if (metrics[metric]) {
        if (!('target' in metrics[metric]) || !('actual' in metrics[metric])) {
          console.warn(`⚠️ Metric ${metric} is missing target or actual property`);
          metricsFormatValid = false;
        }
      }
    }
    
    if (metricsFormatValid) {
      console.log("✅ All metrics have the correct format with target and actual values");
    }

    // Validate program_type is one of the expected values
    if (data.program_type && !['moai_run', 'moai_strength'].includes(data.program_type)) {
      console.warn(`⚠️ Unexpected program_type: ${data.program_type}`);
    } else {
      console.log(`✅ Program type is valid: ${data.program_type || 'not provided'}`);
    }

    return data as WeeklyProgressResponse;
  } catch (error) {
    console.error("❌ Exception calling get_weekly_progress:", error);
    throw error;
  }
}

// Export for use in other modules
export { testWeeklyProgressFunction };
