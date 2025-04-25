
-- Create function to create client_profiles table if it doesn't exist
CREATE OR REPLACE FUNCTION create_client_profiles_table()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'client_profiles'
  ) THEN
    -- Create the table
    CREATE TABLE public.client_profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      first_name TEXT,
      last_name TEXT,
      city TEXT,
      state TEXT,
      birthday DATE,
      height TEXT,
      weight TEXT,
      avatar_url TEXT,
      fitness_goals TEXT[],
      favorite_movements TEXT[],
      profile_completed BOOLEAN DEFAULT FALSE,
      vacation_mode BOOLEAN DEFAULT FALSE, // Added default false for vacation mode
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add RLS policies
    ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Users can view their own profile"
      ON public.client_profiles
      FOR SELECT
      USING (auth.uid() = id);

    CREATE POLICY "Users can update their own profile"
      ON public.client_profiles
      FOR UPDATE
      USING (auth.uid() = id);

    CREATE POLICY "Users can insert their own profile"
      ON public.client_profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);

    -- Allow admins and coaches to view all profiles
    CREATE POLICY "Admins and coaches can view all profiles"
      ON public.client_profiles
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND user_type IN ('admin', 'coach')
        )
      );

    RETURN TRUE;
  ELSE
    RETURN TRUE; -- Table already exists
  END IF;
END;
$$;
