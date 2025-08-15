-- Creates a function to fetch public profile information for a given list of user IDs.
-- This is used to display friend information.
CREATE OR REPLACE FUNCTION public.get_public_profiles_for_friends(p_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  nickname text,
  avatar_url text
)
AS $$
BEGIN
  RETURN QUERY
  SELECT p.user_id, p.nickname, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = ANY(p_user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
