import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface AulaStreamingData {
  id: string;
  title: string;
  url: string;
  duration: number;
  currentTime: number;
  completed: boolean;
}

interface AulasVideoPlayerProps {
  video: AulaStreamingData;
  onVideoProgress: (videoId: string, currentTime: number) => void;
  onVideoComplete: (videoId: string) => void;
  onBack: () => void;
}

const AulasVideoPlayer = ({ video, onVideoProgress, onVideoComplete, onBack }: AulasVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnd = () => {
      setIsPlaying(false);
      onVideoComplete(video.id);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnd);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnd);
    };
  }, [video.id, onVideoComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && videoRef.current) {
        onVideoProgress(video.id, videoRef.current.currentTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, video.id, onVideoProgress]);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const newTime = value[0];
    videoElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const newVolume = value[0];
    videoElement.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isMuted) {
      videoElement.volume = volume;
      setIsMuted(false);
    } else {
      videoElement.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Botão Voltar */}
      <Button
        onClick={onBack}
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 z-50 bg-black/50 text-white hover:bg-black/70"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      {/* Título do Vídeo */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/50 px-4 py-2 rounded text-white">
        <h2 className="text-lg font-semibold">{video.title}</h2>
      </div>

      {/* Player de Vídeo */}
      {video.url && video.url !== '#' ? (
        video.url.includes('drive.google.com') || video.url.includes('youtube.com') || video.url.includes('vimeo.com') ? (
          // Usar iframe para Google Drive, YouTube, Vimeo
          <iframe
            src={video.url}
            className="w-full h-full"
            frameBorder="0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          // Usar video element para outros casos
          <video
            ref={videoRef}
            src={video.url}
            className="w-full h-full object-contain"
            onClick={togglePlay}
            controls
          />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white">
          <div className="text-center">
            <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl">URL do vídeo não configurada</p>
            <p className="text-gray-400 mt-2">Configure a URL na seção Resumos</p>
          </div>
        </div>
      )}

      {/* Controles - apenas para vídeos normais, não para iframes */}
      {showControls && !video.url.includes('drive.google.com') && !video.url.includes('youtube.com') && !video.url.includes('vimeo.com') && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Barra de Progresso */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
          </div>

          {/* Controles Principais */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <Button
                onClick={togglePlay}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={toggleMute}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
                
                <div className="w-20">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              
              <Button
                onClick={toggleFullscreen}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AulasVideoPlayer;