
-- Add the missing columns to the lesson_performances table
ALTER TABLE public.lesson_performances 
ADD COLUMN incorrect_questions TEXT,
ADD COLUMN notes TEXT;
