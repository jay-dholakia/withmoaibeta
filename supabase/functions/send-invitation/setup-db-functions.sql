
-- Function to check if a column is nullable
CREATE OR REPLACE FUNCTION public.check_column_nullable(table_name text, column_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'is_nullable', CASE WHEN is_nullable = 'YES' THEN true ELSE false END
  ) INTO result
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = check_column_nullable.table_name
    AND column_name = check_column_nullable.column_name;
  
  RETURN result;
END;
$$;

-- Function to make a column nullable
CREATE OR REPLACE FUNCTION public.make_column_nullable(table_name text, column_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL', table_name, column_name);
  RETURN true;
EXCEPTION WHEN others THEN
  RAISE EXCEPTION 'Error making column nullable: %', SQLERRM;
END;
$$;
