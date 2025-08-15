-- Fix security warnings - Set search_path for all functions
DROP FUNCTION IF EXISTS public.add_trail_admin_as_member();
DROP FUNCTION IF EXISTS public.handle_accepted_trail_invitation();

-- Recreate functions with proper security settings
CREATE OR REPLACE FUNCTION public.add_trail_admin_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.trail_members (trail_id, user_id, role, status)
  VALUES (NEW.id, NEW.admin_id, 'admin', 'active');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_accepted_trail_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If the invitation was just accepted, add user as trail member
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.trail_members (trail_id, user_id, role, status)
    VALUES (NEW.trail_id, NEW.invitee_id, 'member', 'active')
    ON CONFLICT (trail_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix existing functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;