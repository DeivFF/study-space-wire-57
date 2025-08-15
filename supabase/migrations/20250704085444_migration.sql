
-- Criar tabela para avaliações de questões
CREATE TABLE public.question_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL,
  difficulty_rating INTEGER NOT NULL CHECK (difficulty_rating >= 0 AND difficulty_rating <= 10),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS (Row Level Security)
ALTER TABLE public.question_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para question_ratings
CREATE POLICY "Users can view their own question ratings" 
  ON public.question_ratings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own question ratings" 
  ON public.question_ratings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own question ratings" 
  ON public.question_ratings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own question ratings" 
  ON public.question_ratings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Adicionar índices para melhor performance
CREATE INDEX idx_question_ratings_user_question ON public.question_ratings(user_id, question_id);
CREATE INDEX idx_question_ratings_question ON public.question_ratings(question_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_question_ratings_updated_at
  BEFORE UPDATE ON public.question_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
