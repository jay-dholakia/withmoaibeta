import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, userId } = await req.json();

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

    if (!question || typeof question !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Invalid input: Question is required and must be a string',
        status: 'input_error' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    let contextContent = '';
    if (userId) {
      try {
        console.log(`Fetching profile and workout history for user ${userId}`);
        
        // Fetch client profile to get fitness goals and personal stats
        const { data: profileData, error: profileError } = await supabase
          .from('client_profiles')
          .select('fitness_goals, first_name, birthday, height, weight')
          .eq('id', userId)
          .single();
          
        if (profileError) {
          console.error('Error fetching client profile:', profileError);
        } else if (profileData) {
          contextContent += 'User profile information:\n';
          
          // Calculate age if birthday exists
          let age = null;
          if (profileData.birthday) {
            const birthDate = new Date(profileData.birthday);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
          }
          
          if (profileData.first_name) {
            contextContent += `Name: ${profileData.first_name}\n`;
          }
          
          if (age) {
            contextContent += `Age: ${age}\n`;
          }
          
          if (profileData.height) {
            contextContent += `Height: ${profileData.height}\n`;
          }
          
          if (profileData.weight) {
            contextContent += `Weight: ${profileData.weight}\n`;
          }
          
          if (profileData.fitness_goals && profileData.fitness_goals.length > 0) {
            contextContent += `Fitness goals: ${profileData.fitness_goals.join(', ')}\n`;
          }
          
          contextContent += '\n';
          console.log('Added personal stats to nutrition context');
        }
        
        // Fetch recent workouts
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
          contextContent += `
Recent workout history:
${recentWorkouts.map(w => `- ${w.title || (w.rest_day ? 'Rest Day' : 'Workout')} (${w.workout_type || 'unknown type'}) on ${new Date(w.completed_at).toLocaleDateString()}`).join('\n')}

Using the above profile information and workout history, provide personalized nutrition advice.`;

          console.log('Added workout history to prompt');
        } else {
          console.log('No workout history found for user');
          contextContent += 'No workout history available. Providing nutrition advice based on profile information.';
        }
      } catch (error) {
        console.error('Error processing user data:', error);
        contextContent = 'Error retrieving user data. Providing general nutrition advice instead.';
      }
    }

    console.log(`Making OpenAI API request. Question length: ${question.length}`);

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
You provide evidence-based nutrition advice tailored to a person's physiological attributes, workout routine, and fitness goals.
When asked about caloric needs, TDEE, or macros, use the available profile information to give specific numerical estimates.
${contextContent}`
          },
          { 
            role: 'user', 
            content: question 
          }
        ],
        temperature: 0.7,
      }),
    });

    console.log(`OpenAI API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

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
    
    console.log(`OpenAI Response Generated. Tokens: ${data.usage?.total_tokens || 'Unknown'}`);

    return new Response(JSON.stringify({ 
      answer: data.choices[0].message.content,
      status: 'success'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
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
