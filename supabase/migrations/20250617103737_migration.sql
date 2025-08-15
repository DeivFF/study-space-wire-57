
-- Criar tabela para questões
CREATE TABLE public.questoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  enunciado TEXT NOT NULL,
  alternativas JSONB NOT NULL,
  resposta_correta INTEGER NOT NULL,
  explicacao TEXT,
  materia TEXT NOT NULL,
  assunto TEXT NOT NULL,
  banca TEXT NOT NULL,
  ano INTEGER NOT NULL,
  dificuldade TEXT NOT NULL CHECK (dificuldade IN ('facil', 'medio', 'dificil')),
  respondida BOOLEAN DEFAULT FALSE,
  acertou BOOLEAN,
  tempo_resposta INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para flashcards
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  materia TEXT NOT NULL,
  dificuldade TEXT NOT NULL CHECK (dificuldade IN ('facil', 'medio', 'dificil')),
  revisoes INTEGER DEFAULT 0,
  acertos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para estatísticas de estudo
CREATE TABLE public.estatisticas_estudo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tempo_estudo INTEGER DEFAULT 0,
  questoes_resolvidas INTEGER DEFAULT 0,
  questoes_corretas INTEGER DEFAULT 0,
  sessoes_pomodoro INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, data)
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.questoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estatisticas_estudo ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para questões
CREATE POLICY "Users can view their own questoes" 
  ON public.questoes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own questoes" 
  ON public.questoes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questoes" 
  ON public.questoes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questoes" 
  ON public.questoes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas RLS para flashcards
CREATE POLICY "Users can view their own flashcards" 
  ON public.flashcards 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flashcards" 
  ON public.flashcards 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards" 
  ON public.flashcards 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards" 
  ON public.flashcards 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas RLS para estatísticas
CREATE POLICY "Users can view their own stats" 
  ON public.estatisticas_estudo 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stats" 
  ON public.estatisticas_estudo 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" 
  ON public.estatisticas_estudo 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar timestamp
CREATE TRIGGER update_questoes_updated_at BEFORE UPDATE ON public.questoes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estatisticas_updated_at BEFORE UPDATE ON public.estatisticas_estudo 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
