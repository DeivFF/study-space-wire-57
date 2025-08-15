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
