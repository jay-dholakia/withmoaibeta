
-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.client_workout_info;

-- Create an updated view that only counts completed workouts
CREATE OR REPLACE VIEW public.client_workout_info AS
SELECT 
  p.id AS user_id,
  p.user_type,
  COALESCE(
    (SELECT program_id 
     FROM program_assignments 
     WHERE user_id = p.id 
     AND (end_date IS NULL OR end_date >= CURRENT_DATE)
     ORDER BY start_date DESC 
     LIMIT 1),
    NULL
  ) AS current_program_id,
  (SELECT MAX(completed_at) 
   FROM workout_completions 
   WHERE user_id = p.id
   AND completed_at IS NOT NULL) AS last_workout_at,
  (SELECT COUNT(*) 
   FROM workout_completions 
   WHERE user_id = p.id
   AND completed_at IS NOT NULL) AS total_workouts_completed
FROM 
  public.profiles p
WHERE 
  p.user_type = 'client';
