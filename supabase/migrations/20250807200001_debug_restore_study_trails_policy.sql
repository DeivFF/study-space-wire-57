-- DEBUGGING STEP: Restore the secure RLS policy on study_trails.
-- This reverts the temporary change from the previous migration.

-- Drop the temporary, insecure policy
DROP POLICY IF EXISTS "Admins can manage their own trails (DEBUG)" ON public.study_trails;

-- Re-create the original, secure, consolidated policy
CREATE POLICY "Admins can manage their own trails"
ON public.study_trails
FOR ALL
TO authenticated
USING (auth.uid() = admin_id)
WITH CHECK (auth.uid() = admin_id);
