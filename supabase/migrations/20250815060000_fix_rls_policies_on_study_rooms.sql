-- Restore INSERT policy
DROP POLICY IF EXISTS "Users can create study rooms" ON public.study_rooms;
CREATE POLICY "Users can create study rooms"
  ON public.study_rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Update SELECT policy
DROP POLICY IF EXISTS "Participants can view their rooms" ON public.study_rooms;
CREATE POLICY "Participants can view their rooms"
  on public.study_rooms for select
  using (
    (auth.uid() = created_by) or
    (exists (select 1 from public.study_room_participants p where p.room_id = id and p.user_id = auth.uid()))
  );
