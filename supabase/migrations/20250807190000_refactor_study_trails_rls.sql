-- Drop the old, separate policies for study_trails admin actions
DROP POLICY IF EXISTS "Users can create their own trails" ON public.study_trails;
DROP POLICY IF EXISTS "Admins can update their trails" ON public.study_trails;
DROP POLICY IF EXISTS "Admins can delete their trails" ON public.study_trails;

-- Create a new, consolidated policy for admin actions on their own trails.
-- This single policy handles INSERT, UPDATE, DELETE, and SELECT for the trail admin.
-- The existing SELECT policy for members will be combined with this via OR.
CREATE POLICY "Admins can manage their own trails"
ON public.study_trails
FOR ALL
TO authenticated
USING (auth.uid() = admin_id)
WITH CHECK (auth.uid() = admin_id);
