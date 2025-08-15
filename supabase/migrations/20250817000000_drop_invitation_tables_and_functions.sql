-- Clean up invitation-related tables, functions, triggers, and policies

-- Drop row-level security policies on invitation tables if they exist
do $$
declare r record; begin
  for r in select schemaname, tablename, polname from pg_policies where schemaname = 'public' and tablename in ('study_invitations','study_room_invitations','study_invite_refusals') loop
    execute format('drop policy %I on public.%I', r.polname, r.tablename);
  end loop;
end $$;

-- Drop triggers on invitation tables if they exist
do $$
declare r record; begin
  for r in select trigger_name, event_object_table from information_schema.triggers where event_object_schema = 'public' and event_object_table in ('study_invitations','study_room_invitations','study_invite_refusals') loop
    execute format('drop trigger if exists %I on public.%I', r.trigger_name, r.event_object_table);
  end loop;
end $$;

-- Drop tables
DROP TABLE IF EXISTS public.study_room_invitations CASCADE;
DROP TABLE IF EXISTS public.study_invitations CASCADE;
DROP TABLE IF EXISTS public.study_invite_refusals CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.send_invites(uuid, uuid[]);
DROP FUNCTION IF EXISTS public.accept_invite(uuid);
DROP FUNCTION IF EXISTS public.enter_room(uuid);
DROP FUNCTION IF EXISTS public.invite_to_study_room(uuid, uuid);
DROP FUNCTION IF EXISTS public.accept_study_invitation(uuid);
DROP FUNCTION IF EXISTS public.decline_study_invitation(uuid);
DROP FUNCTION IF EXISTS public.expire_old_invitations();
DROP FUNCTION IF EXISTS public.create_room_and_invite_friends(uuid[]);
DROP FUNCTION IF EXISTS public.create_room_and_invite_friends(text, text, uuid[]);
DROP FUNCTION IF EXISTS public.cancel_invite(uuid, uuid);
