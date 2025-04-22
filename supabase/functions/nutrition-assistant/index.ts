
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
    const { question } = await req.json();

    if (!openAIApiKey) {
      console.error('CRITICAL: OPENAI_API_KEY is not set');
      throw new Error('OPENAI_API_KEY environment variable not set');
    }

    if (!question || typeof question !== 'string') {
      throw new Error('Question is required and must be a string');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user information from the auth token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    console.log('Fetching recent workout history...');
    
    // Get recent workout completions
    const { data: workouts, error: workoutsError } = await supabaseClient
      .from('workout_completions')
      .select(`
        id,
        completed_at,
        workout_type,
        title,
        rating,
        notes,
        distance,
        duration
      `)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(5);

    if (workoutsError) {
      console.error('Error fetching workouts:', workoutsError);
      throw workoutsError;
    }

    // Format workout history for the AI context
    const workoutHistory = workouts?.map(w => ({
      date: w.completed_at,
      type: w.workout_type,
      title: w.title,
      rating: w.rating,
      notes: w.notes,
      distance: w.distance,
      duration: w.duration
    })) || [];

    // Get client profile for additional context
    const { data: profile, error: profileError } = await supabaseClient
      .from('client_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching client profile:', profileError);
    }

    // Format the system message with workout history and profile context
    const systemMessage = `You are a knowledgeable nutrition assistant with access to the client's recent workout history and profile. 
    
Client Profile:
${profile ? `
- Height: ${profile.height || 'Not specified'}
- Weight: ${profile.weight || 'Not specified'}
- Fitness Goals: ${profile.fitness_goals?.join(', ') || 'Not specified'}
` : 'Profile information not available'}

Recent Workout History:
${workoutHistory.map(w => `- ${w.date}: ${w.type || 'Workout'} - ${w.title || 'Untitled'} ${w.distance ? `(${w.distance} miles)` : ''} ${w.duration ? `(${w.duration} minutes)` : ''}`).join('\n')}

Using this context, provide personalized, evidence-based nutrition advice that takes into account their recent workout activity and goals. Format your responses in markdown, using bullet points for lists and proper headings. When suggesting recipes, include a brief description and categorize them (e.g., 'high-protein', 'low-carb', etc.).

Base your recommendations on:
1. Their recent workout types and intensity
2. Their fitness goals
3. Their current profile information
4. The specific question they're asking

Always encourage proper hydration and recovery nutrition when you notice intense workouts in their history.`;
    
    console.log('Making request to OpenAI with workout context...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
      }),
    });

    // Check for HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('HTTP Error from OpenAI:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`OpenAI API HTTP error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check for OpenAI API errors
    if (data.error) {
      console.error('OpenAI API Error:', JSON.stringify(data.error, null, 2));
      throw new Error(`OpenAI API error: ${data.error.message || 'Unknown error'}`);
    }
    
    return new Response(JSON.stringify({ 
      answer: data.choices[0].message.content,
      status: 'success'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in nutrition assistant:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      status: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
