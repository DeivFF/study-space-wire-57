-- Migration: Remove title column from lesson_exercises table
-- This migration removes the title field as it's no longer needed

-- Remove the title column from lesson_exercises table
ALTER TABLE lesson_exercises DROP COLUMN IF EXISTS title;