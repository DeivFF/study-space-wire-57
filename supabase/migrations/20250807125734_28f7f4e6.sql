-- Create friend requests table
CREATE TABLE public.friend_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Create friendships table
CREATE TABLE public.friendships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Ensure user1_id is always smaller to avoid duplicates
);

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Friend requests policies
CREATE POLICY "Users can view friend requests involving them" 
ON public.friend_requests 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests" 
ON public.friend_requests 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update friend requests they received" 
ON public.friend_requests 
FOR UPDATE 
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete friend requests they sent" 
ON public.friend_requests 
FOR DELETE 
USING (auth.uid() = sender_id);

-- Friendships policies
CREATE POLICY "Users can view their friendships" 
ON public.friendships 
FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create friendships" 
ON public.friendships 
FOR INSERT 
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete their friendships" 
ON public.friendships 
FOR DELETE 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create trigger for friend requests updates
CREATE TRIGGER update_friend_requests_updated_at
BEFORE UPDATE ON public.friend_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create friendship when request is accepted
CREATE OR REPLACE FUNCTION public.handle_accepted_friend_request()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the request was just accepted, create a friendship
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.friendships (user1_id, user2_id)
    VALUES (
      LEAST(NEW.sender_id, NEW.receiver_id),
      GREATEST(NEW.sender_id, NEW.receiver_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for accepted friend requests
CREATE TRIGGER on_friend_request_accepted
AFTER UPDATE ON public.friend_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_accepted_friend_request();