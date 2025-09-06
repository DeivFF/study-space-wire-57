import { useState, useEffect, useCallback } from 'react';
import { useGamification } from '@/contexts/GamificationContext';

interface Question {
  id: string;
  title: string;
  category: string;
  question: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
  source: string;
  year: string;
  institution: string;
  subject: string;
  topic: string;
  code: string;
}

interface UseQuestionSessionProps {
  questions: Question[];
  mode: 'list' | 'wizard';
}

interface SessionStats {
  totalTime: number;
  answeredCount: number;
  successRate: number;
  averageTime: number;
  fastestTime: number;
  slowestTime: number;
}

export const useQuestionSession = ({ questions, mode }: UseQuestionSessionProps) => {
  const { addXP, checkAchievements } = useGamification();
  const [sessionActive, setSessionActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [questionTimers, setQuestionTimers] = useState<Record<string, number>>({});
  const [globalTimer, setGlobalTimer] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [correctAnswers, setCorrectAnswers] = useState<Set<string>>(new Set());
  
  // Timer global da sessão
  useEffect(() => {
    let globalInterval: NodeJS.Timeout;
    
    if (sessionActive) {
      globalInterval = setInterval(() => {
        setGlobalTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (globalInterval) {
        clearInterval(globalInterval);
      }
    };
  }, [sessionActive]);
  
  // Timer individual das questões
  useEffect(() => {
    let questionInterval: NodeJS.Timeout;
    
    if (sessionActive && currentQuestionIndex >= 0) {
      const currentQuestionId = questions[currentQuestionIndex]?.id;
      
      if (currentQuestionId) {
        questionInterval = setInterval(() => {
          setQuestionTimers(prev => ({
            ...prev,
            [currentQuestionId]: (prev[currentQuestionId] || 0) + 1
          }));
        }, 1000);
      }
    }
    
    return () => {
      if (questionInterval) {
        clearInterval(questionInterval);
      }
    };
  }, [currentQuestionIndex, sessionActive]);


  const startQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      const questionId = questions[index]?.id;
      
      // Initialize timer for current question if not exists
      if (questionId) {
        setQuestionTimers(prev => ({
          ...prev,
          [questionId]: prev[questionId] || 0
        }));
      }
      
      // Set current question index first
      setCurrentQuestionIndex(index);
      
      // Then activate session if not active
      if (!sessionActive) {
        setSessionActive(true);
        setGlobalTimer(0);
      }
    }
  }, [questions, sessionActive]);

  const submitAnswer = useCallback(async (questionId: string, answer: string, isCorrect: boolean) => {
    // Add XP based on answer correctness
    if (isCorrect) {
      addXP('question_answered_correct');
      setCorrectAnswers(prev => new Set([...prev, questionId]));
    } else {
      addXP('question_answered_wrong');
    }
    
    // Check for achievements
    checkAchievements();
    
    // Marcar questão como respondida
    setAnsweredQuestions(prev => {
      const newSet = new Set([...prev, questionId]);
      
      // Auto-avançar para próxima questão se estiver em sessão
      if (sessionActive) {
        const currentIndex = questions.findIndex(q => q.id === questionId);
        
        const nextUnansweredIndex = questions.findIndex((q, idx) => 
          idx > currentIndex && !newSet.has(q.id)
        );
        
        if (nextUnansweredIndex >= 0) {
          // Parar o cronômetro da questão atual e mover para próxima questão
          setCurrentQuestionIndex(nextUnansweredIndex);
          
          // Scroll suave para próxima questão
          setTimeout(() => {
            document.getElementById(`question-${questions[nextUnansweredIndex].id}`)?.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }, 100);
        } else {
          // Acabaram as questões, parar sessão
          setTimeout(() => {
            // Add XP for completing study session
            addXP('study_session_completed');
            setSessionActive(false);
            setCurrentQuestionIndex(-1);
          }, 1000);
        }
      }
      
      return newSet;
    });
    
    return { success: true, isCorrect };
  }, [questions, sessionActive, addXP, checkAchievements]);

  const stopSession = useCallback(() => {
    setSessionActive(false);
    setCurrentQuestionIndex(-1);
  }, []);

  const calculateSessionStats = useCallback((): SessionStats => {
    const times = Object.values(questionTimers).filter(t => t > 0);
    const answeredCount = answeredQuestions.size;
    const correctCount = correctAnswers.size;
    
    return {
      totalTime: globalTimer,
      answeredCount,
      successRate: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0,
      averageTime: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
      fastestTime: times.length > 0 ? Math.min(...times) : 0,
      slowestTime: times.length > 0 ? Math.max(...times) : 0
    };
  }, [questionTimers, answeredQuestions.size, globalTimer, correctAnswers.size]);

  const getCurrentQuestionTimer = useCallback((questionId: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    return currentQuestion?.id === questionId && sessionActive;
  }, [questions, currentQuestionIndex, sessionActive]);

  return {
    sessionActive,
    currentQuestionIndex,
    questionTimers,
    globalTimer,
    answeredQuestions,
    startQuestion,
    submitAnswer,
    stopSession,
    getCurrentQuestionTimer,
    sessionStats: calculateSessionStats()
  };
};