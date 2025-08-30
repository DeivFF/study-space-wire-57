import { useState, useEffect, useCallback } from 'react';

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
  const [sessionActive, setSessionActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [questionTimers, setQuestionTimers] = useState<Record<string, number>>({});
  const [globalTimer, setGlobalTimer] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  
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
  }, [currentQuestionIndex, sessionActive, questions]);

  const startSession = useCallback(() => {
    setSessionActive(true);
    setGlobalTimer(0);
    setQuestionTimers({});
    setAnsweredQuestions(new Set());
    
    // Iniciar primeira questão não respondida
    const firstUnansweredIndex = questions.findIndex(q => !answeredQuestions.has(q.id));
    if (firstUnansweredIndex >= 0) {
      setCurrentQuestionIndex(firstUnansweredIndex);
    }
  }, [questions, answeredQuestions]);

  const startQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  }, [questions.length]);

  const submitAnswer = useCallback(async (questionId: string, answer: string, isCorrect: boolean) => {
    // Marcar questão como respondida
    setAnsweredQuestions(prev => {
      const newSet = new Set([...prev, questionId]);
      
      // No modo lista, auto-avançar para próxima questão
      if (mode === 'list') {
        const currentIndex = questions.findIndex(q => q.id === questionId);
        const nextUnansweredIndex = questions.findIndex((q, idx) => 
          idx > currentIndex && !newSet.has(q.id)
        );
        
        if (nextUnansweredIndex >= 0) {
          // Delay para feedback visual
          setTimeout(() => {
            setCurrentQuestionIndex(nextUnansweredIndex);
            // Scroll suave para próxima questão
            document.getElementById(`question-${questions[nextUnansweredIndex].id}`)?.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }, 500);
        } else {
          // Acabaram as questões, parar sessão
          setTimeout(() => {
            setSessionActive(false);
            setCurrentQuestionIndex(-1);
          }, 1000);
        }
      }
      
      return newSet;
    });
    
    return { success: true, isCorrect };
  }, [questions, mode]);

  const stopSession = useCallback(() => {
    setSessionActive(false);
    setCurrentQuestionIndex(-1);
  }, []);

  const calculateSessionStats = useCallback((): SessionStats => {
    const times = Object.values(questionTimers).filter(t => t > 0);
    const answeredCount = answeredQuestions.size;
    
    return {
      totalTime: globalTimer,
      answeredCount,
      successRate: 0, // Will be calculated by the component that has access to correct answers
      averageTime: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
      fastestTime: times.length > 0 ? Math.min(...times) : 0,
      slowestTime: times.length > 0 ? Math.max(...times) : 0
    };
  }, [questionTimers, answeredQuestions.size, globalTimer]);

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
    startSession,
    startQuestion,
    submitAnswer,
    stopSession,
    getCurrentQuestionTimer,
    sessionStats: calculateSessionStats()
  };
};