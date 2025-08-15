
-- Criar bucket de documentos se não existir e configurar para aceitar arquivos TXT e PDF
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  true, 
  10485760, -- 10MB
  ARRAY['application/pdf', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = ARRAY['application/pdf', 'text/plain'],
  file_size_limit = 10485760;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Criar políticas para o bucket documents
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can view all documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
