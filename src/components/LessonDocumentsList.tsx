
import { useEffect, useState } from 'react';
import { FileText, Eye, Download, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseLessonDocuments } from '@/hooks/useSupabaseLessonDocuments';
import { useSupabaseLessonFiles } from '@/hooks/useSupabaseLessonFiles';

interface LessonDocumentsListProps {
  lessonId: string;
  lessonTitle: string;
  onBack: () => void;
}

const LessonDocumentsList = ({ lessonId, lessonTitle, onBack }: LessonDocumentsListProps) => {
  const { documents, loading, carregarDocumentos, getDocumentUrl } = useSupabaseLessonDocuments();
  const { getFileUrl } = useSupabaseLessonFiles();
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentAudioPath, setCurrentAudioPath] = useState<string | null>(null);

  useEffect(() => {
    carregarDocumentos(lessonId);
  }, [lessonId, carregarDocumentos]);

  const lessonDocuments = documents.filter(doc => doc.lesson_id === lessonId);

  const handleViewDocument = (document: any) => {
    try {
      const url = getDocumentUrl(document.file_path);
      console.log('Document URL:', url);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erro ao abrir documento:', error);
    }
  };

  const handlePlayAudio = (audioPath: string) => {
    // Se já há um áudio tocando, pausar
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlaying(false);
    }

    try {
      const audioUrl = getFileUrl(audioPath);
      console.log('Audio URL:', audioUrl);
      
      const audio = new Audio(audioUrl);
      
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setCurrentAudioPath(null);
      });

      audio.addEventListener('error', (e) => {
        console.error('Erro ao carregar áudio:', e);
      });

      audio.play();
      setCurrentAudio(audio);
      setIsPlaying(true);
      setCurrentAudioPath(audioPath);
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
    }
  };

  const handlePauseAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
    }
  };

  const handleResumeAudio = () => {
    if (currentAudio) {
      currentAudio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (currentAudio) {
      currentAudio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button onClick={onBack} variant="outline">
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-600">{lessonTitle}</p>
        </div>
      </div>

      {lessonDocuments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento encontrado</h3>
            <p className="text-gray-600">
              Adicione documentos para esta aula usando o botão "Material"
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {lessonDocuments.map((document) => (
            <Card key={document.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-red-600" />
                    <div>
                      <CardTitle className="text-lg">{document.title}</CardTitle>
                      <p className="text-sm text-gray-600">{document.file_name}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleViewDocument(document)}
                      size="sm"
                      variant="outline"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Visualizar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Adicionado em: {formatDate(document.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Player de Áudio Inline */}
      {currentAudio && currentAudioPath && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5" />
              <span>Player de Áudio</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={isPlaying ? handlePauseAudio : handleResumeAudio}
                  size="sm"
                  variant="outline"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                <div className="text-sm text-gray-600 min-w-[80px]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LessonDocumentsList;
