import { useState } from 'react';
import { Eye, MoreHorizontal, FileText, Headphones, Code, Globe, Dumbbell, CreditCard, Trash, Edit, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Lesson } from '@/contexts/StudyAppContext';
import { useStudyApp } from '@/contexts/StudyAppContext';
import { FlashcardPracticeModal, ExercisePracticeModal } from '@/components/StudyApp/Practice';

const resourceIcons = {
  pdf: FileText,
  audio: Headphones,
  html: Code,
  site: Globe
};

interface LessonCardProps {
  lesson: Lesson;
  onEdit?: (lesson: any) => void;
}

export function LessonCard({ lesson, onEdit }: LessonCardProps) {
  const { dispatch, state } = useStudyApp();
  const [showFlashcardPractice, setShowFlashcardPractice] = useState(false);
  const [showExercisePractice, setShowExercisePractice] = useState(false);

  const handleOpenLesson = () => {
    dispatch({ type: 'SET_SELECTED_LESSON', payload: lesson.id });
    dispatch({ type: 'SET_APP_MODE', payload: 'detail' });
  };

  const handleDeleteLesson = () => {
    dispatch({ type: 'DELETE_LESSON', payload: lesson.id });
  };

  const handlePracticeExercise = () => {
    setShowExercisePractice(true);
  };

  const handlePracticeFlashcards = () => {
    setShowFlashcardPractice(true);
  };

  const handleMarkAsWatched = () => {
    dispatch({ type: 'TOGGLE_LESSON_WATCHED', payload: lesson.id });
  };

  const handleEditLesson = () => {
    if (onEdit) {
      // Convert the StudyApp lesson format to the backend lesson format
      const backendLesson = {
        id: parseInt(lesson.id),
        title: lesson.title,
        duration_minutes: lesson.durationMinutes,
        subject_id: state.selectedCategoryId, // Use the current selected category as subject_id
      };
      onEdit(backendLesson);
    }
  };

  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty) {
      case 'facil': return 'secondary';
      case 'medio': return 'outline';
      case 'dificil': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div 
      className="bg-app-bg-soft border border-app-border rounded-2xl overflow-hidden cursor-pointer hover:bg-app-muted/30 transition-colors"
      onClick={handleOpenLesson}
    >
      <div className="p-3 pb-2 flex gap-3 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleOpenLesson();
              }}
              className="font-semibold text-app-text text-left bg-transparent border-none p-0 hover:text-app-accent cursor-pointer flex items-center gap-2 pointer-events-auto"
            >
              {lesson.title}
              {lesson.watched && (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div 
              className="pointer-events-none"
              onClick={(e) => e.stopPropagation()}
            >
              <Badge variant={getDifficultyVariant(lesson.difficulty)} className="capitalize">
                {lesson.difficulty}
              </Badge>
            </div>
            {lesson.status === 'estudado' && (
              <Badge className="bg-app-success/20 text-app-success border-app-success/30 pointer-events-none">
                Estudado
              </Badge>
            )}
            <span className="text-xs text-app-text-muted pointer-events-none">
              {lesson.durationMinutes ? `${lesson.durationMinutes} min` : 'Duração não definida'}
            </span>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-app-text-muted hover:text-app-text hover:bg-app-muted"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-app-panel border-app-border" align="end" sideOffset={4}>
            <DropdownMenuItem 
              onClick={handlePracticeExercise}
              className="text-app-text hover:bg-app-muted focus:bg-app-muted"
            >
              <Dumbbell className="w-4 h-4 mr-2" />
              Praticar exercício
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handlePracticeFlashcards}
              className="text-app-text hover:bg-app-muted focus:bg-app-muted"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Praticar flashcards
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleMarkAsWatched}
              className="text-app-text hover:bg-app-muted focus:bg-app-muted"
            >
              <Eye className="w-4 h-4 mr-2" />
              Marcar como assistido
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleEditLesson}
              className="text-app-text hover:bg-app-muted focus:bg-app-muted"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDeleteLesson}
              className="text-app-danger hover:bg-app-danger/10 focus:bg-app-danger/10"
            >
              <Trash className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-app-muted rounded-full h-2">
            <div 
              className="h-2 bg-gradient-to-r from-app-accent to-app-accent-2 rounded-full transition-all"
              style={{ width: `${lesson.progress}%` }}
            />
          </div>
          <div className="text-xs text-app-text-muted w-10 text-right">
            {lesson.progress}%
          </div>
        </div>
        
        <div 
          className="flex flex-wrap gap-1 mb-3 pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          {lesson.resources.map((resource) => {
            const Icon = resourceIcons[resource.type];
            return (
              <Badge 
                key={resource.id}
                variant={resource.primary ? "default" : "outline"}
                className="text-xs"
              >
                <Icon className="w-3 h-3 mr-1" />
                {resource.type.toUpperCase()}
              </Badge>
            );
          })}
        </div>
        
      </div>

      {/* Practice Modals */}
      <FlashcardPracticeModal
        isOpen={showFlashcardPractice}
        onClose={() => setShowFlashcardPractice(false)}
        lessonId={lesson.id}
        lessonTitle={lesson.title}
      />
      
      <ExercisePracticeModal
        isOpen={showExercisePractice}
        onClose={() => setShowExercisePractice(false)}
        lessonId={lesson.id}
        lessonTitle={lesson.title}
      />
    </div>
  );
}