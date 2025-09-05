-- 041_exercises_history_alignment.sql
-- Ensures proper table schemas for exercises and activity log

-- Ensure lesson_exercises table
CREATE TABLE IF NOT EXISTS lesson_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(32) NOT NULL,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  difficulty VARCHAR(10) DEFAULT 'medio' CHECK (difficulty IN ('facil','medio','dificil')),
  tags TEXT[] DEFAULT '{}',
  points INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Relax/replace type check to support all used values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name='lesson_exercises' AND column_name='question_type'
  ) THEN
    -- No-op: just keep it as VARCHAR and validate on app, or add a CHECK that includes all values.
    BEGIN
      ALTER TABLE lesson_exercises DROP CONSTRAINT IF EXISTS lesson_exercises_question_type_check;
      ALTER TABLE lesson_exercises
        ADD CONSTRAINT lesson_exercises_question_type_check
        CHECK (question_type IN ('multiple_choice','mcq','truefalse','true_false','essay','fill_blank'));
    EXCEPTION WHEN others THEN
      -- ignore if cannot alter (e.g. existing data); app-level validation will handle
      NULL;
    END;
  END IF;
END $$;

-- Ensure exercise_attempts table
CREATE TABLE IF NOT EXISTS exercise_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES lesson_exercises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN,
  time_spent INTEGER, -- seconds
  attempted_at TIMESTAMP DEFAULT NOW()
);

-- Ensure lesson_activity_log table
CREATE TABLE IF NOT EXISTS lesson_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  details TEXT NOT NULL,
  metadata JSONB,
  points_earned INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Backward-compatible renames if old columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lesson_activity_log' AND column_name='timestamp') THEN
    ALTER TABLE lesson_activity_log RENAME COLUMN "timestamp" TO created_at;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lesson_activity_log' AND column_name='duration') THEN
    ALTER TABLE lesson_activity_log RENAME COLUMN duration TO duration_seconds;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lesson_activity_log' AND column_name='points') THEN
    ALTER TABLE lesson_activity_log RENAME COLUMN points TO points_earned;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lesson_activity_log' AND column_name='data') THEN
    ALTER TABLE lesson_activity_log RENAME COLUMN "data" TO metadata;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_lesson_id ON lesson_exercises(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_question_type ON lesson_exercises(question_type);
CREATE INDEX IF NOT EXISTS idx_lesson_exercises_difficulty ON lesson_exercises(difficulty);

CREATE INDEX IF NOT EXISTS idx_exercise_attempts_exercise_id ON exercise_attempts(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_user_id ON exercise_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_attempted_at ON exercise_attempts(attempted_at);

CREATE INDEX IF NOT EXISTS idx_lesson_activity_log_lesson_id ON lesson_activity_log(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_activity_log_user_id ON lesson_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_activity_log_type ON lesson_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_lesson_activity_log_created_at ON lesson_activity_log(created_at);

-- Trigger to update updated_at on lesson_exercises
DO $$
BEGIN
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';
EXCEPTION WHEN others THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER update_lesson_exercises_updated_at
    BEFORE UPDATE ON lesson_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN others THEN
  NULL;
END $$;