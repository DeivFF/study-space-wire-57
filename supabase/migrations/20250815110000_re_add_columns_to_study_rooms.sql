-- Step 2: Enhance the study_rooms table with new fields.
-- Keep 'created_by' for auditing, but add a dedicated 'owner_id' for active ownership.
ALTER TABLE public.study_rooms
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 8,
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('public', 'private')) NOT NULL DEFAULT 'private',
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill the new columns for existing rooms to avoid breaking them.
UPDATE public.study_rooms SET name = 'Sala Antiga' WHERE name IS NULL;
UPDATE public.study_rooms SET owner_id = created_by WHERE owner_id IS NULL;

-- Now that owner_id is backfilled, enforce NOT NULL.
ALTER TABLE public.study_rooms
ALTER COLUMN owner_id SET NOT NULL;

-- Make the name column NOT NULL after backfilling.
ALTER TABLE public.study_rooms
ALTER COLUMN name SET NOT NULL;
