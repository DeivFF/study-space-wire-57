-- Step 1: Create the 'notifications' table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 'Stores user notifications for various events like friend requests, trail invites, etc.';
COMMENT ON COLUMN public.notifications.user_id IS 'The user who should receive the notification.';
COMMENT ON COLUMN public.notifications.type IS 'The type of notification (e.g., ''friend_request'', ''trail_invitation'', ''content_share'').';
COMMENT ON COLUMN public.notifications.data IS 'JSON object containing context-specific data, like sender_id, trail_id, etc.';

-- Step 2: Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Allow users to access their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to mark their own notifications as read"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Note: INSERT permissions should be handled by SECURITY DEFINER functions, not granted to users directly.
-- This ensures that notifications can only be created by trusted server-side logic (or other RPC functions).
