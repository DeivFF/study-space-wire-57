
import { useState, useRef } from 'react';
import { ArrowLeft, Play, Pause, Volume2, Maximize, CheckCircle, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface VideoPlayerControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  video: {
    id: string;
    title: string;
    url: string;
    duration: number;
    currentTime: number;
    completed: boolean;
  };
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onBack: () => void;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onMarkComplete: () => void;
}

const VideoPlayerControls = ({
  videoRef,
  containerRef,
  video,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onBack,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onMarkComplete
}: VideoPlayerControlsProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <Button onClick={onBack} variant="outline" className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar à Lista
      </Button>

      <Card>
        <CardContent className="p-0">
          <div ref={containerRef} className="relative bg-black rounded-t-lg overflow-hidden">
            <video
              ref={videoRef}
              src={video.url}
              className="w-full aspect-video"
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={onPlayPause}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={onToggleMute}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="w-16 h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <Button
                  onClick={onToggleFullscreen}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="w-5 h-5" />
                </Button>
                
                <Button
                  onClick={onMarkComplete}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  <CheckCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoPlayerControls;
