create or replace function public.leave_study_room(p_room_id uuid)
returns void as $$
begin
  update public.study_room_participants
  set
    is_active = false,
    left_at = now()
  where
    room_id = p_room_id and
    user_id = auth.uid() and
    is_active = true;
end;
$$ language plpgsql security definer set search_path = 'public';
