
-- Criar tabela para flashcards das aulas
CREATE TABLE public.lesson_flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  lesson_id TEXT NOT NULL,
  frente TEXT NOT NULL,
  verso TEXT NOT NULL,
  dica TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para documentos das aulas
CREATE TABLE public.lesson_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  lesson_id TEXT NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'pdf',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS para lesson_flashcards
ALTER TABLE public.lesson_flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lesson flashcards" 
  ON public.lesson_flashcards 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lesson flashcards" 
  ON public.lesson_flashcards 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson flashcards" 
  ON public.lesson_flashcards 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lesson flashcards" 
  ON public.lesson_flashcards 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Adicionar RLS para lesson_documents
ALTER TABLE public.lesson_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lesson documents" 
  ON public.lesson_documents 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lesson documents" 
  ON public.lesson_documents 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson documents" 
  ON public.lesson_documents 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lesson documents" 
  ON public.lesson_documents 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Criar triggers para atualizar updated_at automaticamente
CREATE TRIGGER lesson_flashcards_updated_at 
  BEFORE UPDATE ON public.lesson_flashcards 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER lesson_documents_updated_at 
  BEFORE UPDATE ON public.lesson_documents 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
