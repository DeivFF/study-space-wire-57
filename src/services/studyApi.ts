import { Lesson as StudyAppLesson } from '@/contexts/StudyAppContext';

// Study Management Interfaces
interface StudyType {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  subjects_count: number;
  lessons_count: number;
  created_at: string;
  updated_at: string;
}

interface Subject {
  id: string;
  name: string;
  description?: string;
  color: string;
  study_type_id: string;
  order_index: number;
  lessons_count: number;
  completed_lessons: number;
  avg_progress: number;
  created_at: string;
  updated_at: string;
}

const API_BASE = 'http://localhost:3002/api';

interface LessonFile {
  id: string;
  lesson_id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  uploaded_at: string;
  // Compatibility properties
  type?: 'pdf' | 'audio' | 'image';
  name?: string;
  size?: string;
  duration?: string;
  primary?: boolean;
  studied?: boolean;
  url?: string;
  uploadDate?: string;
  createdAt?: string;
}

interface Resource {
  id: string;
  name: string;
  type: 'pdf' | 'audio' | 'image';
  size: string;
  url: string;
  uploadDate: string;
  primary: boolean;
  studied: boolean;
}

interface LessonNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updated_at: string;
  created_at: number;
  createdAt?: number;
  updatedAt?: number;
  fromBackend?: boolean;
}

interface Flashcard {
  id: string;
  lesson_id: string;
  front_content: string;
  back_content: string;
  tags: string[];
  ease_factor: number;
  interval_days: number;
  due_date: string;
  total_reviews: number;
  correct_reviews: number;
  status: 'new' | 'due' | 'learning' | 'mastered';
}

interface Exercise {
  id: string;
  lesson_id: string;
  title: string;
  question_text: string;
  question_type: 'mcq' | 'essay' | 'multiple_choice' | 'true_false' | 'truefalse';
  options?: string[] | { key: string; text: string }[];
  correct_answer: string;
  explanation?: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  tags: string[];
  created_at?: string;
}

interface ActivityLogEntry {
  id: string;
  type: string;
  details: string;
  timestamp: string;
  duration?: number;
  data?: any;
}

interface Lesson {
  id: number | string;
  subject_id: string;
  title: string;
  description?: string;
  content?: string;
  difficulty?: string;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
}

interface LessonStatistics {
  files_count: number;
  notes_count: number;
  flashcards_count: number;
  flashcards_due: number;
  exercises_count: number;
  total_reviews: number;
  correct_reviews: number;
  accuracy_percentage: number;
  total_study_time: number;
  last_activity: string;
}

class StudyAPI {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = localStorage.getItem('accessToken');
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || error.message || 'API Error');
    }

    return response.json();
  }

  // Lesson Files
  async getLessonFiles(lessonId: string, type: 'all' | 'pdf' | 'audio' | 'image' = 'all'): Promise<LessonFile[]> {
    const params = type !== 'all' ? `?type=${type}` : '';
    const response = await this.request<{ success: boolean; data: LessonFile[] }>(`/lessons/${lessonId}/files${params}`);
    return response.data.map(file => ({
      ...file,
      // Add compatibility properties
      type: file.file_type as 'pdf' | 'audio' | 'image',
      name: file.original_name,
      size: `${Math.round(file.file_size / 1024)} KB`,
      uploadDate: file.uploaded_at,
      primary: false,
      studied: false,
      url: file.file_path
    }));
  }

  async uploadLessonFiles(lessonId: string, files: File[]): Promise<LessonFile[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE}/lessons/${lessonId}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    return result.data;
  }

  async downloadFile(fileId: string): Promise<void> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE}/files/${fileId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ''; // Filename will be set by Content-Disposition header
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async markFileAsPrimary(fileId: string): Promise<void> {
    await this.request(`/files/${fileId}/primary`, {
      method: 'PUT',
    });
  }

  async markFileAsStudied(fileId: string, studied: boolean): Promise<void> {
    await this.request(`/files/${fileId}/studied`, {
      method: 'PUT',
      body: JSON.stringify({ studied }),
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.request(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  async renameFile(fileId: string, fileName: string): Promise<void> {
    await this.request(`/files/${fileId}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ fileName }),
    });
  }

  // Lesson Notes
  async getLessonNotes(lessonId: string): Promise<LessonNote[]> {
    const response = await this.request<{ success: boolean; data: any[] }>(`/lessons/${lessonId}/notes`);
    return response.data.map(note => ({
      ...note,
      created_at: note.created_at || new Date(note.updated_at).getTime(),
      createdAt: new Date(note.updated_at).getTime(),
      updatedAt: new Date(note.updated_at).getTime(),
    }));
  }

  async createNote(lessonId: string, data: { title?: string; content: string; tags?: string[] }): Promise<LessonNote> {
    const response = await this.request<{ success: boolean; data: LessonNote }>(`/lessons/${lessonId}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateNote(noteId: string, data: { title?: string; content?: string; tags?: string[] }): Promise<LessonNote> {
    const response = await this.request<{ success: boolean; data: LessonNote }>(`/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteNote(noteId: string): Promise<void> {
    await this.request(`/notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  async searchNotes(query: string): Promise<LessonNote[]> {
    const response = await this.request<{ success: boolean; data: LessonNote[] }>(`/notes/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  // Flashcards
  async getLessonFlashcards(lessonId: string, status: 'all' | 'due' | 'new' | 'mastered' = 'all'): Promise<{ flashcards: Flashcard[]; statistics: any }> {
    const params = status !== 'all' ? `?status=${status}` : '';
    const response = await this.request<{ success: boolean; data: { flashcards: Flashcard[]; statistics: any } }>(`/lessons/${lessonId}/flashcards${params}`);
    return response.data;
  }

  async createFlashcard(lessonId: string, data: { front_content: string; back_content: string; tags?: string[] }): Promise<Flashcard> {
    const response = await this.request<{ success: boolean; data: Flashcard }>(`/lessons/${lessonId}/flashcards`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateFlashcard(flashcardId: string, data: { front_content?: string; back_content?: string; tags?: string[] }): Promise<Flashcard> {
    const response = await this.request<{ success: boolean; data: Flashcard }>(`/flashcards/${flashcardId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteFlashcard(flashcardId: string): Promise<void> {
    await this.request(`/flashcards/${flashcardId}`, {
      method: 'DELETE',
    });
  }

  async reviewFlashcard(flashcardId: string, quality: number): Promise<any> {
    const response = await this.request<{ success: boolean; data: any }>(`/flashcards/${flashcardId}/review`, {
      method: 'POST',
      body: JSON.stringify({ quality }),
    });
    return response.data;
  }

  async getDueFlashcards(lessonId?: string, limit: number = 20): Promise<Flashcard[]> {
    const params = new URLSearchParams();
    if (lessonId) params.append('lesson_id', lessonId);
    params.append('limit', limit.toString());
    
    const response = await this.request<{ success: boolean; data: Flashcard[] }>(`/flashcards/due?${params}`);
    return response.data;
  }

  async startFlashcardSession(lessonId?: string, limit: number = 20): Promise<{ session_id: string; flashcards: Flashcard[]; total_cards: number; estimated_time_minutes: number }> {
    const params = new URLSearchParams();
    if (lessonId) params.append('lesson_id', lessonId);
    params.append('limit', limit.toString());
    
    const response = await this.request<{ success: boolean; data: any }>(`/flashcards/session/start?${params}`);
    return response.data;
  }

  // Exercises
  async getLessonExercises(lessonId: string): Promise<Exercise[]> {
    const response = await this.request<{ success: boolean; data: Exercise[] }>(`/lessons/${lessonId}/exercises`);
    return response.data;
  }

  async createExercise(lessonId: string, data: Omit<Exercise, 'id' | 'lesson_id' | 'created_at'>): Promise<Exercise> {
    const response = await this.request<{ success: boolean; data: Exercise }>(`/lessons/${lessonId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateExercise(exerciseId: string, data: Partial<Exercise>): Promise<Exercise> {
    const response = await this.request<{ success: boolean; data: Exercise }>(`/exercises/${exerciseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteExercise(exerciseId: string): Promise<void> {
    await this.request(`/exercises/${exerciseId}`, {
      method: 'DELETE',
    });
  }

  async attemptExercise(exerciseId: string, userAnswer: string, timeSpent?: number): Promise<{ correct: boolean; explanation?: string }> {
    const response = await this.request<{ success: boolean; data: any }>(`/exercises/${exerciseId}/attempt`, {
      method: 'POST',
      body: JSON.stringify({ user_answer: userAnswer, time_spent_seconds: timeSpent }),
    });
    return response.data;
  }

  // Activity
  async getLessonActivity(lessonId: string, limit: number = 50): Promise<ActivityLogEntry[]> {
    const response = await this.request<{ success: boolean; data: ActivityLogEntry[] }>(`/lessons/${lessonId}/activity?limit=${limit}`);
    return response.data;
  }

  async clearLessonActivity(lessonId: string): Promise<void> {
    await this.request<{ success: boolean }>(`/lessons/${lessonId}/activity`, {
      method: 'DELETE'
    });
  }

  async exportLessonActivity(lessonId: string, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE}/lessons/${lessonId}/activity/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  // Statistics
  async getLessonStatistics(lessonId: string): Promise<LessonStatistics> {
    const response = await this.request<{ success: boolean; data: LessonStatistics }>(`/lessons/${lessonId}/statistics`);
    return response.data;
  }

  // Study Types
  async getStudyTypes(): Promise<StudyType[]> {
    const response = await this.request<{ success: boolean; data: StudyType[] }>('/study-types');
    return response.data;
  }

  async createStudyType(data: { name: string; description?: string; color?: string; icon?: string }): Promise<StudyType> {
    const response = await this.request<{ success: boolean; data: StudyType }>('/study-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getStudyTypeWithSubjects(studyTypeId: string): Promise<StudyType & { subjects: Subject[] }> {
    const response = await this.request<{ success: boolean; data: StudyType & { subjects: Subject[] } }>(`/study-types/${studyTypeId}`);
    return response.data;
  }

  async updateStudyType(studyTypeId: string, data: Partial<StudyType>): Promise<StudyType> {
    const response = await this.request<{ success: boolean; data: StudyType }>(`/study-types/${studyTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteStudyType(studyTypeId: string): Promise<void> {
    await this.request(`/study-types/${studyTypeId}`, {
      method: 'DELETE',
    });
  }

  // Subjects
  async getStudyTypeSubjects(studyTypeId: string): Promise<Subject[]> {
    const response = await this.request<{ success: boolean; data: { subjects: Subject[] } }>(`/study-types/${studyTypeId}/subjects`);
    return response.data.subjects;
  }

  async createSubject(studyTypeId: string, data: { name: string; description?: string; color?: string }): Promise<Subject> {
    const response = await this.request<{ success: boolean; data: Subject }>(`/study-types/${studyTypeId}/subjects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getSubjectWithLessons(subjectId: string): Promise<Subject & { lessons: Lesson[] }> {
    const response = await this.request<{ success: boolean; data: Subject & { lessons: Lesson[] } }>(`/subjects/${subjectId}`);
    return response.data;
  }

  async updateSubject(subjectId: string, data: Partial<Subject>): Promise<Subject> {
    const response = await this.request<{ success: boolean; data: Subject }>(`/subjects/${subjectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteSubject(subjectId: string): Promise<void> {
    await this.request(`/subjects/${subjectId}`, {
      method: 'DELETE',
    });
  }

  // Lessons
  async getSubjectLessons(subjectId: string): Promise<Lesson[]> {
    const response = await this.request<{ success: boolean; data: Lesson[] }>(`/subjects/${subjectId}/lessons`);
    return response.data;
  }

  async createLesson(subjectId: string, data: { title: string; description?: string; content?: string; difficulty?: string; duration_minutes?: number }): Promise<Lesson> {
    const response = await this.request<{ success: boolean; data: Lesson }>(`/subjects/${subjectId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateLesson(lessonId: string, data: { title?: string; description?: string; content?: string; difficulty?: string; duration_minutes?: number }): Promise<Lesson> {
    const response = await this.request<{ success: boolean; data: Lesson }>(`/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }
}

export const studyAPI = new StudyAPI();
export type { 
  StudyType, 
  Subject, 
  Lesson,
  LessonFile, 
  Resource,
  LessonNote, 
  Flashcard, 
  Exercise, 
  ActivityLogEntry, 
  LessonStatistics 
};