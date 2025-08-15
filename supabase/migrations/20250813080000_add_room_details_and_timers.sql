-- Add room metadata
alter table public.study_rooms
  add column if not exists name text not null default 'Sala',
  add column if not exists capacity integer not null default 1 check (capacity >= 1),
  add column if not exists visibility text not null default 'privada' check (visibility in ('privada','publica_amigos')),
  add column if not exists deleted_at timestamptz;

create index if not exists idx_study_rooms_deleted on public.study_rooms(deleted_at);

-- Track personal blocks
create table if not exists public.study_block_list (
  blocker_id uuid not null,
  blocked_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- Requests to enter public rooms
create table if not exists public.study_entry_requests (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  requester_id uuid not null,
  status text not null check (status in ('pendente','aprovada','recusada')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);
create unique index if not exists uniq_study_entry_request_pending
  on public.study_entry_requests(room_id, requester_id)
  where status = 'pendente';

-- Event log per room
create table if not exists public.study_room_events (
  id bigserial primary key,
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  event_id uuid not null,
  type text not null,
  payload jsonb,
  created_at timestamptz not null default now(),
  unique(event_id)
);
create index if not exists idx_study_room_events_room_created
  on public.study_room_events(room_id, created_at);

-- Per-user timers
create table if not exists public.study_room_timers (
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  user_id uuid not null,
  state text not null check (state in ('idle','running','paused')),
  started_at timestamptz,
  accumulated_ms bigint not null default 0,
  updated_at timestamptz not null default now(),
  event_id uuid not null,
  primary key (room_id, user_id),
  unique(event_id)
);
