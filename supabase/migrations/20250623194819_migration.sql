
-- Corrigir as políticas RLS para annotation_questions para permitir acesso via lessons
DROP POLICY IF EXISTS "Users can view questions of their documents" ON annotation_questions;
DROP POLICY IF EXISTS "Users can create questions for their documents" ON annotation_questions;
DROP POLICY IF EXISTS "Users can update questions of their documents" ON annotation_questions;
DROP POLICY IF EXISTS "Users can delete questions of their documents" ON annotation_questions;

-- Criar novas políticas que verificam se a lesson pertence ao usuário
CREATE POLICY "Users can view questions of their lessons" ON annotation_questions
FOR SELECT USING (
  document_id IN (
    SELECT id FROM lessons WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create questions for their lessons" ON annotation_questions
FOR INSERT WITH CHECK (
  document_id IN (
    SELECT id FROM lessons WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update questions of their lessons" ON annotation_questions
FOR UPDATE USING (
  document_id IN (
    SELECT id FROM lessons WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete questions of their lessons" ON annotation_questions
FOR DELETE USING (
  document_id IN (
    SELECT id FROM lessons WHERE user_id = auth.uid()
  )
);
