-- Function for a user to join a public study room directly
CREATE OR REPLACE FUNCTION public.join_public_room(
    p_room_id uuid
)
RETURNS void AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_room_type text;
    v_room_capacity int;
    v_current_participants int;
BEGIN
    -- Lock the room row to prevent race conditions on joining
    PERFORM * FROM public.study_rooms WHERE id = p_room_id FOR UPDATE;

    -- Validate the room
    SELECT type, capacity INTO v_room_type, v_room_capacity
    FROM public.study_rooms
    WHERE id = p_room_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_room_type <> 'public' THEN
        RAISE EXCEPTION 'This is not a public room.' USING ERRCODE = '42501';
    END IF;

    -- Check room capacity
    SELECT count(*) INTO v_current_participants FROM public.study_room_participants WHERE room_id = p_room_id AND is_active = true;
    IF v_current_participants >= v_room_capacity THEN
        RAISE EXCEPTION 'Room is full.' USING ERRCODE = '50001';
    END IF;

    -- Deactivate user from any other active rooms
    UPDATE public.study_room_participants
    SET is_active = false, left_at = now()
    WHERE user_id = v_user_id AND is_active = true;

    -- Add user to the room's participants, handling re-joins
    INSERT INTO public.study_room_participants (room_id, user_id, role, is_active, joined_at, left_at)
    VALUES (p_room_id, v_user_id, 'member', true, now(), null)
    ON CONFLICT (user_id, room_id) DO UPDATE
    SET is_active = true,
        joined_at = now(),
        left_at = null,
        role = 'member';
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

