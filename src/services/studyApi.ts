const API_BASE_URL = 'http://localhost:3001/api';

export interface StudyType {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  study_type_id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  subject_id: string;
  user_id: string;
  title: string;
  description?: string;
  content?: string;
  difficulty?: string;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface LessonNote {
  id: string;
  lesson_id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  lesson_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  upload_path: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  lesson_id: string;
  front_content: string;
  back_content: string;
  tags?: string[];
  repetition?: number;
  easiness?: number;
  interval?: number;
  next_review?: string;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  lesson_id: string;
  title: string;
  question_text: string;
  question_type: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  difficulty?: string;
  tags?: string[];
  points?: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityLogEntry {
  id: string;
  lesson_id: string;
  user_id: string;
  activity_type: string;
  details: string;
  metadata?: any;
  points_earned?: number;
  duration_seconds?: number;
  created_at: string;
}

export interface LessonStatistics {
  total_time_spent: number;
  notes_count: number;
  flashcards_count: number;
  exercises_count: number;
  files_count: number;
  last_activity: string;
}

class StudyAPI {
  private baseURL = API_BASE_URL;

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  // Notes
  async getLessonNotes(lessonId: string): Promise<LessonNote[]> {
    const response = await this.request<{ success: boolean; data: LessonNote[] }>(`/lessons/${lessonId}/notes`);
    return response.data;
  }

  async createNote(lessonId: string, data: { title: string; content: string; tags?: string[] }): Promise<LessonNote> {
    const response = await this.request<{ success: boolean; data: LessonNote }>(`/lessons/${lessonId}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  // Files
  async getLessonFiles(lessonId: string): Promise<Resource[]> {
    const response = await this.request<{ success: boolean; data: Resource[] }>(`/lessons/${lessonId}/files`);
    return response.data;
  }

  async uploadFiles(lessonId: string, files: FileList): Promise<Resource[]> {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/lessons/${lessonId}/files/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  async downloadFile(lessonId: string, fileId: string): Promise<Blob> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/lessons/${lessonId}/files/${fileId}/download`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  // Flashcards
  async getLessonFlashcards(lessonId: string): Promise<{ flashcards: Flashcard[]; statistics: any }> {
    const response = await this.request<{ success: boolean; data: { flashcards: Flashcard[]; statistics: any } }>(`/lessons/${lessonId}/flashcards`);
    return response.data;
  }

  async createFlashcard(lessonId: string, data: { front_content: string; back_content: string; tags?: string[] }): Promise<Flashcard> {
    const response = await this.request<{ success: boolean; data: Flashcard }>(`/lessons/${lessonId}/flashcards`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async updateFlashcard(cardId: string, data: { front_content?: string; back_content?: string; tags?: string[] }): Promise<Flashcard> {
    const response = await this.request<{ success: boolean; data: Flashcard }>(`/flashcards/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteFlashcard(cardId: string): Promise<void> {
    await this.request(`/flashcards/${cardId}`, {
      method: 'DELETE',
    });
  }

  async reviewFlashcard(cardId: string, quality: number): Promise<Flashcard> {
    const response = await this.request<{ success: boolean; data: Flashcard }>(`/flashcards/${cardId}/review`, {
      method: 'POST',
      body: JSON.stringify({ quality }),
    });
    return response.data;
  }

  async getDueFlashcards(lessonId: string): Promise<Flashcard[]> {
    const response = await this.request<{ success: boolean; data: Flashcard[] }>(`/flashcards/due/${lessonId}`);
    return response.data;
  }

  async startFlashcardSession(lessonId: string, limit: number = 20): Promise<{ session_id: string; flashcards: Flashcard[] }> {
    const response = await this.request<{ success: boolean; data: { session_id: string; flashcards: Flashcard[] } }>(`/flashcards/session/start/${lessonId}`, {
      method: 'POST',
      body: JSON.stringify({ limit }),
    });
    return response.data;
  }

  // Exercises
  async getLessonExercises(lessonId: string): Promise<Exercise[]> {
    const response = await this.request<{ success: boolean; data: Exercise[] }>(`/lessons/${lessonId}/exercises`);
    return response.data;
  }

  async createExercise(lessonId: string, data: Omit<Exercise, 'id' | 'created_at' | 'updated_at'>): Promise<Exercise> {
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
    const response = await this.request<{ success: boolean; data: { correct: boolean; explanation?: string } }>(`/exercises/${exerciseId}/attempt`, {
      method: 'POST',
      body: JSON.stringify({ user_answer: userAnswer, time_spent: timeSpent }),
    });
    return response.data;
  }

  // Activity Log
  async getLessonActivity(lessonId: string): Promise<ActivityLogEntry[]> {
    const response = await this.request<{ success: boolean; data: ActivityLogEntry[] }>(`/lessons/${lessonId}/activity`);
    return response.data;
  }

  async clearLessonActivity(lessonId: string): Promise<void> {
    await this.request(`/lessons/${lessonId}/activity`, {
      method: 'DELETE',
    });
  }

  async exportLessonActivity(lessonId: string, format: 'json' | 'csv'): Promise<Blob> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/lessons/${lessonId}/activity/export?format=${format}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to export activity: ${response.statusText}`);
    }

    return response.blob();
  }

  async logLessonActivity(lessonId: string, payload: { 
    activity_type: string; 
    details: string; 
    duration_seconds?: number; 
    points_earned?: number; 
    metadata?: any 
  }): Promise<void> {
    await this.request(`/lessons/${lessonId}/activity`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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