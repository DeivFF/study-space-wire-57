-- Create study_rooms table
create table if not exists public.study_rooms (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null,
  created_at timestamptz not null default now()
);

alter table public.study_rooms enable row level security;

-- Create study_room_participants table
create table if not exists public.study_room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  user_id uuid not null,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  is_active boolean not null default true
);

alter table public.study_room_participants enable row level security;

DROP POLICY IF EXISTS "Participants can view their rooms" ON public.study_rooms;
create policy "Participants can view their rooms"
  on public.study_rooms for select
  using (exists (select 1 from public.study_room_participants p where p.room_id = id and p.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their participant rows" ON public.study_room_participants;
create policy "Users can manage their participant rows"
  on public.study_room_participants for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
