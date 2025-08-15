-- Drop old unique constraint and add partial unique index for pending requests
ALTER TABLE public.friend_requests DROP CONSTRAINT IF EXISTS friend_requests_sender_id_receiver_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS friend_requests_sender_receiver_pending_idx
  ON public.friend_requests (sender_id, receiver_id)
  WHERE status = 'pending';
