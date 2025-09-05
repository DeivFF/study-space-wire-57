import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

export interface GamificationStats {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;
  dailyGoal: number;
  todayProgress: number;
  lastActivityDate: string;
  achievements: Achievement[];
  weeklyStats: DailyActivity[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  xpReward: number;
}

export interface DailyActivity {
  date: string;
  xpEarned: number;
  questionsAnswered: number;
  studyTimeMinutes: number;
  completed: boolean;
}

export type ActivityType = 
  | 'question_answered_correct'
  | 'question_answered_wrong'
  | 'study_session_completed'
  | 'daily_goal_reached'
  | 'streak_milestone'
  | 'first_login';

const XP_REWARDS: Record<ActivityType, number> = {
  question_answered_correct: 10,
  question_answered_wrong: 2,
  study_session_completed: 25,
  daily_goal_reached: 50,
  streak_milestone: 100,
  first_login: 20,
};

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000];

const initialState: GamificationStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalXP: 0,
  level: 1,
  dailyGoal: 50, // 50 XP per day default
  todayProgress: 0,
  lastActivityDate: '',
  achievements: [],
  weeklyStats: [],
};

type GamificationAction =
  | { type: 'LOAD_FROM_STORAGE'; payload: GamificationStats }
  | { type: 'ADD_XP'; payload: { amount: number; activityType: ActivityType } }
  | { type: 'UPDATE_STREAK' }
  | { type: 'SET_DAILY_GOAL'; payload: number }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: Achievement }
  | { type: 'RESET_DAILY_PROGRESS' };

function gamificationReducer(state: GamificationStats, action: GamificationAction): GamificationStats {
  switch (action.type) {
    case 'LOAD_FROM_STORAGE':
      return action.payload;

    case 'ADD_XP': {
      const newXP = state.totalXP + action.payload.amount;
      const newLevel = calculateLevel(newXP);
      const today = new Date().toISOString().split('T')[0];
      const todayProgress = state.todayProgress + action.payload.amount;
      
      // Update weekly stats
      const weeklyStats = [...state.weeklyStats];
      const todayIndex = weeklyStats.findIndex(day => day.date === today);
      
      if (todayIndex >= 0) {
        weeklyStats[todayIndex] = {
          ...weeklyStats[todayIndex],
          xpEarned: weeklyStats[todayIndex].xpEarned + action.payload.amount,
          questionsAnswered: action.payload.activityType.includes('question') 
            ? weeklyStats[todayIndex].questionsAnswered + 1 
            : weeklyStats[todayIndex].questionsAnswered,
          completed: weeklyStats[todayIndex].xpEarned + action.payload.amount >= state.dailyGoal,
        };
      } else {
        weeklyStats.push({
          date: today,
          xpEarned: action.payload.amount,
          questionsAnswered: action.payload.activityType.includes('question') ? 1 : 0,
          studyTimeMinutes: 0,
          completed: action.payload.amount >= state.dailyGoal,
        });
      }

      // Keep only last 7 days
      weeklyStats.sort((a, b) => b.date.localeCompare(a.date));
      const last7Days = weeklyStats.slice(0, 7);

      return {
        ...state,
        totalXP: newXP,
        level: newLevel,
        todayProgress,
        lastActivityDate: today,
        weeklyStats: last7Days,
      };
    }

    case 'UPDATE_STREAK': {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      let newStreak = state.currentStreak;
      
      if (state.lastActivityDate === yesterday || state.lastActivityDate === today) {
        if (state.todayProgress >= state.dailyGoal && state.lastActivityDate !== today) {
          newStreak = state.currentStreak + 1;
        }
      } else if (state.lastActivityDate !== today) {
        newStreak = 0; // Streak broken
      }

      return {
        ...state,
        currentStreak: newStreak,
        longestStreak: Math.max(state.longestStreak, newStreak),
      };
    }

    case 'SET_DAILY_GOAL':
      return {
        ...state,
        dailyGoal: action.payload,
      };

    case 'UNLOCK_ACHIEVEMENT':
      if (state.achievements.some(a => a.id === action.payload.id)) {
        return state; // Achievement already unlocked
      }
      return {
        ...state,
        achievements: [...state.achievements, action.payload],
        totalXP: state.totalXP + action.payload.xpReward,
      };

    case 'RESET_DAILY_PROGRESS': {
      const today = new Date().toISOString().split('T')[0];
      if (state.lastActivityDate !== today) {
        return {
          ...state,
          todayProgress: 0,
        };
      }
      return state;
    }

    default:
      return state;
  }
}

function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

const GamificationContext = createContext<{
  state: GamificationStats;
  dispatch: React.Dispatch<GamificationAction>;
  addXP: (activityType: ActivityType) => void;
  setDailyGoal: (goal: number) => void;
  checkAchievements: () => void;
} | null>(null);

const STORAGE_KEY = 'study-space-gamification';

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gamificationReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: parsed });
        
        // Reset daily progress if it's a new day
        dispatch({ type: 'RESET_DAILY_PROGRESS' });
        dispatch({ type: 'UPDATE_STREAK' });
      }
    } catch (error) {
      console.error('Failed to load gamification data:', error);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save gamification data:', error);
    }
  }, [state]);

  const addXP = (activityType: ActivityType) => {
    const xpAmount = XP_REWARDS[activityType];
    dispatch({ type: 'ADD_XP', payload: { amount: xpAmount, activityType } });
    dispatch({ type: 'UPDATE_STREAK' });
  };

  const setDailyGoal = (goal: number) => {
    dispatch({ type: 'SET_DAILY_GOAL', payload: goal });
  };

  const checkAchievements = () => {
    const achievements: Achievement[] = [];
    
    // First login achievement
    if (state.achievements.length === 0) {
      achievements.push({
        id: 'first_login',
        title: 'Bem-vindo!',
        description: 'Fez seu primeiro login no Study Space',
        icon: '🎉',
        unlockedAt: new Date().toISOString(),
        xpReward: 20,
      });
    }

    // Streak achievements
    if (state.currentStreak >= 7 && !state.achievements.some(a => a.id === 'streak_7')) {
      achievements.push({
        id: 'streak_7',
        title: 'Dedicado',
        description: 'Manteve uma sequência de 7 dias',
        icon: '🔥',
        unlockedAt: new Date().toISOString(),
        xpReward: 100,
      });
    }

    // Level achievements
    if (state.level >= 5 && !state.achievements.some(a => a.id === 'level_5')) {
      achievements.push({
        id: 'level_5',
        title: 'Estudante Experiente',
        description: 'Alcançou o nível 5',
        icon: '⭐',
        unlockedAt: new Date().toISOString(),
        xpReward: 150,
      });
    }

    // Apply achievements
    achievements.forEach(achievement => {
      dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: achievement });
    });
  };

  return (
    <GamificationContext.Provider value={{ state, dispatch, addXP, setDailyGoal, checkAchievements }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
