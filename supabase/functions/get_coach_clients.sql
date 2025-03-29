
CREATE OR REPLACE FUNCTION public.get_coach_clients(coach_id uuid)
 RETURNS TABLE(id uuid, email text, user_type text, last_workout_at timestamp with time zone, total_workouts_completed bigint, current_program_id uuid, current_program_title text, days_since_last_workout integer, group_ids uuid[])
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    (SELECT au.email FROM auth.users au WHERE au.id = p.id) AS email,
    p.user_type,
    cwi.last_workout_at,
    cwi.total_workouts_completed,
    cwi.current_program_id,
    wp.title AS current_program_title,
    CASE 
      WHEN cwi.last_workout_at IS NOT NULL THEN 
        EXTRACT(DAY FROM (NOW() - cwi.last_workout_at))::INTEGER
      ELSE NULL
    END AS days_since_last_workout,
    ARRAY(
      SELECT gm.group_id
      FROM public.group_members gm
      WHERE gm.user_id = p.id
    ) AS group_ids
  FROM 
    public.profiles p
    JOIN public.client_workout_info cwi ON p.id = cwi.user_id
    LEFT JOIN public.workout_programs wp ON cwi.current_program_id = wp.id
  WHERE 
    p.user_type = 'client'
    AND EXISTS (
      SELECT 1
      FROM public.group_coaches gc
      JOIN public.group_members gm ON gc.group_id = gm.group_id
      WHERE gc.coach_id = get_coach_clients.coach_id
      AND gm.user_id = p.id
    );
END;
$function$;
