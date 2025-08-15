-- Step 1: Add a 'role' to the participants table.
-- Using TEXT with a CHECK constraint for flexibility.
ALTER TABLE public.study_room_participants
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('owner', 'admin', 'member')) NOT NULL DEFAULT 'member';

-- Backfill the 'owner' role for all room creators/owners.
UPDATE public.study_room_participants p
SET role = 'owner'
FROM public.study_rooms r
WHERE p.room_id = r.id AND p.user_id = r.owner_id AND p.role != 'owner';
