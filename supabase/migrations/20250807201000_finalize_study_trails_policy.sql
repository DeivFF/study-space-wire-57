-- Finalize the RLS policy for study_trails to ensure a clean, secure state.

-- Drop all previous versions of policies on study_trails to be safe
DROP POLICY IF EXISTS "Admins can manage their own trails (DEBUG)" ON public.study_trails;
DROP POLICY IF EXISTS "Admins can manage their own trails" ON public.study_trails;
DROP POLICY IF EXISTS "Users can create their own trails" ON public.study_trails;
DROP POLICY IF EXISTS "Admins can update their trails" ON public.study_trails;
DROP POLICY IF EXISTS "Admins can delete their trails" ON public.study_trails;

-- Re-create the single, consolidated, and secure policy for admin actions.
-- This policy handles INSERT, UPDATE, DELETE, and SELECT for the trail admin.
CREATE POLICY "Admins can manage their own trails"
ON public.study_trails
FOR ALL
TO authenticated
USING (auth.uid() = admin_id)
WITH CHECK (auth.uid() = admin_id);
