-- Create a new table for topics
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies to the topics table
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own topics"
ON topics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own topics"
ON topics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topics"
ON topics FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topics"
ON topics FOR DELETE
USING (auth.uid() = user_id);
