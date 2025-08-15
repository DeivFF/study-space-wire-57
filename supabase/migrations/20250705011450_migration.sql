
-- Criar tabela para salvar o progresso dos exercícios
CREATE TABLE public.exercise_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  lesson_id TEXT NOT NULL,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_finished BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Adicionar RLS
ALTER TABLE public.exercise_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exercise progress" 
  ON public.exercise_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercise progress" 
  ON public.exercise_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise progress" 
  ON public.exercise_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise progress" 
  ON public.exercise_progress 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER exercise_progress_updated_at 
  BEFORE UPDATE ON public.exercise_progress 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
