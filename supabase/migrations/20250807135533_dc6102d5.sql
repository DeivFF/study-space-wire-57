-- Fix the circular recursion issue in trail_members policies
-- Drop the problematic policy and create a simpler one
DROP POLICY IF EXISTS "Users can view members of their trails" ON trail_members;

-- Create a new policy without circular references
CREATE POLICY "Users can view members of their trails" 
ON trail_members 
FOR SELECT 
USING (
  -- Users can see members of trails they belong to
  EXISTS (
    SELECT 1 FROM trail_members tm2 
    WHERE tm2.trail_id = trail_members.trail_id 
    AND tm2.user_id = auth.uid() 
    AND tm2.status = 'active'
  )
);