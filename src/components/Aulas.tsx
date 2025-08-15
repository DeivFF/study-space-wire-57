import { useState, useEffect } from 'react';
import { Play, List, Files, ChevronLeft, ChevronRight, Pause, Volume2, Maximize, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseLessons } from '@/hooks/useSupabaseLessons';
import { useSupabaseLessonDocuments } from '@/hooks/useSupabaseLessonDocuments';
import { Progress } from '@/components/ui/progress';
import AulasVideoPlayer from './AulasVideoPlayer';
import AulasUploadModal from './AulasUploadModal';
interface AulaStreamingData {
  id: string;
  title: string;
  url: string;
  duration: number;
  currentTime: number;
  completed: boolean;
}
interface CategoryWithLessons {
  id: string;
  name: string;
  lessons: AulaStreamingData[];
  expanded: boolean;
}
const Aulas = () => {
  const {
    categories,
    lessons,
    loading,
    marcarAulaAssistida
  } = useSupabaseLessons();
  const {
    documents,
    getDocumentUrl
  } = useSupabaseLessonDocuments();
  const [selectedVideo, setSelectedVideo] = useState<AulaStreamingData | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [categoryData, setCategoryData] = useState<CategoryWithLessons[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("todas");

  // Converter dados para formato de streaming
  useEffect(() => {
    if (categories.length === 0 && lessons.length === 0) return;
    const processedCategories: CategoryWithLessons[] = categories.map(category => ({
      id: category.id,
      name: category.name,
      expanded: false,
      lessons: lessons.filter(lesson => lesson.category_id === category.id).map(lesson => ({
        id: lesson.id,
        title: lesson.name,
        url: lesson.website_url || '#',
        // Usar website_url como URL do vídeo
        duration: lesson.duration_minutes * 60,
        // Converter para segundos
        currentTime: 0,
        completed: lesson.watched
      })).sort((a, b) => {
        // Ordenar numericamente se começar com número
        const numA = parseInt(a.title.match(/^\d+/)?.[0] || '0');
        const numB = parseInt(b.title.match(/^\d+/)?.[0] || '0');
        if (numA > 0 && numB > 0) return numA - numB;
        return a.title.localeCompare(b.title);
      })
    }));
    setCategoryData(processedCategories);
  }, [categories, lessons]);
  const toggleCategory = (categoryId: string) => {
    setCategoryData(prev => prev.map(cat => cat.id === categoryId ? {
      ...cat,
      expanded: !cat.expanded
    } : cat));
  };
  const handleVideoSelect = (video: AulaStreamingData) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };
  const handleVideoProgress = (videoId: string, currentTime: number) => {
    // Salvar progresso no localStorage ou Supabase
    localStorage.setItem(`video_progress_${videoId}`, currentTime.toString());
  };
  const handleVideoComplete = async (videoId: string) => {
    // Marcar aula como assistida
    await marcarAulaAssistida(videoId, true);

    // Atualizar estado local
    setCategoryData(prev => prev.map(cat => ({
      ...cat,
      lessons: cat.lessons.map(lesson => lesson.id === videoId ? {
        ...lesson,
        completed: true
      } : lesson)
    })));
  };
  const handleBackToList = () => {
    setShowVideoPlayer(false);
    setSelectedVideo(null);
  };
  const getCurrentLessonIndex = () => {
    if (!selectedVideo) return -1;
    for (const category of categoryData) {
      const index = category.lessons.findIndex(lesson => lesson.id === selectedVideo.id);
      if (index !== -1) return index;
    }
    return -1;
  };
  const getNextLessons = (currentLessonId: string) => {
    const allLessons = categoryData.flatMap(cat => cat.lessons);
    const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLessonId);
    if (currentIndex === -1) return [];
    return allLessons.slice(currentIndex + 1, currentIndex + 6); // Próximas 5 aulas
  };
  const getLessonDocuments = (lessonId: string) => {
    return documents.filter(doc => doc.lesson_id === lessonId);
  };

  // Filtrar categorias baseado na seleção
  const filteredCategoryData = selectedCategoryFilter === "todas" ? categoryData : categoryData.filter(cat => cat.id === selectedCategoryFilter);
  if (loading) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando aulas...</div>
      </div>;
  }

  // Sempre mostrar o video player como tela principal
  const firstAvailableVideo = categoryData.flatMap(cat => cat.lessons)[0];
  const currentVideo = selectedVideo || firstAvailableVideo;
  if (!currentVideo) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Nenhuma aula disponível</div>
      </div>;
  }
  const nextLessons = getNextLessons(currentVideo.id);
  const lessonDocuments = getLessonDocuments(currentVideo.id);
  return <div className="h-full flex">
      {/* Player Principal */}
      <div className="flex-1 bg-black relative">
        <AulasVideoPlayer video={currentVideo} onVideoProgress={handleVideoProgress} onVideoComplete={handleVideoComplete} onBack={handleBackToList} />
      </div>

      {/* Sidebar Direita - Filtro, Próximas Aulas e Arquivos */}
      <div className={`bg-white border-l border-gray-200 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-80'}`}>
        {/* Botão de Toggle */}
        <div className="p-2 border-b bg-gray-50">
          <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full justify-center">
            {sidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>

        {!sidebarCollapsed && <>
            {/* Filtro de Categorias */}
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900 mb-3">Filtrar por Categoria</h3>
              <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as categorias</SelectItem>
                  {categories.map(category => <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Lista de Aulas */}
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900 mb-3">Aulas</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredCategoryData.flatMap(cat => cat.lessons).map(lesson => <button key={lesson.id} onClick={() => setSelectedVideo(lesson)} className={`w-full text-left p-3 rounded-lg border transition-colors ${currentVideo.id === lesson.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        {lesson.completed ? <Check className="w-4 h-4 text-green-500" /> : <Play className="w-4 h-4 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                        <p className="text-xs text-gray-500">{Math.floor(lesson.duration / 60)} min</p>
                      </div>
                    </div>
                  </button>)}
              </div>
            </div>

            {/* Próximas Aulas */}
            

            {/* Arquivos da Aula */}
            {lessonDocuments.length > 0 && <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Arquivos da Aula</h3>
                <div className="space-y-2">
                  {lessonDocuments.map(doc => <button key={doc.id} onClick={() => window.open(getDocumentUrl(doc.file_path), '_blank')} className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors">
                      <div className="flex items-center gap-2">
                        <Files className="w-4 h-4 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                          <p className="text-xs text-gray-500">{doc.document_type.toUpperCase()}</p>
                        </div>
                      </div>
                    </button>)}
                </div>
              </div>}
          </>}
      </div>
    </div>;
};
export default Aulas;