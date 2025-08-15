
-- Atualizar bucket existente para aumentar limite de arquivo
UPDATE storage.buckets 
SET 
  file_size_limit = 2147483648, -- 2GB em bytes
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime']
WHERE id = 'videos';

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;

-- Criar novas políticas
CREATE POLICY "Authenticated users can upload videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Users can view all videos" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'videos');

CREATE POLICY "Users can update their own videos" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
