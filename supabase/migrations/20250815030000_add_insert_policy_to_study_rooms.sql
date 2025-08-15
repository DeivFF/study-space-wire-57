DROP POLICY IF EXISTS "Users can create study rooms" ON public.study_rooms;
CREATE POLICY "Users can create study rooms"
  ON public.study_rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);
