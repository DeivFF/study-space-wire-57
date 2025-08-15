CREATE OR REPLACE FUNCTION public.clone_content_rpc(
  p_shared_content_id uuid
)
RETURNS void AS $$
BEGIN
  -- Call the existing clone function, passing the recipient ID from the session
  PERFORM public.clone_shared_content(p_shared_content_id, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
