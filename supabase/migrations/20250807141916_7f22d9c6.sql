-- Fix infinite recursion in study_trails RLS policy
-- Drop the problematic policy and create a simpler one
DROP POLICY IF EXISTS "Users can view trails they are members of" ON study_trails;

-- Create a simple policy for viewing trails
CREATE POLICY "Users can view trails they are members of" 
ON study_trails 
FOR SELECT 
USING (public.is_trail_member(id, auth.uid()));