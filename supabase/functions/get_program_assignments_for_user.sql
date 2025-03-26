
CREATE OR REPLACE FUNCTION public.get_program_assignments_for_user(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  program_id UUID,
  start_date DATE,
  end_date DATE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id,
    pa.program_id,
    pa.start_date,
    pa.end_date
  FROM 
    public.program_assignments pa
  WHERE 
    pa.user_id = user_id_param;
END;
$$;
