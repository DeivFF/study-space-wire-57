import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface LessonProgress {
  lessonId: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctQuestions: number;
}

interface LessonWithQuestions {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  questions: any[];
}

export const useAutoLessonSelection = (
  lessonsWithQuestions: LessonWithQuestions[],
  filteredLessons: LessonWithQuestions[]
) => {
  const [lastSelectedLesson, setLastSelectedLesson] = useLocalStorage<string | null>('questoes-last-selected-lesson', null);
  const [autoSelectedLesson, setAutoSelectedLesson] = useState<string | null>(null);

  // Função para calcular o progresso de uma aula
  const getLessonProgress = useCallback((lesson: LessonWithQuestions): LessonProgress => {
    const totalQuestions = lesson.questions.length;
    const answeredQuestions = lesson.questions.filter(q => q.attempts.length > 0).length;
    const correctQuestions = lesson.questions.filter(q => q.attempts.some(a => a.is_correct)).length;

    return {
      lessonId: lesson.id,
      totalQuestions,
      answeredQuestions,
      correctQuestions
    };
  }, []);

  // Função para verificar se uma aula está completa (todas as questões foram respondidas corretamente)
  const isLessonComplete = useCallback((lesson: LessonWithQuestions): boolean => {
    if (lesson.questions.length === 0) return true;
    return lesson.questions.every(q => q.attempts.some(a => a.is_correct));
  }, []);

  // Função para encontrar a próxima aula na sequência
  const getNextLesson = useCallback((currentLessonId: string, lessons: LessonWithQuestions[]): string | null => {
    const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
    if (currentIndex === -1 || currentIndex === lessons.length - 1) return null;
    
    return lessons[currentIndex + 1].id;
  }, []);

  // Função para determinar qual aula deve ser selecionada automaticamente
  const determineAutoSelection = useCallback(() => {
    if (filteredLessons.length === 0) return null;

    // Se há uma aula previamente selecionada, verificar seu estado
    if (lastSelectedLesson) {
      const lastLesson = filteredLessons.find(l => l.id === lastSelectedLesson);
      
      if (lastLesson) {
        // Se a aula ainda existe na lista filtrada
        if (isLessonComplete(lastLesson)) {
          // Se a aula está completa, buscar a próxima
          const nextLessonId = getNextLesson(lastSelectedLesson, filteredLessons);
          return nextLessonId || filteredLessons[0].id; // Se não há próxima, volta para a primeira
        } else {
          // Se a aula não está completa, continuar nela
          return lastSelectedLesson;
        }
      }
    }

    // Se não há aula previamente selecionada ou ela não existe mais, buscar a primeira aula incompleta
    const incompleteLesson = filteredLessons.find(lesson => !isLessonComplete(lesson));
    return incompleteLesson ? incompleteLesson.id : filteredLessons[0]?.id || null;
  }, [lastSelectedLesson, filteredLessons, isLessonComplete, getNextLesson]);

  // Atualizar a seleção automática quando as aulas mudam
  useEffect(() => {
    const autoSelection = determineAutoSelection();
    setAutoSelectedLesson(autoSelection);
  }, [determineAutoSelection]);

  // Função para atualizar a última aula selecionada
  const updateLastSelectedLesson = useCallback((lessonId: string) => {
    setLastSelectedLesson(lessonId);
  }, [setLastSelectedLesson]);

  return {
    autoSelectedLesson,
    updateLastSelectedLesson,
    getLessonProgress,
    isLessonComplete
  };
};