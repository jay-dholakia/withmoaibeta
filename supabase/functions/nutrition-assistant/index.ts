
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { question } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }

    if (!question || typeof question !== 'string') {
      throw new Error('Question is required and must be a string');
    }

    // Log that we're making a request to OpenAI
    console.log(`Making request to OpenAI with API key: ${openAIApiKey.substring(0, 5)}...`);
    
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
            content: `You are a knowledgeable nutrition assistant. Provide helpful, evidence-based nutrition advice and 
            include relevant links to recipes or articles when appropriate. Format your responses in markdown, using 
            bullet points for lists and proper headings. When suggesting recipes, include a brief description and 
            categorize them (e.g., 'high-protein', 'low-carb', etc.).`
          },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
      }),
    });

    // Check for HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('HTTP Error from OpenAI:', response.status, response.statusText, errorData);
      throw new Error(`OpenAI API HTTP error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI API Response received successfully');
    
    // Check for OpenAI API errors
    if (data.error) {
      console.error('OpenAI API Error:', JSON.stringify(data.error));
      
      // Check specifically for quota errors
      if (data.error.code === 'insufficient_quota') {
        throw new Error('The OpenAI API key has exceeded its quota. Please check your billing details on OpenAI platform.');
      } else {
        throw new Error(`OpenAI API error: ${data.error.message || 'Unknown error'}`);
      }
    }
    
    // Check if the response contains the expected data
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected API response structure:', JSON.stringify(data));
      throw new Error('Invalid response from OpenAI API');
    }
    
    return new Response(JSON.stringify({ 
      answer: data.choices[0].message.content,
      status: 'success'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      type: error.name || 'Error',
      status: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
