
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useSupabaseLessonTranscriptions } from '@/hooks/useSupabaseLessonTranscriptions';

interface AudioSubtitlesProps {
  lessonId: string;
  currentTime: number;
  isPlaying: boolean;
}

const AudioSubtitles = ({ lessonId, currentTime, isPlaying }: AudioSubtitlesProps) => {
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [currentSegment, setCurrentSegment] = useState<any>(null);

  const { segments } = useSupabaseLessonTranscriptions(lessonId);

  useEffect(() => {
    if (isPlaying) {
      const segment = segments.find(seg => 
        currentTime >= seg.start_time && currentTime <= seg.end_time
      );
      setCurrentSegment(segment || null);
    }
  }, [currentTime, segments, isPlaying]);

  // Função para converter segundos para formato "HH:MM:SS"
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showSubtitles || !currentSegment) {
    return (
      <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSubtitles(!showSubtitles)}
          className="text-xs"
        >
          {showSubtitles ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
          {showSubtitles ? 'Ocultar' : 'Mostrar'} Legendas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSubtitles(!showSubtitles)}
          className="text-xs"
        >
          <EyeOff className="w-3 h-3 mr-1" />
          Ocultar Legendas
        </Button>
      </div>
      
      <Card className="bg-black/80 border-gray-600">
        <CardContent className="p-3">
          <div className="text-center">
            <div className="text-xs text-gray-300 mb-1">
              {formatTime(currentSegment.start_time)} - {formatTime(currentSegment.end_time)}
            </div>
            <div className="text-white text-sm font-medium leading-relaxed">
              {currentSegment.text}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AudioSubtitles;
