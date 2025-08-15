-- Fix the RLS policy for study_trails INSERT
-- Drop the existing INSERT policy and recreate it properly
DROP POLICY IF EXISTS "Users can create their own trails" ON public.study_trails;

-- Create a corrected INSERT policy
CREATE POLICY "Users can create their own trails" 
ON public.study_trails 
FOR INSERT 
WITH CHECK (auth.uid() = admin_id);