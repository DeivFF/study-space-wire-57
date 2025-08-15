WITH duplicates AS (
  SELECT
    id,
    room_id,
    user_id,
    row_number() OVER (PARTITION BY room_id, user_id ORDER BY joined_at DESC) as rn
  FROM
    public.study_room_participants
)
DELETE FROM public.study_room_participants
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
