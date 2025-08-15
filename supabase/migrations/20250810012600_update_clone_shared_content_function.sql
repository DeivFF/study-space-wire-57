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
  -- Loop through all items in the shared content package, ensuring parent items are processed first
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
      INSERT INTO public.lesson_categories (name, user_id, is_archived)
      VALUES (
        item_record.item_data->>'name',
        p_recipient_id,
        (item_record.item_data->>'is_archived')::boolean
      )
      RETURNING id INTO new_category_id;
      id_map := id_map || jsonb_build_object(item_record.item_id, new_category_id);

    -- Handle LESSON cloning
    ELSIF item_record.item_type = 'lesson' THEN
      new_category_id := id_map->>(item_record.item_data->>'category_id');
      IF new_category_id IS NOT NULL THEN
        INSERT INTO public.lessons (
          name, category_id, user_id, duration_minutes, summary, audio_file_path, watched
        )
        VALUES (
          item_record.item_data->>'name',
          new_category_id,
          p_recipient_id,
          (item_record.item_data->>'duration_minutes')::integer,
          item_record.item_data->>'summary',
          item_record.item_data->>'audio_file_path',
          false
        )
        RETURNING id INTO new_lesson_id;
        id_map := id_map || jsonb_build_object(item_record.item_id, new_lesson_id);
      END IF;

    -- Handle FLASHCARD cloning
    ELSIF item_record.item_type = 'flashcard' THEN
      new_lesson_id := id_map->>(item_record.item_data->>'lesson_id');
      IF new_lesson_id IS NOT NULL THEN
        INSERT INTO public.lesson_flashcards (user_id, lesson_id, frente, verso, dica)
        VALUES (
          p_recipient_id,
          new_lesson_id::text,
          item_record.item_data->>'frente',
          item_record.item_data->>'verso',
          item_record.item_data->>'dica'
        );
      END IF;

    -- Handle QUESTION (exercise) cloning
    ELSIF item_record.item_type = 'question' THEN
      new_lesson_id := id_map->>(item_record.item_data->>'document_id');
      IF new_lesson_id IS NOT NULL THEN
        INSERT INTO public.annotation_questions (user_id, document_id, question, options, correct_answer, explanation)
        VALUES (
          p_recipient_id,
          new_lesson_id,
          item_record.item_data->>'question',
          (item_record.item_data->'options')::jsonb,
          (item_record.item_data->>'correct_answer')::integer,
          item_record.item_data->>'explanation'
        );
      END IF;

    -- Handle DOCUMENT (PDF) cloning
    ELSIF item_record.item_type = 'document' THEN
      new_lesson_id := id_map->>(item_record.item_data->>'lesson_id');
      IF new_lesson_id IS NOT NULL THEN
        INSERT INTO public.lesson_documents (user_id, lesson_id, title, file_name, file_path, document_type)
        VALUES (
          p_recipient_id,
          new_lesson_id::text,
          item_record.item_data->>'title',
          item_record.item_data->>'file_name',
          item_record.item_data->>'file_path',
          item_record.item_data->>'document_type'
        );
      END IF;

    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
