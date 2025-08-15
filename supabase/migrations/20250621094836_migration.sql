
-- Renomear tabelas existentes para o novo contexto de anotações
ALTER TABLE video_categories RENAME TO annotation_categories;
ALTER TABLE videos RENAME TO annotation_documents;

-- Atualizar colunas da tabela de documentos
ALTER TABLE annotation_documents 
  DROP COLUMN duration,
  DROP COLUMN current_time_seconds,
  DROP COLUMN completed,
  ADD COLUMN document_type TEXT DEFAULT 'pdf' NOT NULL;

-- Criar tabela para questões vinculadas aos documentos
CREATE TABLE annotation_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES annotation_documents(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array de opções
  correct_answer INTEGER NOT NULL, -- Índice da resposta correta
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para registro de tentativas das questões
CREATE TABLE question_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES annotation_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE annotation_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;

-- Políticas para questões (acesso através do documento)
CREATE POLICY "Users can view questions of their documents" ON annotation_questions
FOR SELECT USING (
  document_id IN (
    SELECT id FROM annotation_documents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create questions for their documents" ON annotation_questions
FOR INSERT WITH CHECK (
  document_id IN (
    SELECT id FROM annotation_documents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update questions of their documents" ON annotation_questions
FOR UPDATE USING (
  document_id IN (
    SELECT id FROM annotation_documents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete questions of their documents" ON annotation_questions
FOR DELETE USING (
  document_id IN (
    SELECT id FROM annotation_documents WHERE user_id = auth.uid()
  )
);

-- Políticas para tentativas
CREATE POLICY "Users can view their own question attempts" ON question_attempts
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own question attempts" ON question_attempts
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Atualizar bucket para aceitar PDFs
UPDATE storage.buckets 
SET 
  allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'videos';

-- Renomear bucket
UPDATE storage.buckets 
SET 
  id = 'documents',
  name = 'documents'
WHERE id = 'videos';
