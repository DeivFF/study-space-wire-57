-- Step 1: Add constraints to the participants table to enforce business rules.

-- This constraint ensures a user has only one record per room, which simplifies logic.
-- We can now use ON CONFLICT(room_id, user_id) reliably.
ALTER TABLE public.study_room_participants
ADD CONSTRAINT unique_user_per_room UNIQUE (user_id, room_id);

-- This partial unique index enforces the rule that a user can only be in ONE active room at a time.
-- This is a critical business rule.
CREATE UNIQUE INDEX idx_unique_active_user
ON public.study_room_participants (user_id)
WHERE (is_active = true);


-- Step 2: Create the RPC functions for room management.

-- Function to create a new study room and set the creator as the owner.
CREATE OR REPLACE FUNCTION public.create_study_room(
    p_name text,
    p_type text,
    p_description text DEFAULT NULL,
    p_topic text DEFAULT NULL,
    p_capacity integer DEFAULT 8
)
RETURNS uuid AS $$
DECLARE
    v_room_id uuid;
    v_creator_id uuid := auth.uid();
BEGIN
    -- Insert the new room and get its ID
    INSERT INTO public.study_rooms (name, description, topic, capacity, type, owner_id, created_by)
    VALUES (p_name, p_description, p_topic, p_capacity, p_type, v_creator_id, v_creator_id)
    RETURNING id INTO v_room_id;

    -- Add the creator as the first participant with the 'owner' role
    INSERT INTO public.study_room_participants (room_id, user_id, role, is_active)
    VALUES (v_room_id, v_creator_id, 'owner', true);

    RETURN v_room_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;


-- Function for a user to leave a study room.
CREATE OR REPLACE FUNCTION public.leave_study_room(p_room_id uuid)
RETURNS void AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_is_owner boolean;
    v_participant_count int;
    v_new_owner_id uuid;
BEGIN
    -- Check if the user is currently the owner
    SELECT owner_id = v_user_id INTO v_is_owner
    FROM public.study_rooms
    WHERE id = p_room_id;

    -- Mark the participant as inactive
    UPDATE public.study_room_participants
    SET is_active = false, left_at = now()
    WHERE room_id = p_room_id AND user_id = v_user_id;

    IF v_is_owner THEN
        -- If owner is leaving, attempt to transfer ownership
        SELECT COUNT(*) INTO v_participant_count FROM public.study_room_participants WHERE room_id = p_room_id AND is_active = true;

        IF v_participant_count > 0 THEN
            -- Transfer to the oldest active participant
            SELECT user_id INTO v_new_owner_id
            FROM public.study_room_participants
            WHERE room_id = p_room_id AND is_active = true
            ORDER BY joined_at ASC
            LIMIT 1;

            UPDATE public.study_rooms SET owner_id = v_new_owner_id WHERE id = p_room_id;
            UPDATE public.study_room_participants SET role = 'owner' WHERE room_id = p_room_id AND user_id = v_new_owner_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;


-- Function for an owner/admin to remove a user from a room.
CREATE OR REPLACE FUNCTION public.remove_from_room(p_room_id uuid, p_member_id uuid)
RETURNS void AS $$
DECLARE
    v_remover_role text;
    v_member_role text;
BEGIN
    SELECT role INTO v_remover_role FROM public.study_room_participants WHERE room_id = p_room_id AND user_id = auth.uid() AND is_active = true;
    SELECT role INTO v_member_role FROM public.study_room_participants WHERE room_id = p_room_id AND user_id = p_member_id AND is_active = true;

    IF v_remover_role IS NULL THEN RAISE EXCEPTION 'Action requires being in the room.' USING ERRCODE = '42501'; END IF;
    IF v_remover_role = 'member' THEN RAISE EXCEPTION 'Members cannot remove other participants.' USING ERRCODE = '42501'; END IF;
    IF v_remover_role = 'admin' AND v_member_role IN ('owner', 'admin') THEN RAISE EXCEPTION 'Admins cannot remove owners or other admins.' USING ERRCODE = '42501'; END IF;
    IF v_member_role = 'owner' THEN RAISE EXCEPTION 'The room owner cannot be removed.' USING ERRCODE = '42501'; END IF;

    UPDATE public.study_room_participants
    SET is_active = false, left_at = now()
    WHERE room_id = p_room_id AND user_id = p_member_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;


-- Function for an owner/admin to promote a member to admin.
CREATE OR REPLACE FUNCTION public.promote_to_admin(p_room_id uuid, p_member_id uuid)
RETURNS void AS $$
DECLARE
    v_promoter_role text;
BEGIN
    SELECT role INTO v_promoter_role FROM public.study_room_participants WHERE room_id = p_room_id AND user_id = auth.uid() AND is_active = true;

    IF v_promoter_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Only owners or admins can promote members.' USING ERRCODE = '42501';
    END IF;

    UPDATE public.study_room_participants
    SET role = 'admin'
    WHERE room_id = p_room_id AND user_id = p_member_id AND role = 'member';
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;
