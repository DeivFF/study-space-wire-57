-- Step 1: Create the trail_messages table
CREATE TABLE public.trail_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trail_id UUID NOT NULL REFERENCES public.trails(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_trail_messages_trail_id ON public.trail_messages(trail_id);
CREATE INDEX idx_trail_messages_user_id ON public.trail_messages(user_id);

-- Step 2: Create a helper function to check for trail membership
CREATE OR REPLACE FUNCTION public.is_trail_member(p_trail_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.trail_members
    WHERE trail_id = p_trail_id AND user_id = auth.uid() AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Enable Row Level Security (RLS) on the table
ALTER TABLE public.trail_messages ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
-- Policy 1: Members can read messages in their trails
CREATE POLICY "Allow members to read messages in their trails"
ON public.trail_messages
FOR SELECT
USING (public.is_trail_member(trail_id));

-- Policy 2: Members can insert messages in their trails
CREATE POLICY "Allow members to insert messages in their trails"
ON public.trail_messages
FOR INSERT
WITH CHECK (public.is_trail_member(trail_id) AND user_id = auth.uid());

-- Note: We are not creating policies for UPDATE or DELETE to keep the chat history immutable for now.

-- Step 5: Add table to the Supabase Realtime publication
-- This ensures that clients can subscribe to changes on this table.
-- First, drop the publication if it exists (to be safe)
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create the publication for all tables
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- The above command is simpler and more robust than adding tables one by one.
-- However, if a more granular approach is needed, one would use:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.trail_messages;
