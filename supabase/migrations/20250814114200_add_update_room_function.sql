-- Function for an owner/admin to update room details.
CREATE OR REPLACE FUNCTION public.update_study_room(
    p_room_id uuid,
    p_name text,
    p_type text,
    p_description text DEFAULT NULL,
    p_topic text DEFAULT NULL,
    p_capacity integer DEFAULT 8
)
RETURNS void AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_user_role text;
BEGIN
    -- Check if the user has permission to update the room (must be owner or admin)
    SELECT role INTO v_user_role
    FROM public.study_room_participants
    WHERE room_id = p_room_id AND user_id = v_user_id AND is_active = true;

    IF v_user_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Only owners or admins can edit room details.' USING ERRCODE = '42501';
    END IF;

    -- Update the room details in the study_rooms table
    UPDATE public.study_rooms
    SET
        name = p_name,
        description = p_description,
        topic = p_topic,
        capacity = p_capacity,
        type = p_type
    WHERE id = p_room_id;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;
