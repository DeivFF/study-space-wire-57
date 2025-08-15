-- Purpose: Add user tracking and security to question annotations.
--
-- This migration introduces a `user_id` column to the `annotation_questions` table,
-- linking each annotation to the user who created it. It also enables and configures
-- Row-Level Security (RLS) to ensure that users can only view and manage their own
-- annotations, enhancing data privacy and security.

-- Step 1: Add the user_id column to the annotation_questions table.
-- The column is made nullable to prevent errors on existing data.
-- A foreign key constraint is added to link to the auth.users table,
-- and ON DELETE CASCADE ensures that if a user is deleted, their annotations are also removed.
ALTER TABLE public.annotation_questions
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Enable Row-Level Security on the table.
-- This is a prerequisite for creating security policies.
ALTER TABLE public.annotation_questions ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies to restrict access.

-- Policy for SELECT: Users can only see their own annotations.
CREATE POLICY "Allow users to view their own annotations"
ON public.annotation_questions FOR SELECT
USING (auth.uid() = user_id);

-- Policy for INSERT: Users can only create annotations for themselves.
-- The `WITH CHECK` clause ensures new rows match this condition.
CREATE POLICY "Allow users to create their own annotations"
ON public.annotation_questions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can only modify their own annotations.
CREATE POLICY "Allow users to update their own annotations"
ON public.annotation_questions FOR UPDATE
USING (auth.uid() = user_id);

-- Policy for DELETE: Users can only remove their own annotations.
CREATE POLICY "Allow users to delete their own annotations"
ON public.annotation_questions FOR DELETE
USING (auth.uid() = user_id);

-- Granting permissions for these operations to authenticated users.
-- This is often handled by default roles, but explicit grants are safer.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.annotation_questions TO authenticated;
