
import { useEffect } from 'react';

interface UseVideoKeyboardsProps {
  onPlayPause: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (delta: number) => void;
  onMute: () => void;
  onFullscreen: () => void;
  onSpeedChange: (speed: number) => void;
  isVideoFocused: boolean;
}

export const useVideoKeyboards = ({
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMute,
  onFullscreen,
  onSpeedChange,
  isVideoFocused
}: UseVideoKeyboardsProps) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isVideoFocused) return;

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          onPlayPause();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onSeek(-10);
          break;
        case 'ArrowRight':
          event.preventDefault();
          onSeek(10);
          break;
        case 'ArrowUp':
          event.preventDefault();
          onVolumeChange(0.1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          onVolumeChange(-0.1);
          break;
        case 'KeyM':
          event.preventDefault();
          onMute();
          break;
        case 'KeyF':
          event.preventDefault();
          onFullscreen();
          break;
        case 'Digit1':
          event.preventDefault();
          onSpeedChange(0.5);
          break;
        case 'Digit2':
          event.preventDefault();
          onSpeedChange(1);
          break;
        case 'Digit3':
          event.preventDefault();
          onSpeedChange(1.25);
          break;
        case 'Digit4':
          event.preventDefault();
          onSpeedChange(1.5);
          break;
        case 'Digit5':
          event.preventDefault();
          onSpeedChange(2);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isVideoFocused, onPlayPause, onSeek, onVolumeChange, onMute, onFullscreen, onSpeedChange]);
};
