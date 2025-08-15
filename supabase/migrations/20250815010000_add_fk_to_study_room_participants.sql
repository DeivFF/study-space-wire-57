ALTER TABLE public.study_room_participants
  ADD CONSTRAINT study_room_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.study_room_participants
  ADD CONSTRAINT study_room_participants_room_id_fkey
  FOREIGN KEY (room_id) REFERENCES public.study_rooms(id) ON DELETE CASCADE;
