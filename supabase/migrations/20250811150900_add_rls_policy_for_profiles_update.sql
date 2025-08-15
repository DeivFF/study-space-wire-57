-- Add RLS policy to allow users to select profiles
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Add RLS policy to allow users to update their own profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
