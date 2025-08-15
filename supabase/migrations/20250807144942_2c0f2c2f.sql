-- Create tables for educational data sharing system

-- Main table to track shared content packages
CREATE TABLE public.shared_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'resumos', -- 'resumos', 'categories', 'lessons'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual items within each shared content package
CREATE TABLE public.shared_content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shared_content_id UUID NOT NULL REFERENCES public.shared_content(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'category', 'lesson', 'flashcard', 'note', 'document', 'question'
  item_id TEXT NOT NULL, -- Original item ID (can be UUID or string)
  item_data JSONB NOT NULL, -- Serialized item data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Share requests sent to specific users
CREATE TABLE public.content_share_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shared_content_id UUID NOT NULL REFERENCES public.shared_content(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  message TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Track what content users have imported to maintain independence
CREATE TABLE public.imported_content_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_shared_content_id UUID NOT NULL REFERENCES public.shared_content(id),
  imported_item_type TEXT NOT NULL,
  original_item_id TEXT NOT NULL,
  new_item_id TEXT NOT NULL, -- New ID in user's database
  imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.shared_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_share_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_content_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared_content
CREATE POLICY "Users can create their own shared content" 
ON public.shared_content 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view their own shared content" 
ON public.shared_content 
FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own shared content" 
ON public.shared_content 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own shared content" 
ON public.shared_content 
FOR DELETE 
USING (auth.uid() = owner_id);

-- RLS policies for shared_content_items
CREATE POLICY "Users can manage items of their shared content" 
ON public.shared_content_items 
FOR ALL 
USING (shared_content_id IN (
  SELECT id FROM public.shared_content WHERE owner_id = auth.uid()
));

-- RLS policies for content_share_requests
CREATE POLICY "Users can create share requests for their content" 
ON public.content_share_requests 
FOR INSERT 
WITH CHECK (shared_content_id IN (
  SELECT id FROM public.shared_content WHERE owner_id = auth.uid()
) AND auth.uid() = sender_id);

CREATE POLICY "Users can view share requests involving them" 
ON public.content_share_requests 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Recipients can update their share requests" 
ON public.content_share_requests 
FOR UPDATE 
USING (auth.uid() = recipient_id);

CREATE POLICY "Senders can view their sent requests" 
ON public.content_share_requests 
FOR SELECT 
USING (auth.uid() = sender_id);

-- RLS policies for imported_content_tracking
CREATE POLICY "Users can manage their imported content tracking" 
ON public.imported_content_tracking 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_shared_content_owner ON public.shared_content(owner_id);
CREATE INDEX idx_shared_content_items_shared_content ON public.shared_content_items(shared_content_id);
CREATE INDEX idx_content_share_requests_recipient ON public.content_share_requests(recipient_id);
CREATE INDEX idx_content_share_requests_sender ON public.content_share_requests(sender_id);
CREATE INDEX idx_imported_content_tracking_user ON public.imported_content_tracking(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_shared_content_updated_at
  BEFORE UPDATE ON public.shared_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_share_requests_updated_at
  BEFORE UPDATE ON public.content_share_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();