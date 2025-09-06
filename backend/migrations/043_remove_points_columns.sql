-- Migration: Remove all points-related columns from the database
-- Date: 2025-01-09

-- First, drop the view that depends on points columns
DROP VIEW IF EXISTS lesson_detailed_stats;

-- Remove points column from lesson_exercises
ALTER TABLE lesson_exercises DROP COLUMN IF EXISTS points;

-- Remove points_earned column from exercise_attempts  
ALTER TABLE exercise_attempts DROP COLUMN IF EXISTS points_earned;

-- Remove points_earned column from lesson_activity_log
ALTER TABLE lesson_activity_log DROP COLUMN IF EXISTS points_earned;

-- Recreate the lesson_detailed_stats view without points columns
CREATE VIEW lesson_detailed_stats AS
SELECT 
    l.id AS lesson_id,
    l.title,
    l.subject_id,
    l.user_id,
    l.progress,
    l.accuracy,
    l.completed,
    l.difficulty,
    l.duration_minutes,
    COUNT(DISTINCT lf.id) AS files_count,
    COUNT(DISTINCT CASE WHEN lf.file_type = 'pdf' THEN lf.id ELSE NULL END) AS pdf_count,
    COUNT(DISTINCT CASE WHEN lf.file_type = 'audio' THEN lf.id ELSE NULL END) AS audio_count,
    COUNT(DISTINCT CASE WHEN lf.file_type = 'image' THEN lf.id ELSE NULL END) AS image_count,
    COUNT(DISTINCT CASE WHEN lf.file_type = 'video' THEN lf.id ELSE NULL END) AS video_count,
    COUNT(DISTINCT ln.id) AS notes_count,
    COUNT(DISTINCT lfc.id) AS flashcards_count,
    COUNT(DISTINCT CASE WHEN lfc.next_review_date <= CURRENT_TIMESTAMP THEN lfc.id ELSE NULL END) AS flashcards_due,
    COUNT(DISTINCT CASE WHEN lfc.status = 'mastered' THEN lfc.id ELSE NULL END) AS flashcards_mastered,
    COUNT(DISTINCT le.id) AS exercises_count,
    COUNT(DISTINCT ea.id) AS total_exercise_attempts,
    COUNT(DISTINCT CASE WHEN ea.is_correct = true THEN ea.id ELSE NULL END) AS correct_exercise_attempts,
    COUNT(DISTINCT lal.id) AS total_activities,
    SUM(COALESCE(lal.duration_seconds, 0)) AS total_study_time_seconds,
    MAX(lal.created_at) AS last_activity_at
FROM lessons l
LEFT JOIN lesson_files lf ON l.id = lf.lesson_id
LEFT JOIN lesson_notes ln ON l.id = ln.lesson_id  
LEFT JOIN lesson_flashcards lfc ON l.id = lfc.lesson_id
LEFT JOIN lesson_exercises le ON l.id = le.lesson_id
LEFT JOIN exercise_attempts ea ON le.id = ea.exercise_id
LEFT JOIN lesson_activity_log lal ON l.id = lal.lesson_id
GROUP BY l.id, l.title, l.subject_id, l.user_id, l.progress, l.accuracy, l.completed, l.difficulty, l.duration_minutes;