
import { ChevronDown, ChevronRight, Settings, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VideoDisplay {
  id: string;
  title: string;
  url: string;
  duration: number;
  currentTime: number;
  completed: boolean;
}

interface VideoCategoryDisplay {
  id: string;
  name: string;
  videos: VideoDisplay[];
  expanded: boolean;
}

interface VideoCategoryCardProps {
  category: VideoCategoryDisplay;
  onToggleCategory: (categoryId: string) => void;
  onManageVideos: (categoryId: string) => void;
  onVideoSelect: (video: VideoDisplay) => void;
}

const VideoCategoryCard = ({ 
  category, 
  onToggleCategory, 
  onManageVideos, 
  onVideoSelect 
}: VideoCategoryCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleCategory(category.id)}
              className="flex items-center space-x-2 text-left hover:text-blue-600 transition-colors"
            >
              {category.expanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
              <CardTitle className="text-lg">{category.name}</CardTitle>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {category.videos.length} vídeos
            </span>
            <Button
              onClick={() => onManageVideos(category.id)}
              size="sm"
              variant="outline"
              className="h-8"
            >
              <Settings className="w-4 h-4 mr-1" />
              Gerenciar Aulas
            </Button>
          </div>
        </div>
      </CardHeader>

      {category.expanded && (
        <CardContent className="pt-0">
          {category.videos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum vídeo adicionado ainda</p>
              <p className="text-sm">Clique em "Gerenciar" para adicionar vídeos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {category.videos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => onVideoSelect(video)}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex-shrink-0">
                    <Play className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {video.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </span>
                      {video.currentTime > 0 && !video.completed && (
                        <span className="text-blue-600">
                          • Assistido até {Math.floor(video.currentTime / 60)}:{(Math.floor(video.currentTime) % 60).toString().padStart(2, '0')}
                        </span>
                      )}
                      {video.completed && (
                        <span className="text-green-600 font-medium">• Concluído</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default VideoCategoryCard;
