-- Drop the trigger that automatically adds a user to trail_members on invitation accept.
-- This logic is now handled by the `accept_trail_invitation` RPC function to prevent race conditions.
DROP TRIGGER IF EXISTS handle_accepted_trail_invitation_trigger ON public.trail_invitations;
