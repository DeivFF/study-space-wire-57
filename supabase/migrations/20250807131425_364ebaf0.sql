-- Add unique constraint to nickname column in profiles table
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_nickname_unique UNIQUE (nickname);