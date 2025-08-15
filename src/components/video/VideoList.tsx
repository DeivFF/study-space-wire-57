
import { Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Video {
  id: string;
  title: string;
  url: string;
  duration: number;
  currentTime: number;
  completed: boolean;
}

interface VideoListProps {
  videos: Video[];
  onVideoSelect: (video: Video) => void;
}

const VideoList = ({ videos, onVideoSelect }: VideoListProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Próximos Vídeos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {videos.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            Nenhum outro vídeo disponível
          </p>
        ) : (
          videos.map((video) => (
            <div
              key={video.id}
              onClick={() => onVideoSelect(video)}
              className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                <Play className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                  {video.title}
                </h4>
                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                  <span>{formatTime(video.duration)}</span>
                  {video.completed && (
                    <span className="text-green-600">• Concluído</span>
                  )}
                  {video.currentTime > 0 && !video.completed && (
                    <span className="text-blue-600">
                      • {Math.round((video.currentTime / video.duration) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default VideoList;
