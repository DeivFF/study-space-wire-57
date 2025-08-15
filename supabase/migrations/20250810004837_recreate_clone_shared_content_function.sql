-- Drop the function if it exists, to ensure a clean recreation
DROP FUNCTION IF EXISTS public.clone_shared_content(uuid, uuid);

-- This function performs a deep clone of a shared content package for a recipient.
-- It handles cloning different types of content (categories, lessons) and maintains
-- their relationships by mapping old IDs to newly generated IDs.
CREATE OR REPLACE FUNCTION public.clone_shared_content(
  p_shared_content_id uuid,
  p_recipient_id uuid
)
RETURNS void AS $$
DECLARE
  item_record RECORD;
  new_category_id uuid;
  new_lesson_id uuid;
  id_map jsonb := '{}'::jsonb; -- Map to store old_id -> new_id
BEGIN
  -- Loop through all items in the shared content package, ensuring categories are processed first
  FOR item_record IN
    SELECT * FROM public.shared_content_items
    WHERE shared_content_id = p_shared_content_id
    ORDER BY CASE
      WHEN item_type = 'category' THEN 1
      WHEN item_type = 'lesson' THEN 2
      ELSE 3
    END
  LOOP
    -- Handle CATEGORY cloning
    IF item_record.item_type = 'category' THEN
      INSERT INTO public.categories (name, user_id, is_archived)
      VALUES (
        item_record.item_data->>'name',
        p_recipient_id,
        (item_record.item_data->>'is_archived')::boolean
      )
      RETURNING id INTO new_category_id;

      -- Store the mapping from old category ID to new category ID
      id_map := id_map || jsonb_build_object(item_record.item_id, new_category_id);

    -- Handle LESSON cloning
    ELSIF item_record.item_type = 'lesson' THEN
      -- Find the new parent category ID from our map
      new_category_id := id_map->>(item_record.item_data->>'category_id');

      IF new_category_id IS NOT NULL THEN
        INSERT INTO public.lessons (
          name,
          category_id,
          user_id,
          duration_minutes,
          summary,
          watched
        )
        VALUES (
          item_record.item_data->>'name',
          new_category_id,
          p_recipient_id,
          (item_record.item_data->>'duration_minutes')::integer,
          item_record.item_data->>'summary',
          false -- Cloned lessons are not watched by default
        )
        RETURNING id INTO new_lesson_id;

        -- Store the mapping for the lesson as well, in case other items depend on it
        id_map := id_map || jsonb_build_object(item_record.item_id, new_lesson_id);
      END IF;

    -- TODO: Handle other content types like 'question', 'flashcard' here in the future.
    -- They would look up their parent (lesson or category) ID in the id_map.

    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
