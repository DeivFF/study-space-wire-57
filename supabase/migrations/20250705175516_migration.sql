
-- Criar tabela para metas de estudo
CREATE TABLE public.study_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  daily_hours NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  category_ids JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  daily_schedule JSONB, -- Cronograma diário com aulas programadas
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own study goals" 
  ON public.study_goals 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study goals" 
  ON public.study_goals 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study goals" 
  ON public.study_goals 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study goals" 
  ON public.study_goals 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_study_goals_updated_at
  BEFORE UPDATE ON public.study_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_study_goals_user_id ON public.study_goals(user_id);
CREATE INDEX idx_study_goals_active ON public.study_goals(is_active);
CREATE INDEX idx_study_goals_dates ON public.study_goals(start_date, end_date);
