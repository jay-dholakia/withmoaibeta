
// Follow Deno Edge Function conventions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

// Define exercise interface
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
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsResponse = () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return corsResponse();
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
    const formData = await req.formData();
    const file = formData.get('file');
    const fileType = formData.get('fileType')?.toString() || '';

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
      
      // Assuming first line is header
      const headers = lines[0].split(',').map(h => h.trim());
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        const values = lines[i].split(',').map(v => v.trim());
        const exercise: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          if (values[index]) {
            exercise[header] = values[index];
          }
        });
        
        exercises.push(exercise as unknown as Exercise);
      }
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported file type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log the parsed exercises
    console.log(`Found ${exercises.length} exercises to import`);

    // Insert exercises into the database
    const { data, error } = await supabase.from('exercises').insert(exercises);

    if (error) {
      console.error('Error inserting exercises:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        message: 'Exercises imported successfully', 
        count: exercises.length 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing import:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process file' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
