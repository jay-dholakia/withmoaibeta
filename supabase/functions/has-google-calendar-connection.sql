
-- Function to check if a user has a Google Calendar connection
CREATE OR REPLACE FUNCTION public.has_google_calendar_connection(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM google_calendar_tokens 
    WHERE user_id = user_id_param
  );
$$;
