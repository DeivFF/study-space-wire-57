
-- Criar tabela para anotações das aulas
CREATE TABLE public.lesson_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  lesson_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS (Row Level Security)
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para que usuários vejam apenas suas próprias anotações
CREATE POLICY "Users can view their own lesson notes" 
  ON public.lesson_notes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lesson notes" 
  ON public.lesson_notes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson notes" 
  ON public.lesson_notes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lesson notes" 
  ON public.lesson_notes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER lesson_notes_updated_at 
  BEFORE UPDATE ON public.lesson_notes 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
