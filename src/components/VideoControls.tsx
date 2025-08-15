
import React from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMute: () => void;
  onFullscreen: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onRestart: () => void;
}

const VideoControls = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMute,
  onFullscreen,
  onSkipBack,
  onSkipForward,
  onRestart
}: VideoControlsProps) => {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
      {/* Progress Bar */}
      <div className="mb-4">
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={(value) => onSeek(value[0])}
          className="w-full cursor-pointer"
        />
        <div className="flex justify-between text-white text-sm mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRestart}
            className="text-white hover:bg-white/20"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSkipBack}
            className="text-white hover:bg-white/20"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onPlayPause}
            className="text-white hover:bg-white/20"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSkipForward}
            className="text-white hover:bg-white/20"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <div className="w-20">
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={(value) => onVolumeChange(value[0])}
                className="cursor-pointer"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onFullscreen}
            className="text-white hover:bg-white/20"
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoControls;
