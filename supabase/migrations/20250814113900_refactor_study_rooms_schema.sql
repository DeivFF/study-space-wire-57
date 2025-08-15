-- Step 1: Add a 'role' to the participants table.
-- Using TEXT with a CHECK constraint for flexibility.
ALTER TABLE public.study_room_participants
ADD COLUMN role TEXT CHECK (role IN ('owner', 'admin', 'member')) NOT NULL DEFAULT 'member';

-- Step 2: Enhance the study_rooms table with new fields.
-- Keep 'created_by' for auditing, but add a dedicated 'owner_id' for active ownership.
ALTER TABLE public.study_rooms
ADD COLUMN name TEXT,
ADD COLUMN description TEXT,
ADD COLUMN topic TEXT,
ADD COLUMN capacity INTEGER NOT NULL DEFAULT 8,
ADD COLUMN type TEXT CHECK (type IN ('public', 'private')) NOT NULL DEFAULT 'private',
ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill the new columns for existing rooms to avoid breaking them.
UPDATE public.study_rooms SET name = 'Sala Antiga' WHERE name IS NULL;
UPDATE public.study_rooms SET owner_id = created_by;

-- Now that owner_id is backfilled, enforce NOT NULL.
ALTER TABLE public.study_rooms
ALTER COLUMN owner_id SET NOT NULL;

-- Make the name column NOT NULL after backfilling.
ALTER TABLE public.study_rooms
ALTER COLUMN name SET NOT NULL;

-- Backfill the 'owner' role for all room creators/owners.
UPDATE public.study_room_participants p
SET role = 'owner'
FROM public.study_rooms r
WHERE p.room_id = r.id AND p.user_id = r.owner_id AND p.role != 'owner';

-- Step 3: Drop the old invitation system.
-- It's based on a flawed model (new room per invite) and it's cleaner to replace it entirely.
DROP FUNCTION IF EXISTS public.accept_study_invitation(uuid);
DROP FUNCTION IF EXISTS public.decline_study_invitation(uuid);
DROP TABLE IF EXISTS public.study_invitations;
DROP TABLE IF EXISTS public.study_invite_refusals; -- This was part of the old system too.

-- Step 6: Update RLS policies for study_rooms to allow public access.
-- First, drop the old, more restrictive policy.
DROP POLICY IF EXISTS "Participants can view their rooms" ON public.study_rooms;

-- Create a new policy that allows viewing public rooms OR rooms where the user is a participant.
CREATE POLICY "Users can view public rooms or their own private rooms"
ON public.study_rooms FOR SELECT
USING (
    type = 'public' OR
    EXISTS (
        SELECT 1 FROM public.study_room_participants p
        WHERE p.room_id = study_rooms.id
        AND p.user_id = auth.uid()
    )
);

-- Policy: Allow room owners to update their room details.
CREATE POLICY "Owners can update their own rooms"
ON public.study_rooms FOR UPDATE
USING (owner_id = auth.uid());
