create or replace function public.force_leave_all_rooms()
returns void as $$
begin
  update public.study_room_participants
  set
    is_active = false,
    left_at = now()
  where
    user_id = auth.uid() and
    is_active = true;
end;
$$ language plpgsql security definer set search_path = 'public';
