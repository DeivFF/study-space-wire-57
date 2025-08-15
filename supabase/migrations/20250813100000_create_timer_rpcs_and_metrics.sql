-- Create timer management RPCs and daily metrics view

-- timer_start: start or resume the user's timer in a room
create or replace function public.timer_start(
  p_room_id uuid,
  p_event_id uuid default gen_random_uuid()
)
returns void as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'User not authenticated';
  end if;

  insert into public.study_room_events(room_id, event_id, type, payload)
  values (p_room_id, p_event_id, 'timer_start', jsonb_build_object('user_id', v_user_id));

  insert into public.study_room_timers(room_id, user_id, state, started_at, accumulated_ms, updated_at, event_id)
  values (p_room_id, v_user_id, 'running', now(), 0, now(), p_event_id)
  on conflict (room_id, user_id) do update
    set state = 'running',
        started_at = now(),
        updated_at = now(),
        event_id = p_event_id;
end;
$$ language plpgsql security definer set search_path = 'public';

-- timer_pause: pause running timer and accumulate elapsed time
create or replace function public.timer_pause(
  p_room_id uuid,
  p_event_id uuid default gen_random_uuid()
)
returns void as $$
declare
  v_user_id uuid := auth.uid();
  v_timer public.study_room_timers;
  v_elapsed_ms bigint;
begin
  if v_user_id is null then
    raise exception 'User not authenticated';
  end if;

  select * into v_timer
  from public.study_room_timers
  where room_id = p_room_id and user_id = v_user_id
  for update;

  if v_timer.state <> 'running' then
    return;
  end if;

  v_elapsed_ms := extract(epoch from (now() - v_timer.started_at)) * 1000;

  insert into public.study_room_events(room_id, event_id, type, payload)
  values (
    p_room_id,
    p_event_id,
    'timer_pause',
    jsonb_build_object('user_id', v_user_id, 'elapsed_ms', v_elapsed_ms)
  );

  update public.study_room_timers
  set state = 'paused',
      started_at = null,
      accumulated_ms = v_timer.accumulated_ms + v_elapsed_ms,
      updated_at = now(),
      event_id = p_event_id
  where room_id = p_room_id and user_id = v_user_id;
end;
$$ language plpgsql security definer set search_path = 'public';

-- timer_reset: clear timer to zero
create or replace function public.timer_reset(
  p_room_id uuid,
  p_event_id uuid default gen_random_uuid()
)
returns void as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'User not authenticated';
  end if;

  insert into public.study_room_events(room_id, event_id, type, payload)
  values (p_room_id, p_event_id, 'timer_reset', jsonb_build_object('user_id', v_user_id));

  insert into public.study_room_timers(room_id, user_id, state, started_at, accumulated_ms, updated_at, event_id)
  values (p_room_id, v_user_id, 'idle', null, 0, now(), p_event_id)
  on conflict (room_id, user_id) do update
    set state = 'idle',
        started_at = null,
        accumulated_ms = 0,
        updated_at = now(),
        event_id = p_event_id;
end;
$$ language plpgsql security definer set search_path = 'public';

-- Daily metrics aggregated per room and user
create or replace view public.study_room_daily_metrics as
select
  e.room_id,
  (e.payload ->> 'user_id')::uuid as user_id,
  e.created_at::date as day,
  sum((e.payload ->> 'elapsed_ms')::bigint) as total_ms
from public.study_room_events e
where e.type = 'timer_pause'
group by e.room_id, user_id, day;
