
import { CheckCircle, FileText, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface VideoInfoProps {
  video: {
    id: string;
    title: string;
    url: string;
    duration: number;
    currentTime: number;
    completed: boolean;
  };
  currentTime: number;
  duration: number;
  onShowAnnotations: () => void;
  onShowExercises: () => void;
}

const VideoInfo = ({ video, currentTime, duration, onShowAnnotations, onShowExercises }: VideoInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{video.title}</span>
          {video.completed && (
            <span className="text-green-600 text-sm font-medium flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Concluído
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progresso</span>
              <span>{Math.round((currentTime / duration) * 100)}%</span>
            </div>
            <Progress value={(currentTime / duration) * 100} className="h-2" />
          </div>

          <div className="flex space-x-3">
            <Button onClick={onShowAnnotations} variant="outline" className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Anotações
            </Button>
            <Button onClick={onShowExercises} variant="outline" className="flex-1">
              <BookOpen className="w-4 h-4 mr-2" />
              Exercícios
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoInfo;
