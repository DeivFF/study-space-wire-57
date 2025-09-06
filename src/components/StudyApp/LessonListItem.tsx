import { MoreHorizontal, FileText, Headphones, Code, Globe, Dumbbell, CreditCard, Trash, Edit, Eye, Check } from 'lucide-react';
import { useState } from 'react';
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

interface LessonListItemProps {
  lesson: Lesson;
}

export function LessonListItem({ lesson }: LessonListItemProps) {
  const { dispatch } = useStudyApp();
  const [exercisePracticeModal, setExercisePracticeModal] = useState(false);
  const [flashcardPracticeModal, setFlashcardPracticeModal] = useState(false);

  const handleOpenLesson = () => {
    dispatch({ type: 'SET_SELECTED_LESSON', payload: lesson.id });
    dispatch({ type: 'SET_APP_MODE', payload: 'detail' });
  };

  const handleDeleteLesson = () => {
    dispatch({ type: 'DELETE_LESSON', payload: lesson.id });
  };

  const handlePracticeExercise = () => {
    setExercisePracticeModal(true);
  };

  const handlePracticeFlashcards = () => {
    setFlashcardPracticeModal(true);
  };

  const handleMarkAsWatched = () => {
    dispatch({ type: 'TOGGLE_LESSON_WATCHED', payload: lesson.id });
  };

  const handleEditLesson = () => {
    // TODO: Implementar editar aula
    console.log('Editar aula:', lesson.id);
  };

  return (
    <div 
      className="grid grid-cols-[1fr_180px_120px_260px_40px] gap-2 px-3 py-2 items-center hover:bg-app-muted/60 cursor-pointer transition-colors"
      onClick={handleOpenLesson}
    >
      
      <button 
        onClick={(e) => {
          e.stopPropagation();
          handleOpenLesson();
        }}
        className="flex flex-col items-start text-left bg-transparent border-none p-0 pointer-events-auto"
      >
        <div className="flex items-center gap-2 w-full">
          <div className="font-semibold text-app-text flex items-center gap-2">
            {lesson.title}
            {lesson.watched && (
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
          </div>
        </div>
        <div className="text-xs text-app-text-muted">
          {lesson.durationMinutes ? `${lesson.durationMinutes} min` : 'Duração não definida'}
        </div>
      </button>
      
      <div>
        <div className="bg-app-muted rounded-full h-2">
          <div 
            className="h-2 bg-gradient-to-r from-app-accent to-app-accent-2 rounded-full"
            style={{ width: `${lesson.progress}%` }}
          />
        </div>
      </div>
      
      <div className="font-semibold text-app-text">
        {lesson.accuracy}%
      </div>
      
      <div 
        className="flex flex-wrap gap-1 pointer-events-none"
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
      
      <div 
        className="flex justify-center"
        onClick={(e) => e.stopPropagation()}
      >
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

      {/* Modals de Prática */}
      <ExercisePracticeModal
        isOpen={exercisePracticeModal}
        onClose={() => setExercisePracticeModal(false)}
        lessonId={lesson.id}
        lessonTitle={lesson.title}
      />
      
      <FlashcardPracticeModal
        isOpen={flashcardPracticeModal}
        onClose={() => setFlashcardPracticeModal(false)}
        lessonId={lesson.id}
        lessonTitle={lesson.title}
      />
    </div>
  );
}