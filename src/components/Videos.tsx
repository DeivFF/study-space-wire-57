import { useState } from 'react';
import { Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import VideoPlayer from './VideoPlayer';
import GerenciarVideos from './GerenciarVideos';
import VideoCategoryCard from './videos/VideoCategoryCard';
import VideosCategoryForm from './videos/VideosCategoryForm';
import { useSupabaseVideos } from '@/hooks/useSupabaseVideos';

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

const Videos = () => {
  const [selectedVideo, setSelectedVideo] = useState<VideoDisplay | null>(null);
  const [showManageVideos, setShowManageVideos] = useState(false);
  const [managingCategory, setManagingCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { 
    categories, 
    videos, 
    loading, 
    atualizarProgressoVideo, 
    marcarVideoComoConcluido, 
    obterUrlVideo,
    criarCategoria
  } = useSupabaseVideos();

  const displayCategories: VideoCategoryDisplay[] = categories.map(category => ({
    id: category.id,
    name: category.name,
    videos: videos
      .filter(video => video.category_id === category.id)
      .map(video => ({
        id: video.id,
        title: video.title,
        url: obterUrlVideo(video.file_path),
        duration: video.duration,
        currentTime: video.current_time_seconds,
        completed: video.completed
      })),
    expanded: expandedCategories[category.id] || false
  }));

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleVideoSelect = (video: VideoDisplay) => {
    setSelectedVideo(video);
  };

  const handleVideoProgress = (videoId: string, currentTime: number) => {
    atualizarProgressoVideo(videoId, Math.floor(currentTime));
  };

  const handleVideoComplete = (videoId: string) => {
    marcarVideoComoConcluido(videoId);
  };

  const openManageVideos = (categoryId: string) => {
    setManagingCategory(categoryId);
    setShowManageVideos(true);
  };

  const handleCreateCategory = async () => {
    if (newCategoryName.trim()) {
      await criarCategoria(newCategoryName.trim());
      setNewCategoryName('');
      setShowCreateCategory(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando vídeos...</div>
      </div>
    );
  }

  if (showManageVideos && managingCategory) {
    return (
      <GerenciarVideos
        onClose={() => {
          setShowManageVideos(false);
          setManagingCategory(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Vídeos</h1>
        <VideosCategoryForm
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          showCreateCategory={showCreateCategory}
          setShowCreateCategory={setShowCreateCategory}
          onCreateCategory={handleCreateCategory}
        />
      </div>

      {selectedVideo ? (
        <VideoPlayer
          video={selectedVideo}
          categories={displayCategories}
          onVideoSelect={handleVideoSelect}
          onVideoProgress={handleVideoProgress}
          onVideoComplete={handleVideoComplete}
          onBack={() => setSelectedVideo(null)}
        />
      ) : (
        <div className="grid gap-4">
          {displayCategories.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-gray-500">
                  <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma categoria criada ainda</p>
                  <p className="text-sm">Clique em "Nova Categoria" para começar</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            displayCategories.map((category) => (
              <VideoCategoryCard
                key={category.id}
                category={category}
                onToggleCategory={toggleCategory}
                onManageVideos={openManageVideos}
                onVideoSelect={handleVideoSelect}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Videos;
