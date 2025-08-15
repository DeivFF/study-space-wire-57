
-- Primeiro, verificar e limpar dados inconsistentes
DELETE FROM annotation_questions 
WHERE document_id NOT IN (SELECT id FROM lessons);

-- Agora remover a constraint existente que referencia annotation_documents
ALTER TABLE annotation_questions 
DROP CONSTRAINT IF EXISTS annotation_questions_document_id_fkey;

-- Adicionar nova constraint que referencia lessons
ALTER TABLE annotation_questions 
ADD CONSTRAINT annotation_questions_document_id_fkey 
FOREIGN KEY (document_id) REFERENCES lessons(id) ON DELETE CASCADE;
