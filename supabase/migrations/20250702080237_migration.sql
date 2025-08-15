
-- Adicionar colunas para áudio e arquivo HTML na tabela lessons
ALTER TABLE public.lessons 
ADD COLUMN audio_file_path TEXT,
ADD COLUMN html_file_path TEXT,
ADD COLUMN rating INTEGER,
ADD COLUMN rated_at TIMESTAMP WITH TIME ZONE;

-- Criar tabela para controle de revisão espaçada
CREATE TABLE public.lesson_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  ease_factor DECIMAL(3,2) NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 1,
  repetition INTEGER NOT NULL DEFAULT 0,
  next_review_date DATE NOT NULL,
  last_reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de revisões
ALTER TABLE public.lesson_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para lesson_reviews
CREATE POLICY "Users can view their own lesson reviews" ON lesson_reviews
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own lesson reviews" ON lesson_reviews
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own lesson reviews" ON lesson_reviews
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own lesson reviews" ON lesson_reviews
FOR DELETE USING (user_id = auth.uid());

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_lesson_reviews_updated_at
    BEFORE UPDATE ON lesson_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar bucket para arquivos de áudio e HTML se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lesson-files', 'lesson-files', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket lesson-files
CREATE POLICY "Users can upload their own lesson files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'lesson-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own lesson files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'lesson-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own lesson files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'lesson-files' AND auth.uid()::text = (storage.foldername(name))[1]);
