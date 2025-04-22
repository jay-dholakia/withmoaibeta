
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, userId } = await req.json();

    // Detailed logging for API key check
    if (!openAIApiKey) {
      console.error('CRITICAL: OPENAI_API_KEY is not set');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key is not configured. Please contact support.',
        status: 'configuration_error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // More robust input validation
    if (!question || typeof question !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Invalid input: Question is required and must be a string',
        status: 'input_error' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with the authorization from the request
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch workout history context if userId is provided
    let workoutContext = '';
    if (userId) {
      try {
        console.log(`Fetching workout history for user ${userId}`);
        
        // Get recent workouts (last 10)
        const { data: recentWorkouts, error: workoutsError } = await supabase
          .from('workout_completions')
          .select(`
            id,
            completed_at,
            workout_type,
            title,
            workout_id,
            rest_day
          `)
          .eq('user_id', userId)
          .order('completed_at', { ascending: false })
          .limit(10);
        
        if (workoutsError) {
          console.error('Error fetching workout history:', workoutsError);
        } else if (recentWorkouts && recentWorkouts.length > 0) {
          // Build context from workouts
          workoutContext = `
Recent workout history:
${recentWorkouts.map(w => `- ${w.title || (w.rest_day ? 'Rest Day' : 'Workout')} (${w.workout_type || 'unknown type'}) on ${new Date(w.completed_at).toLocaleDateString()}`).join('\n')}

Based on this workout history, please provide personalized nutrition advice.`;

          console.log('Added workout context to prompt');
        } else {
          console.log('No workout history found for user');
          workoutContext = 'No workout history available. Provide general nutrition advice.';
        }
      } catch (error) {
        console.error('Error processing workout history:', error);
        workoutContext = 'Error retrieving workout history. Providing general nutrition advice instead.';
      }
    }

    // Log the outgoing request details (without sensitive information)
    console.log(`Making OpenAI API request. Question length: ${question.length}`);

    // Make the OpenAI API call with enhanced error handling
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a knowledgeable nutrition assistant specialized in fitness nutrition.
You provide evidence-based nutrition advice tailored to a person's workout routine and fitness goals.
${workoutContext}`
          },
          { 
            role: 'user', 
            content: question 
          }
        ],
        temperature: 0.7,
      }),
    });

    // Log response status for debugging
    console.log(`OpenAI API Response Status: ${response.status}`);

    // Enhanced error handling for API responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      // Special handling for rate limit or quota errors
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          answer: 'The nutrition assistant service is currently disabled.',
          status: 'quota_exceeded' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        error: 'Failed to get response from OpenAI',
        status: 'api_error',
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    // Additional logging for the generated response
    console.log(`OpenAI Response Generated. Tokens: ${data.usage?.total_tokens || 'Unknown'}`);

    return new Response(JSON.stringify({ 
      answer: data.choices[0].message.content,
      status: 'success'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Catch-all error logging
    console.error('Unexpected error in nutrition-assistant function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred',
      status: 'unexpected_error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
