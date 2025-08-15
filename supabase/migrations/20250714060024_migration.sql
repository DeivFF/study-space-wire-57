-- Criar tabela para registrar revisões por tipo de estudo
CREATE TABLE IF NOT EXISTS public.study_type_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('livro', 'questao', 'audio', 'website', 'flashcard')),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  study_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Evitar revisões duplicadas do mesmo tipo no mesmo dia
  UNIQUE(user_id, lesson_id, review_type, study_date)
);

-- Enable Row Level Security
ALTER TABLE public.study_type_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own study type reviews" 
ON public.study_type_reviews 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study type reviews" 
ON public.study_type_reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study type reviews" 
ON public.study_type_reviews 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study type reviews" 
ON public.study_type_reviews 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_study_type_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_study_type_reviews_updated_at
BEFORE UPDATE ON public.study_type_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_study_type_reviews_updated_at();