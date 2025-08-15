
-- Create lesson_performances table
CREATE TABLE public.lesson_performances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL,
  questions_correct INTEGER NOT NULL DEFAULT 0,
  questions_incorrect INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  accuracy_percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS (Row Level Security)
ALTER TABLE public.lesson_performances ENABLE ROW LEVEL SECURITY;

-- RLS policies for lesson_performances
CREATE POLICY "Users can view their own lesson performances" 
  ON public.lesson_performances 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lesson performances" 
  ON public.lesson_performances 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson performances" 
  ON public.lesson_performances 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lesson performances" 
  ON public.lesson_performances 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_lesson_performances_updated_at
  BEFORE UPDATE ON public.lesson_performances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_lesson_performances_user_lesson ON public.lesson_performances(user_id, lesson_id);
CREATE INDEX idx_lesson_performances_lesson ON public.lesson_performances(lesson_id);
