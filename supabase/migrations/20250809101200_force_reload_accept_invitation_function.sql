-- This migration re-creates the accept_trail_invitation RPC function with a minor modification (a comment).
-- This is intended to change the function's hash and force Supabase to discard any stale cached versions of the function,
-- which is the suspected root cause of the "function not found" error.

DROP FUNCTION IF EXISTS public.accept_trail_invitation(uuid);
CREATE OR REPLACE FUNCTION public.accept_trail_invitation(p_invitation_id uuid)
RETURNS void AS $$
DECLARE
  v_trail_id uuid;
  v_invitee_id uuid;
BEGIN
  -- Force reload v2
  -- Get the invitation details
  SELECT trail_id, invitee_id INTO v_trail_id, v_invitee_id
  FROM public.trail_invitations
  WHERE id = p_invitation_id AND status = 'pending';

  -- Check if the current user is the invitee
  IF v_invitee_id IS NULL OR v_invitee_id != auth.uid() THEN
    RAISE EXCEPTION 'User does not have permission to accept this invitation or invitation is not valid.';
  END IF;

  -- Update the invitation status
  UPDATE public.trail_invitations
  SET status = 'accepted', updated_at = now()
  WHERE id = p_invitation_id;

  -- Insert the user into the trail_members table
  INSERT INTO public.trail_members (trail_id, user_id, role, status)
  VALUES (v_trail_id, v_invitee_id, 'member', 'active')
  ON CONFLICT (trail_id, user_id) DO NOTHING;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.accept_trail_invitation(uuid) TO authenticated;
