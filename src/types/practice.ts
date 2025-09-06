export interface SessionStats {
  correct: number;
  total: number;
  accuracy: number;
  timeSpent: number;
  avgTimePerCard?: number;
  startTime: number;
}

export interface PracticeSessionConfig {
  lessonId: string;
  type: 'flashcards' | 'exercises';
  limit?: number;
  filters?: {
    difficulty?: string[];
    questionType?: string[];
    status?: string[];
  };
}

export interface PracticeSession {
  id: string;
  config: PracticeSessionConfig;
  currentIndex: number;
  items: any[];
  stats: SessionStats;
  isActive: boolean;
}

export interface FlashcardSessionData {
  sessionId: string;
  flashcards: any[];
  currentIndex: number;
  stats: SessionStats;
}

export interface ExerciseSessionData {
  sessionId: string;
  exercises: any[];
  currentIndex: number;
  stats: SessionStats;
}