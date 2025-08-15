-- Phase 1: Fix Friends System - Allow nickname search
-- Update profiles RLS policy to allow users to see nicknames for friend searches
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view nicknames for friend search" 
ON public.profiles 
FOR SELECT 
USING (nickname IS NOT NULL);

-- Phase 2: Study Trails Database Structure
-- Create study trails table
CREATE TABLE public.study_trails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  admin_id UUID NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on study_trails
ALTER TABLE public.study_trails ENABLE ROW LEVEL SECURITY;

-- Create trail members table
CREATE TABLE public.trail_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID NOT NULL REFERENCES public.study_trails(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trail_id, user_id)
);

-- Enable RLS on trail_members
ALTER TABLE public.trail_members ENABLE ROW LEVEL SECURITY;

-- Create trail invitations table
CREATE TABLE public.trail_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID NOT NULL REFERENCES public.study_trails(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trail_id, invitee_id)
);

-- Enable RLS on trail_invitations
ALTER TABLE public.trail_invitations ENABLE ROW LEVEL SECURITY;

-- Create trail content table
CREATE TABLE public.trail_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trail_id UUID NOT NULL REFERENCES public.study_trails(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('lesson', 'document', 'question', 'note')),
  content_id TEXT NOT NULL,
  title TEXT NOT NULL,
  added_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on trail_content
ALTER TABLE public.trail_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_trails
CREATE POLICY "Users can view trails they are members of"
ON public.study_trails
FOR SELECT
USING (
  id IN (
    SELECT trail_id FROM public.trail_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Users can create their own trails"
ON public.study_trails
FOR INSERT
WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update their trails"
ON public.study_trails
FOR UPDATE
USING (auth.uid() = admin_id);

CREATE POLICY "Admins can delete their trails"
ON public.study_trails
FOR DELETE
USING (auth.uid() = admin_id);

-- RLS Policies for trail_members
CREATE POLICY "Users can view members of their trails"
ON public.trail_members
FOR SELECT
USING (
  trail_id IN (
    SELECT trail_id FROM public.trail_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Trail admins can manage members"
ON public.trail_members
FOR ALL
USING (
  trail_id IN (
    SELECT id FROM public.study_trails 
    WHERE admin_id = auth.uid()
  )
);

CREATE POLICY "Users can leave trails"
ON public.trail_members
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for trail_invitations
CREATE POLICY "Users can view invitations involving them"
ON public.trail_invitations
FOR SELECT
USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Trail admins can send invitations"
ON public.trail_invitations
FOR INSERT
WITH CHECK (
  trail_id IN (
    SELECT id FROM public.study_trails 
    WHERE admin_id = auth.uid()
  )
);

CREATE POLICY "Invitees can update their invitations"
ON public.trail_invitations
FOR UPDATE
USING (auth.uid() = invitee_id);

-- RLS Policies for trail_content
CREATE POLICY "Trail members can view content"
ON public.trail_content
FOR SELECT
USING (
  trail_id IN (
    SELECT trail_id FROM public.trail_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Trail members can add content"
ON public.trail_content
FOR INSERT
WITH CHECK (
  auth.uid() = added_by AND
  trail_id IN (
    SELECT trail_id FROM public.trail_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Content creators can update their content"
ON public.trail_content
FOR UPDATE
USING (auth.uid() = added_by);

CREATE POLICY "Content creators and trail admins can delete content"
ON public.trail_content
FOR DELETE
USING (
  auth.uid() = added_by OR
  trail_id IN (
    SELECT id FROM public.study_trails 
    WHERE admin_id = auth.uid()
  )
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_study_trails_updated_at
BEFORE UPDATE ON public.study_trails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trail_invitations_updated_at
BEFORE UPDATE ON public.trail_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically add admin as member when creating trail
CREATE OR REPLACE FUNCTION public.add_trail_admin_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.trail_members (trail_id, user_id, role, status)
  VALUES (NEW.id, NEW.admin_id, 'admin', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_trail_admin_as_member_trigger
AFTER INSERT ON public.study_trails
FOR EACH ROW
EXECUTE FUNCTION public.add_trail_admin_as_member();

-- Function to handle accepted trail invitations
CREATE OR REPLACE FUNCTION public.handle_accepted_trail_invitation()
RETURNS TRIGGER AS $$
BEGIN
  -- If the invitation was just accepted, add user as trail member
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.trail_members (trail_id, user_id, role, status)
    VALUES (NEW.trail_id, NEW.invitee_id, 'member', 'active')
    ON CONFLICT (trail_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_accepted_trail_invitation_trigger
AFTER UPDATE ON public.trail_invitations
FOR EACH ROW
EXECUTE FUNCTION public.handle_accepted_trail_invitation();