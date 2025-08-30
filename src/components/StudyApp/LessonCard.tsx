import { Eye, Play, Trash, FileText, Headphones, Code, Globe } from 'lucide-react';
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

interface LessonCardProps {
  lesson: Lesson;
}

export function LessonCard({ lesson }: LessonCardProps) {
  const { dispatch } = useStudyApp();

  const handleOpenLesson = () => {
    dispatch({ type: 'SET_SELECTED_LESSON', payload: lesson.id });
    dispatch({ type: 'SET_APP_MODE', payload: 'detail' });
  };

  const handleDeleteLesson = () => {
    dispatch({ type: 'DELETE_LESSON', payload: lesson.id });
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
    <div className="bg-app-bg-soft border border-app-border rounded-2xl overflow-hidden">
      <div className="p-3 pb-2 flex gap-3 items-start">
        <input 
          type="checkbox" 
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-app-text truncate">{lesson.title}</div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={getDifficultyVariant(lesson.difficulty)} className="capitalize">
              {lesson.difficulty}
            </Badge>
            {lesson.status === 'estudado' && (
              <Badge className="bg-app-success/20 text-app-success border-app-success/30">
                Estudado
              </Badge>
            )}
            <span className="text-xs text-app-text-muted">
              {new Date(lesson.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleDeleteLesson}
          className="text-app-text-muted hover:text-app-danger hover:bg-app-danger/10"
        >
          <Trash className="w-4 h-4" />
        </Button>
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
        
        <div className="flex flex-wrap gap-1 mb-3">
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
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleOpenLesson}
            className="bg-app-bg border border-app-border text-app-text hover:bg-app-muted"
          >
            <Eye className="w-4 h-4" />
            Abrir
          </Button>
          <Button 
            variant="outline"
            className="bg-transparent border-app-border text-app-text hover:bg-app-muted"
          >
            <Play className="w-4 h-4" />
            Praticar
          </Button>
          <div className="flex-1" />
          <div className="text-sm text-app-text">
            Acerto: <span className="font-semibold">{lesson.accuracy}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}