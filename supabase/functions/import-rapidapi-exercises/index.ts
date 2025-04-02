
// Follow Deno Edge Function conventions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

// Define exercise interface matching our database schema
interface Exercise {
  name: string;
  category: string;
  description?: string;
  exercise_type?: string;
}

// Setup CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Create the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const rapidApiKey = Deno.env.get('RAPIDAPI_KEY') || '';

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

  // Create Supabase client with service role key (admin rights)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Parse the request body
    const requestData = await req.json();
    const { shouldCheckExisting, limit } = requestData;

    if (!rapidApiKey) {
      return new Response(JSON.stringify({ error: 'RapidAPI key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch exercises from RapidAPI
    console.log(`Fetching exercises from RapidAPI with limit: ${limit || 'all'}`);

    const apiOptions = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    };

    // We can limit the number of exercises to import
    const url = limit ? `https://exercisedb.p.rapidapi.com/exercises?limit=${limit}` : 'https://exercisedb.p.rapidapi.com/exercises';
    const response = await fetch(url, apiOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`RapidAPI response error: ${response.status} ${errorText}`);
    }

    const apiExercises = await response.json();
    console.log(`Received ${apiExercises.length} exercises from RapidAPI`);

    // Transform RapidAPI format to our database format
    const exercises: Exercise[] = apiExercises.map((apiExercise: any) => {
      // Map bodyPart or target to category, use equipment as a fallback
      const category = apiExercise.bodyPart || apiExercise.target || apiExercise.equipment || 'other';
      
      // Determine exercise type based on available data
      let exerciseType = 'strength';
      if (apiExercise.equipment === 'body weight') {
        exerciseType = 'bodyweight';
      } else if (category === 'cardio') {
        exerciseType = 'cardio';
      }

      return {
        name: apiExercise.name,
        category,
        description: `${apiExercise.target || ''} exercise using ${apiExercise.equipment || 'bodyweight'}`.trim(),
        exercise_type: exerciseType
      };
    });

    if (exercises.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid exercises found in API response' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // If we should check for existing exercises
    if (shouldCheckExisting) {
      // For each exercise, check if it exists and update or insert accordingly
      for (const exercise of exercises) {
        // Check if exercise with same name and category exists
        const { data: existingExercises, error: searchError } = await supabase
          .from('exercises')
          .select('id, name, category')
          .eq('name', exercise.name)
          .eq('category', exercise.category);

        if (searchError) {
          console.error('Error checking existing exercises:', searchError);
          continue;
        }

        if (existingExercises && existingExercises.length > 0) {
          const existingId = existingExercises[0].id;
          
          // Check if exercise is referenced in personal_records
          const { count, error: refError } = await supabase
            .from('personal_records')
            .select('*', { count: 'exact', head: true })
            .eq('exercise_id', existingId);
            
          if (refError) {
            console.error('Error checking exercise references:', refError);
            skippedCount++;
            continue;
          }

          // If not referenced in personal_records, update it
          if (count === 0) {
            const { error: updateError } = await supabase
              .from('exercises')
              .update({
                description: exercise.description,
                exercise_type: exercise.exercise_type || 'strength'
              })
              .eq('id', existingId);
              
            if (updateError) {
              console.error('Error updating exercise:', updateError);
              skippedCount++;
            } else {
              updatedCount++;
            }
          } else {
            // Exercise is referenced, skip it
            console.log(`Skipping exercise '${exercise.name}' as it's referenced in personal records`);
            skippedCount++;
          }
        } else {
          // Exercise doesn't exist, insert it
          const { error: insertError } = await supabase
            .from('exercises')
            .insert([exercise]);
            
          if (insertError) {
            console.error('Error inserting exercise:', insertError);
            skippedCount++;
          } else {
            insertedCount++;
          }
        }
      }
    } else {
      // Bulk insert all exercises
      const { error } = await supabase
        .from('exercises')
        .insert(exercises);

      if (error) {
        console.error('Error inserting exercises:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      insertedCount = exercises.length;
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        message: 'Exercises imported successfully from RapidAPI', 
        inserted: insertedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: exercises.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing RapidAPI import:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to process API data' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
