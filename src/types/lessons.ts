export interface Lesson {
  id: string;
  category_id: string;
  name: string;
  duration_minutes: number;
  watched: boolean;
  watched_at: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  audio_file_path: string | null;
  html_file_path: string | null;
  website_url: string | null;
  rating: number | null;
  rated_at: string | null;
}

export interface LessonCategory {
  id: string;
  name: string;
  user_id: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}