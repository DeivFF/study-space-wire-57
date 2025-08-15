create or replace function public.leave_study_room(p_room_id uuid)
returns void as $$
begin
  if auth.uid() is null then
    raise exception 'User not authenticated';
  end if;

  update public.study_room_participants
  set
    is_active = false,
    left_at = now()
  where
    room_id = p_room_id and
    user_id = auth.uid();

  if not exists (
    select 1 from public.study_room_participants
    where room_id = p_room_id and is_active = true
  ) then
    delete from public.study_rooms where id = p_room_id;
  end if;
end;
$$ language plpgsql security definer set search_path = 'public';

create or replace function public.force_leave_all_rooms()
returns void as $$
declare
  r record;
begin
  for r in
    select room_id from public.study_room_participants
    where user_id = auth.uid() and is_active = true
  loop
    perform public.leave_study_room(r.room_id);
  end loop;
end;
$$ language plpgsql security definer set search_path = 'public';
