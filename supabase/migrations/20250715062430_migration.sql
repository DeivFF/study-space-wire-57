-- Corrigir função para evitar duplicação de sessões de revisão
CREATE OR REPLACE FUNCTION public.create_review_block_sessions()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  block_record RECORD;
  review_types TEXT[] := ARRAY['livro', 'questao', 'flashcard', 'audio', 'website'];
  review_type TEXT;
  round_num INTEGER;
  base_date DATE := CURRENT_DATE + INTERVAL '1 day'; -- Primeira revisão no dia seguinte
  existing_sessions_count INTEGER;
BEGIN
  -- Só criar blocos se a aula foi marcada como assistida
  IF NEW.watched = true AND (OLD.watched IS NULL OR OLD.watched = false) THEN
    
    -- Verificar se já existem sessões para esta aula
    SELECT COUNT(*) INTO existing_sessions_count
    FROM block_review_sessions 
    WHERE lesson_id = NEW.id AND user_id = NEW.user_id;
    
    -- Se já existem sessões, não criar novas
    IF existing_sessions_count > 0 THEN
      RETURN NEW;
    END IF;
    
    -- Verificar se já existe um bloco para hoje para este usuário
    SELECT * INTO block_record 
    FROM review_blocks 
    WHERE user_id = NEW.user_id 
      AND DATE(created_at) = CURRENT_DATE
    ORDER BY block_number DESC 
    LIMIT 1;
    
    -- Se não existe bloco para hoje, criar um novo
    IF block_record IS NULL THEN
      -- Buscar o último número de bloco do usuário
      SELECT COALESCE(MAX(block_number), 0) + 1 INTO block_record.block_number
      FROM review_blocks 
      WHERE user_id = NEW.user_id;
      
      -- Criar novo bloco
      INSERT INTO review_blocks (user_id, block_number, block_name)
      VALUES (NEW.user_id, block_record.block_number, 'Bloco ' || LPAD(block_record.block_number::TEXT, 2, '0'))
      RETURNING * INTO block_record;
    END IF;
    
    -- Criar sessões de revisão para cada tipo e rodada
    FOREACH review_type IN ARRAY review_types LOOP
      FOR round_num IN 1..5 LOOP
        INSERT INTO block_review_sessions (
          block_id, 
          lesson_id, 
          user_id, 
          review_type, 
          review_round, 
          scheduled_date
        ) VALUES (
          block_record.id,
          NEW.id,
          NEW.user_id,
          review_type,
          round_num,
          CASE 
            WHEN round_num = 1 THEN base_date
            ELSE base_date + ((round_num - 1) * INTERVAL '5 days')
          END
        );
      END LOOP;
    END LOOP;
    
  -- Se a aula foi desmarcada como assistida, remover as sessões de revisão
  ELSIF NEW.watched = false AND OLD.watched = true THEN
    DELETE FROM block_review_sessions 
    WHERE lesson_id = NEW.id AND user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;