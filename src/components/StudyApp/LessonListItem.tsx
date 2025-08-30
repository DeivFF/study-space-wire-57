import { Play, Trash, FileText, Headphones, Code, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lesson } from '@/contexts/StudyAppContext';
import { useStudyApp } from '@/contexts/StudyAppContext';

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

  const handleOpenLesson = () => {
    dispatch({ type: 'SET_SELECTED_LESSON', payload: lesson.id });
    dispatch({ type: 'SET_APP_MODE', payload: 'detail' });
  };

  const handleDeleteLesson = () => {
    dispatch({ type: 'DELETE_LESSON', payload: lesson.id });
  };

  return (
    <div className="grid grid-cols-[40px_1fr_180px_120px_260px_40px] gap-2 px-3 py-2 items-center hover:bg-app-muted/60">
      <div>
        <input type="checkbox" />
      </div>
      
      <button 
        onClick={handleOpenLesson}
        className="flex flex-col items-start text-left bg-transparent border-none p-0"
      >
        <div className="font-semibold text-app-text">{lesson.title}</div>
        <div className="text-xs text-app-text-muted">
          Atualizado {new Date(lesson.updatedAt).toLocaleDateString()}
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
      
      <div className="flex flex-wrap gap-1">
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
      
      <div className="flex gap-1">
        <Button 
          variant="ghost" 
          size="icon"
          className="text-app-text-muted hover:text-app-text hover:bg-app-muted"
        >
          <Play className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleDeleteLesson}
          className="text-app-text-muted hover:text-app-danger hover:bg-app-danger/10"
        >
          <Trash className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}