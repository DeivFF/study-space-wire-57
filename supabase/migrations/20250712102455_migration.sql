
-- Create function to update statistics when attempts are made
CREATE OR REPLACE FUNCTION public.update_estatisticas_from_attempts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update or insert statistics for the day
    INSERT INTO public.estatisticas_estudo (user_id, data, questoes_resolvidas, questoes_corretas)
    VALUES (
        NEW.user_id,
        CURRENT_DATE,
        1,
        CASE WHEN NEW.acertou THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id, data)
    DO UPDATE SET
        questoes_resolvidas = estatisticas_estudo.questoes_resolvidas + 1,
        questoes_corretas = estatisticas_estudo.questoes_corretas + CASE WHEN NEW.acertou THEN 1 ELSE 0 END,
        updated_at = now();
    
    RETURN NEW;
END;
$$;

-- Create function to update statistics from question_attempts
CREATE OR REPLACE FUNCTION public.update_estatisticas_from_question_attempts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update or insert statistics for the day
    INSERT INTO public.estatisticas_estudo (user_id, data, questoes_resolvidas, questoes_corretas)
    VALUES (
        NEW.user_id,
        DATE(NEW.completed_at),
        1,
        CASE WHEN NEW.is_correct THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id, data)
    DO UPDATE SET
        questoes_resolvidas = estatisticas_estudo.questoes_resolvidas + 1,
        questoes_corretas = estatisticas_estudo.questoes_corretas + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
        updated_at = now();
    
    RETURN NEW;
END;
$$;

-- Create triggers to automatically update statistics
DROP TRIGGER IF EXISTS trigger_update_stats_from_tentativas ON public.questao_tentativas;
CREATE TRIGGER trigger_update_stats_from_tentativas
    AFTER INSERT ON public.questao_tentativas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_estatisticas_from_attempts();

DROP TRIGGER IF EXISTS trigger_update_stats_from_question_attempts ON public.question_attempts;
CREATE TRIGGER trigger_update_stats_from_question_attempts
    AFTER INSERT ON public.question_attempts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_estatisticas_from_question_attempts();

-- Add unique constraint to prevent duplicate statistics per user per day
ALTER TABLE public.estatisticas_estudo 
ADD CONSTRAINT unique_user_date UNIQUE (user_id, data);
