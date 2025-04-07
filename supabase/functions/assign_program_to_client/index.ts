
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AssignProgramRequest {
  program_id: string;
  client_id: string;
  start_date?: string; // ISO format date string, defaults to today
}

export const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Check if request method is POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const requestData: AssignProgramRequest = await req.json()
    const { program_id, client_id, start_date } = requestData
    
    // Validate required fields
    if (!program_id || !client_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: program_id and client_id are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get auth token from request header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract JWT token
    const token = authHeader.replace('Bearer ', '')
    
    // Get Supabase URL and service role key from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      },
    })

    // Get user ID from JWT (will be used as assigned_by)
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('User auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const coach_id = user.id

    // 1. Validate coach has permission to assign this program
    const { data: coachPermission, error: permissionError } = await supabase.rpc(
      'is_coach_for_client',
      { coach_id, client_id }
    )

    if (permissionError || !coachPermission) {
      console.error('Permission check error:', permissionError)
      return new Response(
        JSON.stringify({ error: 'You do not have permission to assign programs to this client' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate that the program belongs to this coach
    const { data: programData, error: programError } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', program_id)
      .eq('coach_id', coach_id)
      .single()

    if (programError || !programData) {
      console.error('Program validation error:', programError)
      return new Response(
        JSON.stringify({ error: 'Program not found or you do not have permission to assign it' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 2. Optional: Check if client is already assigned to a program
    // This is optional based on policy, but we'll implement it to check for existing assignments
    const { data: existingAssignments, error: assignmentCheckError } = await supabase
      .from('program_assignments')
      .select('id, program_id')
      .eq('user_id', client_id)
      .is('end_date', null) // Only check active assignments (no end date)

    if (assignmentCheckError) {
      console.error('Error checking existing assignments:', assignmentCheckError)
      // We'll continue despite the error, as this check is optional
    }

    // Log the existing assignments for debugging
    console.log('Existing assignments:', existingAssignments)

    // 3. Insert new program assignment
    const assignmentDate = start_date || new Date().toISOString().split('T')[0] // Use provided date or today
    
    const { data: assignment, error: assignmentError } = await supabase
      .from('program_assignments')
      .insert({
        program_id,
        user_id: client_id,
        assigned_by: coach_id,
        start_date: assignmentDate,
        end_date: null
      })
      .select()
      .single()

    if (assignmentError) {
      console.error('Assignment creation error:', assignmentError)
      return new Response(
        JSON.stringify({ error: 'Failed to create program assignment', details: assignmentError }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 4. Update the client's current program in client_workout_info
    // This is done via RPC function to handle the view/table implementation details
    const { error: updateError } = await supabase.rpc(
      'update_client_program',
      {
        user_id_param: client_id,
        program_id_param: program_id
      }
    )

    if (updateError) {
      console.error('Error updating client program:', updateError)
      // We'll continue despite the error, as the assignment was successful
    }

    // Get full program details (bonus)
    const { data: fullProgram, error: fullProgramError } = await supabase
      .from('workout_programs')
      .select(`
        id, 
        title,
        description,
        weeks,
        coach_id,
        created_at,
        workout_weeks (*)
      `)
      .eq('id', program_id)
      .single()

    if (fullProgramError) {
      console.log('Error fetching full program details:', fullProgramError)
      // Return just the basic assignment if full program fetch fails
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Program assigned successfully',
          assignment 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Return success with full program details
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Program assigned successfully',
        assignment,
        program: fullProgram
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}
