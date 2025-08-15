
-- Criar tabela para categorias de aulas
CREATE TABLE public.lesson_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para aulas
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES lesson_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  watched BOOLEAN NOT NULL DEFAULT false,
  watched_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.lesson_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para lesson_categories
CREATE POLICY "Users can view their own lesson categories" ON lesson_categories
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own lesson categories" ON lesson_categories
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own lesson categories" ON lesson_categories
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own lesson categories" ON lesson_categories
FOR DELETE USING (user_id = auth.uid());

-- Políticas RLS para lessons
CREATE POLICY "Users can view their own lessons" ON lessons
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own lessons" ON lessons
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own lessons" ON lessons
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own lessons" ON lessons
FOR DELETE USING (user_id = auth.uid());

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_lesson_categories_updated_at
    BEFORE UPDATE ON lesson_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
