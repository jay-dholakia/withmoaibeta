
-- Create a table to track invitation usage without invalidating shareable links
CREATE TABLE IF NOT EXISTS public.invitation_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS invitation_usage_invitation_id_idx ON public.invitation_usage(invitation_id);
CREATE INDEX IF NOT EXISTS invitation_usage_user_email_idx ON public.invitation_usage(user_email);

-- Set up Row Level Security
ALTER TABLE public.invitation_usage ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all usage
CREATE POLICY "Admins can view all invitation usage" 
ON public.invitation_usage 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Create policy for admins to insert usage records
CREATE POLICY "Admins can insert invitation usage" 
ON public.invitation_usage 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Allow public access for registration process
CREATE POLICY "Anyone can track their own invitation usage" 
ON public.invitation_usage 
FOR INSERT 
WITH CHECK (true);
