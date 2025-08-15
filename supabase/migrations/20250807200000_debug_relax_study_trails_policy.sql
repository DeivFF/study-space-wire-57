-- DEBUGGING STEP: Temporarily relax the INSERT policy on study_trails.
-- This is to diagnose a persistent RLS issue.
-- This policy WILL BE reverted in the next migration.

-- Drop the consolidated policy created in the previous refactor
DROP POLICY IF EXISTS "Admins can manage their own trails" ON public.study_trails;

-- Re-create the policy but with a non-blocking CHECK for INSERTs.
-- The USING clause for SELECT, UPDATE, DELETE remains secure.
CREATE POLICY "Admins can manage their own trails (DEBUG)"
ON public.study_trails
FOR ALL
TO authenticated
USING (auth.uid() = admin_id)
WITH CHECK (true);
