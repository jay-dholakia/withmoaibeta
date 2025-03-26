
-- Create a function to get program assignments using a raw query
CREATE OR REPLACE FUNCTION public.get_raw_program_assignments(user_id_param UUID)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', id,
      'program_id', program_id,
      'user_id', user_id,
      'start_date', start_date,
      'end_date', end_date
    )
  FROM 
    public.program_assignments
  WHERE 
    user_id = user_id_param;
END;
$$;
