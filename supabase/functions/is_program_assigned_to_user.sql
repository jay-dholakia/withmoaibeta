
CREATE OR REPLACE FUNCTION public.is_program_assigned_to_user(
  program_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assignment_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM program_assignments 
    WHERE program_id = program_id_param AND user_id = user_id_param
  ) INTO assignment_exists;
  
  RETURN assignment_exists;
END;
$$;
