-- Add unique constraint to study_room_participants
alter table public.study_room_participants
add constraint unique_room_user unique (room_id, user_id);

-- Create function to join a room (upsert logic)
create or replace function public.join_room(p_room_id uuid, p_user_id uuid)
returns void as $$
begin
  insert into public.study_room_participants (room_id, user_id, is_active)
  values (p_room_id, p_user_id, true)
  on conflict (room_id, user_id) do update
  set is_active = true, left_at = null;
end;
$$ language plpgsql;
