
-- Criar tabela para transcrições das aulas
CREATE TABLE public.lesson_transcriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  lesson_id TEXT NOT NULL,
  start_time NUMERIC NOT NULL,
  end_time NUMERIC NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS (Row Level Security)
ALTER TABLE public.lesson_transcriptions ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para que usuários vejam apenas suas próprias transcrições
CREATE POLICY "Users can view their own lesson transcriptions" 
  ON public.lesson_transcriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lesson transcriptions" 
  ON public.lesson_transcriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson transcriptions" 
  ON public.lesson_transcriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lesson transcriptions" 
  ON public.lesson_transcriptions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER lesson_transcriptions_updated_at 
  BEFORE UPDATE ON public.lesson_transcriptions 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Criar índice para melhorar performance nas consultas por lesson_id
CREATE INDEX idx_lesson_transcriptions_lesson_id ON public.lesson_transcriptions(lesson_id);
CREATE INDEX idx_lesson_transcriptions_user_lesson ON public.lesson_transcriptions(user_id, lesson_id);
