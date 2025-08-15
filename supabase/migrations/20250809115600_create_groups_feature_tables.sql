-- Phase 1: Groups Feature - Database Schema

-- Step 1: Create the 'groups' table
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL CHECK (char_length(name) > 0),
    description TEXT,
    admin_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE SET NULL
);
COMMENT ON TABLE public.groups IS 'Stores information about study groups.';

-- Step 2: Create the 'group_members' table
CREATE TABLE public.group_members (
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);
COMMENT ON TABLE public.group_members IS 'Manages the relationship between users and groups.';

-- Step 3: Create indexes for performance
CREATE INDEX idx_groups_admin_id ON public.groups(admin_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);

-- Step 4: Create a helper function to check for group membership
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Set up Row Level Security (RLS)
-- Enable RLS for both tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'groups' table
CREATE POLICY "Allow members to view their own groups"
ON public.groups FOR SELECT
USING (public.is_group_member(id, auth.uid()));

CREATE POLICY "Allow users to create groups"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Allow admin to update their group"
ON public.groups FOR UPDATE
USING (auth.uid() = admin_id);

CREATE POLICY "Allow admin to delete their group"
ON public.groups FOR DELETE
USING (auth.uid() = admin_id);

-- RLS Policies for 'group_members' table
CREATE POLICY "Allow members to view other members of their groups"
ON public.group_members FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Allow admin to add new members to their group"
ON public.group_members FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.groups WHERE id = group_id AND admin_id = auth.uid()
));

CREATE POLICY "Allow admin to remove members from their group"
ON public.group_members FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.groups WHERE id = group_id AND admin_id = auth.uid()
));

CREATE POLICY "Allow members to leave a group"
ON public.group_members FOR DELETE
USING (user_id = auth.uid());


-- Step 6: Create a trigger to automatically add the creator as an admin member
CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.admin_id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_group_created
AFTER INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_group();
