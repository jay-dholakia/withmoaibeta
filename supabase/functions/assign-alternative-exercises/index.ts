
// Follow Deno Edge Function conventions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

// Define exercise interface
interface Exercise {
  id: string;
  name: string;
  category: string;
  exercise_type: string;
  description?: string;
  alternative_exercise_1_id?: string | null;
  alternative_exercise_2_id?: string | null;
  alternative_exercise_3_id?: string | null;
}

// Setup CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // We only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { maxPerExercise = 3 } = await req.json();
    
    // Get all exercises
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('id, name, category, exercise_type, alternative_exercise_1_id, alternative_exercise_2_id, alternative_exercise_3_id')
      .order('name');

    if (exercisesError) {
      throw new Error(`Error fetching exercises: ${exercisesError.message}`);
    }

    // Group exercises by category
    const exercisesByCategory: Record<string, Exercise[]> = {};
    exercises.forEach((exercise: Exercise) => {
      if (!exercisesByCategory[exercise.category]) {
        exercisesByCategory[exercise.category] = [];
      }
      exercisesByCategory[exercise.category].push(exercise);
    });

    let processedCount = 0;
    let updatedCount = 0;

    // Process each exercise
    for (const exercise of exercises) {
      processedCount++;
      
      // Skip exercises that already have all alternatives set
      if (
        exercise.alternative_exercise_1_id && 
        exercise.alternative_exercise_2_id && 
        exercise.alternative_exercise_3_id
      ) {
        continue;
      }
      
      // Get potential alternatives from the same category
      const potentialAlternatives = exercisesByCategory[exercise.category]
        .filter(alt => 
          // Don't use itself as an alternative
          alt.id !== exercise.id &&
          // Don't use exercises that are already marked as alternatives
          alt.id !== exercise.alternative_exercise_1_id &&
          alt.id !== exercise.alternative_exercise_2_id &&
          alt.id !== exercise.alternative_exercise_3_id
        );
      
      if (potentialAlternatives.length === 0) {
        continue; // No alternatives available
      }
      
      // Randomly select alternatives
      const shuffled = [...potentialAlternatives].sort(() => 0.5 - Math.random());
      const selectedAlternatives = shuffled.slice(0, maxPerExercise);
      
      // Prepare update
      const update: Record<string, string> = {};
      
      // Fill in missing alternatives
      if (!exercise.alternative_exercise_1_id && selectedAlternatives[0]) {
        update.alternative_exercise_1_id = selectedAlternatives[0].id;
      }
      
      if (!exercise.alternative_exercise_2_id && selectedAlternatives[1]) {
        update.alternative_exercise_2_id = selectedAlternatives[1].id;
      }
      
      if (!exercise.alternative_exercise_3_id && selectedAlternatives[2]) {
        update.alternative_exercise_3_id = selectedAlternatives[2].id;
      }
      
      // If we have updates to make
      if (Object.keys(update).length > 0) {
        const { error: updateError } = await supabase
          .from('exercises')
          .update(update)
          .eq('id', exercise.id);
        
        if (updateError) {
          console.error(`Error updating exercise ${exercise.name}: ${updateError.message}`);
          continue;
        }
        
        updatedCount += Object.keys(update).length;
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        message: 'Alternative exercise assignment completed',
        processed: processedCount,
        updated: updatedCount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing assignment:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to assign alternative exercises' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
