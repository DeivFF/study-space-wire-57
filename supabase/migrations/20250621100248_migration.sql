
-- Habilitar RLS nas tabelas que ainda não têm
ALTER TABLE annotation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotation_documents ENABLE ROW LEVEL SECURITY;

-- Políticas para annotation_categories
CREATE POLICY "Users can view their own categories" ON annotation_categories
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own categories" ON annotation_categories
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own categories" ON annotation_categories
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own categories" ON annotation_categories
FOR DELETE USING (user_id = auth.uid());

-- Políticas para annotation_documents
CREATE POLICY "Users can view their own documents" ON annotation_documents
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own documents" ON annotation_documents
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents" ON annotation_documents
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents" ON annotation_documents
FOR DELETE USING (user_id = auth.uid());

-- Criar bucket de storage se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket de documentos
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
