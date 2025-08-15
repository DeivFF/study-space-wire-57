CREATE POLICY "Users can create their own study rooms"
ON public.study_rooms FOR INSERT
WITH CHECK (auth.uid() = created_by);
