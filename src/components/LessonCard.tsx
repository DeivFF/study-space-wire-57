import React from 'react';
import { Clock, FileText, Headphones, Link, Check, MoreVertical, Pencil, Trash2, CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

// This should match the lesson type from useSupabaseLessons hook
export interface Lesson {
  id: string;
  name: string;
  category_id: string;
  duration_minutes: number;
  watched: boolean;
  rating: number | null;
  summary: string | null;
  audio_file_path: string | null;
  website_url: string | null;
  html_file_path: string | null;
  documents: any[]; // Assuming documents are passed in or handled separately
  // for performance
  questions: any[];
  attempts: any[];
}

interface LessonCardProps {
  lesson: Lesson;
  onLessonClick: (lessonId: string) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string, lessonName: string) => void;
  onMarkAsWatched: (lessonId: string, watched: boolean) => void;
}

export function LessonCard({
  lesson,
  onLessonClick,
  onEdit,
  onDelete,
  onMarkAsWatched
}: LessonCardProps) {

  const getMaterialIcons = () => {
    const icons = [];
    if (lesson.documents && lesson.documents.length > 0) {
      icons.push(<FileText key="pdf" className="h-4 w-4 text-red-500" />);
    }
    if (lesson.audio_file_path) {
      icons.push(<Headphones key="audio" className="h-4 w-4 text-blue-500" />);
    }
    if (lesson.website_url) {
      icons.push(<Link key="website" className="h-4 w-4 text-green-500" />);
    }
    if (lesson.html_file_path) {
        icons.push(<FileText key="html" className="h-4 w-4 text-orange-500" />);
    }
    return icons;
  };

  const calculatePerformance = () => {
    const totalQuestions = lesson.questions.length;
    if (totalQuestions === 0) return null;

    let questionsAnswered = 0;
    let questionsCorrect = 0;
    const answeredIds = new Set();

    lesson.questions.forEach(question => {
      const questionAttempts = lesson.attempts.filter(attempt => attempt.question_id === question.id);
      if (questionAttempts.length > 0) {
        if(!answeredIds.has(question.id)) {
            questionsAnswered++;
            answeredIds.add(question.id);
        }
        const latestAttempt = questionAttempts.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];
        if (latestAttempt.is_correct) {
          questionsCorrect++;
        }
      }
    });

    const accuracyPercentage = questionsAnswered > 0 ? Math.round(questionsCorrect / questionsAnswered * 100) : 0;
    const progressPercentage = totalQuestions > 0 ? Math.round(questionsAnswered / totalQuestions * 100) : 0;

    return {
      accuracyPercentage,
      progressPercentage,
      questionsCorrect,
      questionsAnswered,
      totalQuestions
    };
  }

  const performance = calculatePerformance();

  return (
    <div className="bg-white p-4 cursor-pointer border-b">
      <div className="flex items-start justify-between">
        <div className="flex-1" onClick={() => onLessonClick(lesson.id)}>
          <h3 className="text-base font-medium text-gray-900 mb-2">
            {lesson.name}
          </h3>

          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-1.5">
              <Clock className="h-4 w-4" />
              <span>{lesson.duration_minutes} min</span>
            </div>

            <div className="flex items-center space-x-2">
              {getMaterialIcons()}
            </div>

            {lesson.watched && (
              <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 border border-green-200 font-medium">
                <Check className="h-3 w-3" />
                <span>Assistida</span>
              </div>
            )}
             {lesson.rating && (
                <div className="flex items-center space-x-1.5 text-yellow-600">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{lesson.rating}/5</span>
                </div>
            )}
          </div>

          {performance && (
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Aproveitamento</span>
                <span className="font-medium text-blue-600">
                  {performance.accuracyPercentage}%
                </span>
              </div>
              <Progress value={performance.accuracyPercentage} className="h-2" />
              <div className="text-xs text-gray-500">
                {performance.questionsCorrect} de {performance.questionsAnswered} corretas • {performance.progressPercentage}% concluído
              </div>
            </div>
          )}

        </div>

        <div className="ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onEdit(lesson)}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(lesson.id, lesson.name)} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMarkAsWatched(lesson.id, !lesson.watched)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {lesson.watched ? 'Desmarcar' : 'Marcar como assistida'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
