-- Migration: Create exercises and activity tables
-- Run this migration to add exercise functionality

-- Create lesson_exercises table
CREATE TABLE IF NOT EXISTS lesson_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('mcq', 'essay', 'true_false', 'fill_blank')),
  options JSONB, -- For multiple choice questions
  correct_answer TEXT,
  explanation TEXT,
  difficulty VARCHAR(10) DEFAULT 'medio' CHECK (difficulty IN ('facil', 'medio', 'dificil')),
  tags TEXT[] DEFAULT '{}',
  points INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create exercise_attempts table
CREATE TABLE IF NOT EXISTS exercise_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES lesson_exercises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN,
  time_spent INTEGER, -- seconds
  attempted_at TIMESTAMP DEFAULT NOW()
);

-- Create lesson_activity_log table
CREATE TABLE IF NOT EXISTS lesson_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  details TEXT NOT NULL,
  data JSONB,
  points INTEGER DEFAULT 0,
  duration INTEGER, -- seconds
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_lesson_id ON lesson_exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_question_type ON lesson_exercises(question_type);
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_difficulty ON lesson_exercises(difficulty);

CREATE INDEX IF NOT EXISTS idx_exercise_attempts_exercise_id ON exercise_attempts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_user_id ON exercise_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_attempted_at ON exercise_attempts(attempted_at);

CREATE INDEX IF NOT EXISTS idx_lesson_activity_log_lesson_id ON lesson_activity_log(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_activity_log_user_id ON lesson_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_activity_log_activity_type ON lesson_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_lesson_activity_log_timestamp ON lesson_activity_log(timestamp);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lesson_exercises_updated_at
  BEFORE UPDATE ON lesson_exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();