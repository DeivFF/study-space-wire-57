-- Fix the security definer function to have proper search path
CREATE OR REPLACE FUNCTION public.is_trail_member(check_trail_id uuid, check_user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.trail_members 
    WHERE trail_id = check_trail_id 
    AND user_id = check_user_id 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';