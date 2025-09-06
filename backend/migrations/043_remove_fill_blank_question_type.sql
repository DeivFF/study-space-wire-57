-- Migration: Remove fill_blank question type
-- Date: 2025-09-05
-- Description: Remove fill_blank question type from lesson_exercises table constraint

-- Drop the existing constraint
ALTER TABLE lesson_exercises DROP CONSTRAINT IF EXISTS lesson_exercises_question_type_check;

-- Add new constraint without fill_blank
ALTER TABLE lesson_exercises ADD CONSTRAINT lesson_exercises_question_type_check 
  CHECK (question_type IN ('multiple_choice', 'mcq', 'truefalse', 'true_false', 'essay'));