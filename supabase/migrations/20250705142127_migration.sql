
-- Criar enum para tipos de estudo
CREATE TYPE public.study_type AS ENUM ('livro', 'questao', 'audio', 'website', 'flashcard');

-- Criar tabela para sessões de estudo
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  study_type public.study_type NOT NULL,
  resource_id TEXT NOT NULL, -- ID do recurso específico (lesson_id, question_id, etc.)
  resource_title TEXT NOT NULL, -- Título/nome do recurso para exibição
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  study_date DATE NOT NULL DEFAULT CURRENT_DATE,
  time_spent_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own study sessions" 
  ON public.study_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study sessions" 
  ON public.study_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions" 
  ON public.study_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sessions" 
  ON public.study_sessions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_study_sessions_updated_at
  BEFORE UPDATE ON public.study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_study_sessions_study_date ON public.study_sessions(study_date);
CREATE INDEX idx_study_sessions_type ON public.study_sessions(study_type);
