
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

// Define exercise interface
interface Exercise {
  name: string;
  category: string;
  description?: string;
  exercise_type?: string;
  muscle_group?: string;
  youtube_link?: string;
  log_type?: string;
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const fileType = formData.get('fileType')?.toString() || '';
    const checkExisting = formData.get('checkExisting')?.toString() === 'true';

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${fileType} file: ${file.name}`);

    // Parse the file content based on file type
    let exercises: Exercise[] = [];
    
    if (fileType === 'json') {
      const content = await file.text();
      exercises = JSON.parse(content);
    } else if (fileType === 'csv') {
      const content = await file.text();
      const lines = content.split('\n');
      
      if (lines.length < 2) {
        return new Response(JSON.stringify({ error: 'CSV file must contain at least header row and one data row' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Check for required columns
      if (!headers.includes('name') || !headers.includes('category')) {
        return new Response(JSON.stringify({ error: 'CSV must include name and category columns' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Map indexes for all possible fields
      const nameIndex = headers.indexOf('name');
      const categoryIndex = headers.indexOf('category');
      const descriptionIndex = headers.indexOf('description');
      const exerciseTypeIndex = headers.indexOf('exercise_type');
      const muscleGroupIndex = headers.indexOf('muscle_group');
      const youtubeLinkIndex = headers.indexOf('youtube_link');
      
      // Parse each line into an exercise object
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length <= Math.max(nameIndex, categoryIndex)) continue;
        
        const exercise: Exercise = {
          name: values[nameIndex],
          category: values[categoryIndex],
        };
        
        if (descriptionIndex >= 0 && values[descriptionIndex]) {
          exercise.description = values[descriptionIndex];
        }
        
        if (exerciseTypeIndex >= 0 && values[exerciseTypeIndex]) {
          exercise.exercise_type = values[exerciseTypeIndex];
        } else {
          exercise.exercise_type = 'strength';
        }

        if (muscleGroupIndex >= 0 && values[muscleGroupIndex]) {
          exercise.muscle_group = values[muscleGroupIndex];
        }

        if (youtubeLinkIndex >= 0 && values[youtubeLinkIndex]) {
          exercise.youtube_link = values[youtubeLinkIndex];
        }
        
        exercises.push(exercise);
      }
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported file type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate exercises
    if (exercises.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid exercises found in file' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${exercises.length} exercises to import`);

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    if (checkExisting) {
      for (const exercise of exercises) {
        // Check if exercise with same name exists
        const { data: existingExercises, error: searchError } = await supabase
          .from('exercises')
          .select('id, name')
          .eq('name', exercise.name);

        if (searchError) {
          console.error('Error checking existing exercises:', searchError);
          continue;
        }

        if (existingExercises && existingExercises.length > 0) {
          // Update existing exercise with ALL fields
          const { error: updateError } = await supabase
            .from('exercises')
            .update({
              name: exercise.name,
              category: exercise.category,
              description: exercise.description,
              exercise_type: exercise.exercise_type || 'strength',
              muscle_group: exercise.muscle_group,
              youtube_link: exercise.youtube_link,
              log_type: exercise.log_type || 'weight_reps'
            })
            .eq('id', existingExercises[0].id);
            
          if (updateError) {
            console.error('Error updating exercise:', updateError);
            skippedCount++;
          } else {
            console.log(`Updated exercise: ${exercise.name}`);
            updatedCount++;
          }
        } else {
          // Exercise doesn't exist, insert it with all fields
          const { error: insertError } = await supabase
            .from('exercises')
            .insert([{
              name: exercise.name,
              category: exercise.category,
              description: exercise.description,
              exercise_type: exercise.exercise_type || 'strength',
              muscle_group: exercise.muscle_group,
              youtube_link: exercise.youtube_link,
              log_type: exercise.log_type || 'weight_reps'
            }]);
            
          if (insertError) {
            console.error('Error inserting exercise:', insertError);
            skippedCount++;
          } else {
            console.log(`Inserted exercise: ${exercise.name}`);
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
        message: 'Exercises processed successfully', 
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
    console.error('Error processing import:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to process file' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
