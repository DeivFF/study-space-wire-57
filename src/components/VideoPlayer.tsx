import { useState, useRef, useEffect } from 'react';
import VideoPlayerControls from './video/VideoPlayerControls';
import VideoInfo from './video/VideoInfo';
import VideoList from './video/VideoList';
import VideoAnnotations from './VideoAnnotations';
import VideoExercises from './VideoExercises';

interface Video {
  id: string;
  title: string;
  url: string;
  duration: number;
  currentTime: number;
  completed: boolean;
}

interface VideoCategory {
  id: string;
  name: string;
  videos: Video[];
  expanded: boolean;
}

interface VideoPlayerProps {
  video: Video;
  categories: VideoCategory[];
  onVideoSelect: (video: Video) => void;
  onVideoProgress: (videoId: string, currentTime: number) => void;
  onVideoComplete: (videoId: string) => void;
  onBack: () => void;
}

const VideoPlayer = ({ 
  video, 
  categories, 
  onVideoSelect, 
  onVideoProgress, 
  onVideoComplete, 
  onBack 
}: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(video.currentTime);
  const [duration, setDuration] = useState(video.duration);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const watchTimeRef = useRef(0);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = video.currentTime;
      setCurrentTime(video.currentTime);
    }
  }, [video.id, video.currentTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && isPlaying) {
        const time = videoRef.current.currentTime;
        setCurrentTime(time);
        onVideoProgress(video.id, time);
        
        watchTimeRef.current += 1;
        
        localStorage.setItem(`video-progress-${video.id}`, time.toString());
        
        const currentStats = JSON.parse(localStorage.getItem('cnuStudyStats') || '{}');
        const tempoVideoAssistido = (currentStats.tempoVideoAssistido || 0) + 1;
        
        const updatedStats = {
          ...currentStats,
          tempoVideoAssistido,
          tempoEstudo: (currentStats.tempoEstudo || 0) + (1/60)
        };
        
        localStorage.setItem('cnuStudyStats', JSON.stringify(updatedStats));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, video.id, onVideoProgress]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onVideoProgress(video.id, newTime);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    onVideoComplete(video.id);
    localStorage.removeItem(`video-progress-${video.id}`);
  };

  const markAsComplete = () => {
    onVideoComplete(video.id);
    setIsPlaying(false);
    localStorage.removeItem(`video-progress-${video.id}`);
  };

  const allVideos = categories.flatMap(cat => cat.videos);
  const otherVideos = allVideos.filter(v => v.id !== video.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3 space-y-4">
        <VideoPlayerControls
          videoRef={videoRef}
          containerRef={containerRef}
          video={video}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          onBack={onBack}
          onPlayPause={togglePlay}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onToggleMute={toggleMute}
          onToggleFullscreen={toggleFullscreen}
          onMarkComplete={markAsComplete}
        />

        <VideoInfo
          video={video}
          currentTime={currentTime}
          duration={duration}
          onShowAnnotations={() => setShowAnnotations(true)}
          onShowExercises={() => setShowExercises(true)}
        />
      </div>

      <div className="space-y-4">
        <VideoList
          videos={otherVideos}
          onVideoSelect={onVideoSelect}
        />
      </div>

      <VideoAnnotations
        videoId={video.id}
        videoTitle={video.title}
        currentTime={currentTime}
        isOpen={showAnnotations}
        onClose={() => setShowAnnotations(false)}
      />

      <VideoExercises
        videoId={video.id}
        videoTitle={video.title}
        isOpen={showExercises}
        onClose={() => setShowExercises(false)}
      />
    </div>
  );
};

export default VideoPlayer;
