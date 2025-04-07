
CREATE OR REPLACE FUNCTION public.count_workouts_for_user_and_week(user_id_param uuid, week_number_param integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  workout_count INTEGER;
BEGIN
  -- Get count of workouts matching the week number for the user's assigned programs
  SELECT COUNT(w.id)
  INTO workout_count
  FROM workouts w
  JOIN workout_weeks ww ON w.week_id = ww.id
  JOIN program_assignments pa ON ww.program_id = pa.program_id
  WHERE pa.user_id = user_id_param
    AND ww.week_number = week_number_param;
  
  RETURN COALESCE(workout_count, 6);  -- Default to 6 if no count is found
END;
$function$;
