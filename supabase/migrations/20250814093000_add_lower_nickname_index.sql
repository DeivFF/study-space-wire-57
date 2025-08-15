-- Create index to support case-insensitive nickname lookups
CREATE INDEX IF NOT EXISTS idx_profiles_lower_nickname ON public.profiles (lower(nickname));
