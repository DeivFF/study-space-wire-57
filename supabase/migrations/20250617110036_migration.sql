
-- Criar bucket de storage para vídeos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true);

-- Criar tabela para categorias de vídeos
CREATE TABLE public.video_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para vídeos
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES public.video_categories(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  current_time_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS para video_categories
ALTER TABLE public.video_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video categories" 
  ON public.video_categories 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own video categories" 
  ON public.video_categories 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video categories" 
  ON public.video_categories 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video categories" 
  ON public.video_categories 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Adicionar RLS para videos
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own videos" 
  ON public.videos 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own videos" 
  ON public.videos 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" 
  ON public.videos 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos" 
  ON public.videos 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Criar políticas para o storage bucket
CREATE POLICY "Users can upload videos" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own videos in storage" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos in storage" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Adicionar trigger para atualizar updated_at
CREATE TRIGGER update_video_categories_updated_at 
  BEFORE UPDATE ON public.video_categories 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_videos_updated_at 
  BEFORE UPDATE ON public.videos 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
