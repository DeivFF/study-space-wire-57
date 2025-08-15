-- Drop the redundant SELECT policy on content_share_requests
DROP POLICY IF EXISTS "Senders can view their sent requests" ON public.content_share_requests;

-- Drop the old restrictive SELECT policy on shared_content
DROP POLICY IF EXISTS "Users can view their own shared content" ON public.shared_content;

-- Create a new, more comprehensive SELECT policy on shared_content.
-- This allows owners to view their content, and also allows users who have received a share request
-- for a piece of content to view its details.
CREATE POLICY "Users can view content they own or have received requests for"
ON public.shared_content
FOR SELECT
USING (
  (auth.uid() = owner_id) OR
  (EXISTS (
    SELECT 1
    FROM public.content_share_requests
    WHERE
      public.content_share_requests.shared_content_id = public.shared_content.id AND
      public.content_share_requests.recipient_id = auth.uid()
  ))
);
