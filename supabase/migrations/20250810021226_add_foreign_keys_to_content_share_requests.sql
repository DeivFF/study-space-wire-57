-- Add foreign key constraints to content_share_requests table

ALTER TABLE public.content_share_requests
ADD CONSTRAINT fk_sender_id
FOREIGN KEY (sender_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

ALTER TABLE public.content_share_requests
ADD CONSTRAINT fk_recipient_id
FOREIGN KEY (recipient_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;
