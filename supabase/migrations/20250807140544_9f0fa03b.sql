-- Add missing trigger to automatically add trail admin as member when creating a trail
CREATE TRIGGER add_trail_admin_as_member_trigger
  AFTER INSERT ON public.study_trails
  FOR EACH ROW
  EXECUTE FUNCTION public.add_trail_admin_as_member();