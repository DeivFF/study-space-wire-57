-- Fix infinite recursion in trail_members RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members of their trails" ON trail_members;

-- Create a security definer function to check trail membership
CREATE OR REPLACE FUNCTION public.is_trail_member(check_trail_id uuid, check_user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.trail_members 
    WHERE trail_id = check_trail_id 
    AND user_id = check_user_id 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new policy using the security definer function
CREATE POLICY "Users can view members of their trails" 
ON trail_members 
FOR SELECT 
USING (public.is_trail_member(trail_id, auth.uid()));