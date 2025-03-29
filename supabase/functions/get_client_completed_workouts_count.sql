
CREATE OR REPLACE FUNCTION public.get_client_completed_workouts_count(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count_val INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO count_val
  FROM public.workout_completions
  WHERE user_id = user_id_param
  AND completed_at IS NOT NULL;
  
  RETURN count_val;
END;
$$;
