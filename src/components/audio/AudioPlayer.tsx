import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Shuffle,
  Repeat,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAudioPersistence } from '@/hooks/useAudioPersistence';

interface AudioTrack {
  id: string;
  title: string;
  audioPath: string;
  categoryName?: string;
  categoryId?: string;
}

interface AudioPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffling: boolean;
  isRepeating: boolean;
}

interface AudioPlayerProps {
  currentTrack: AudioTrack | null;
  audioTracks: AudioTrack[];
  currentTrackIndex: number;
  playerState: AudioPlayerState;
  onTrackChange: (track: AudioTrack, index?: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onPlayerStateUpdate: (updates: Partial<AudioPlayerState>) => void;
  onAudioEnded: () => void;
  getFileUrl: (path: string) => string;
}

const AudioPlayer = ({ 
  currentTrack, 
  audioTracks, 
  currentTrackIndex, 
  playerState,
  onTrackChange, 
  onNext,
  onPrevious,
  onPlayerStateUpdate,
  onAudioEnded,
  getFileUrl 
}: AudioPlayerProps) => {
  const { toast } = useToast();
  const [audioError, setAudioError] = useState<string | null>(null);
  const [hasRestoredPosition, setHasRestoredPosition] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUrlRef = useRef<string | null>(null);
  const positionSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { 
    savePosition, 
    getSavedPosition, 
    isRestoringPosition, 
    setRestoring,
    persistedData 
  } = useAudioPersistence();

  // Format time helper
  const formatTime = useCallback((time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Debounced position save
  const debouncedSavePosition = useCallback((trackId: string, position: number) => {
    if (positionSaveTimeoutRef.current) {
      clearTimeout(positionSaveTimeoutRef.current);
    }
    
    positionSaveTimeoutRef.current = setTimeout(() => {
      savePosition(trackId, position);
    }, 2000);
  }, [savePosition]);

  // Audio event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current && currentTrack) {
      const duration = audioRef.current.duration || 0;
      onPlayerStateUpdate({ 
        duration,
        isLoading: false 
      });
      setAudioError(null);
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      // Restore position if not yet restored
      if (!hasRestoredPosition) {
        const savedPosition = getSavedPosition(currentTrack.id);
        if (savedPosition > 0 && savedPosition < duration) {
          setRestoring(true);
          audioRef.current.currentTime = savedPosition;
          onPlayerStateUpdate({ currentTime: savedPosition });
          
          toast({
            title: "Posição restaurada",
            description: `Continuando de ${formatTime(savedPosition)}`,
            duration: 3000
          });
          
          setTimeout(() => {
            setRestoring(false);
          }, 1000);
        }
        setHasRestoredPosition(true);
      }
      
      console.log('Audio metadata loaded successfully');
    }
  }, [onPlayerStateUpdate, currentTrack, hasRestoredPosition, getSavedPosition, setRestoring, toast, formatTime]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && currentTrack) {
      const currentTime = audioRef.current.currentTime;
      onPlayerStateUpdate({ currentTime });
      
      // Save position with debounce
      if (currentTime > 0 && !isRestoringPosition) {
        debouncedSavePosition(currentTrack.id, currentTime);
      }
    }
  }, [onPlayerStateUpdate, currentTrack, debouncedSavePosition, isRestoringPosition]);

  const handleEnded = useCallback(() => {
    console.log('Audio ended, calling onAudioEnded');
    onAudioEnded();
  }, [onAudioEnded]);

  const handleError = useCallback((error?: any) => {
    console.error('Audio error occurred:', error);
    onPlayerStateUpdate({ isLoading: false, isPlaying: false });
    setAudioError('Erro ao carregar o áudio');
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    toast({
      title: "Erro de reprodução",
      description: "Não foi possível reproduzir o áudio. Verifique se o arquivo existe.",
      variant: "destructive"
    });
  }, [toast, onPlayerStateUpdate]);

  const handleCanPlay = useCallback(() => {
    onPlayerStateUpdate({ isLoading: false });
    setAudioError(null);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    console.log('Audio can play');
  }, [onPlayerStateUpdate]);

  const handleLoadStart = useCallback(() => {
    onPlayerStateUpdate({ isLoading: true });
    setAudioError(null);
    console.log('Audio load started');
    
    // Set a timeout to prevent infinite loading
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = setTimeout(() => {
      if (audioRef.current && audioRef.current.readyState < 2) {
        console.log('Audio loading timeout');
        handleError('Timeout ao carregar áudio');
      }
    }, 10000);
  }, [handleError, onPlayerStateUpdate]);

  // Setup audio when track changes - prevent infinite loops
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;

    const audio = audioRef.current;
    
    try {
      const audioUrl = getFileUrl(currentTrack.audioPath);
      
      // Only update if URL actually changed to prevent infinite loops
      if (audioUrl !== lastUrlRef.current) {
        console.log('Setting up audio for:', currentTrack.title);
        console.log('Audio URL:', audioUrl);
        
        lastUrlRef.current = audioUrl;
        setHasRestoredPosition(false);
        
        // Reset states
        onPlayerStateUpdate({
          isPlaying: false,
          currentTime: 0,
          duration: 0
        });
        
        // Clear any existing timeout
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }

        audio.src = audioUrl;
        audio.load();
      }
    } catch (error) {
      console.error('Error setting audio source:', error);
      handleError(error);
    }
  }, [currentTrack?.id, currentTrack?.audioPath, getFileUrl, onPlayerStateUpdate, handleError]);

  // Handle play/pause state changes from parent
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const audio = audioRef.current;

    if (playerState.isPlaying && audio.paused) {
      if (audio.readyState >= 2) {
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
          handleError(error);
        });
      }
    } else if (!playerState.isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [playerState.isPlaying, currentTrack, handleError]);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onError = (e: any) => handleError(e);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [handleLoadedMetadata, handleTimeUpdate, handleEnded, handleError, handleCanPlay, handleLoadStart]);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = playerState.isMuted ? 0 : playerState.volume;
    }
  }, [playerState.volume, playerState.isMuted]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (positionSaveTimeoutRef.current) {
        clearTimeout(positionSaveTimeoutRef.current);
      }
    };
  }, []);

  const handlePlayPause = useCallback(async () => {
    if (!audioRef.current || !currentTrack) return;

    try {
      if (playerState.isPlaying) {
        audioRef.current.pause();
        onPlayerStateUpdate({ isPlaying: false });
        console.log('Audio paused');
      } else {
        if (audioRef.current.readyState >= 2) {
          onPlayerStateUpdate({ isLoading: true });
          await audioRef.current.play();
          onPlayerStateUpdate({ isPlaying: true, isLoading: false });
          console.log('Audio playing');
        } else {
          console.log('Audio not ready, waiting...');
          onPlayerStateUpdate({ isLoading: true });
          
          const waitForReady = () => {
            if (audioRef.current && audioRef.current.readyState >= 2) {
              audioRef.current.play()
                .then(() => {
                  onPlayerStateUpdate({ isPlaying: true, isLoading: false });
                  console.log('Audio playing after wait');
                })
                .catch(error => {
                  console.error('Error playing audio after wait:', error);
                  handleError(error);
                });
            } else {
              setTimeout(waitForReady, 100);
            }
          };
          waitForReady();
        }
      }
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      onPlayerStateUpdate({ isLoading: false, isPlaying: false });
      setAudioError('Erro ao reproduzir áudio');
      handleError(error);
    }
  }, [playerState.isPlaying, currentTrack, handleError, onPlayerStateUpdate]);

  const handleSeek = useCallback((value: number[]) => {
    const newTime = value[0];
    if (audioRef.current && !isNaN(newTime) && currentTrack) {
      audioRef.current.currentTime = newTime;
      onPlayerStateUpdate({ currentTime: newTime });
      // Save position immediately on seek
      savePosition(currentTrack.id, newTime);
    }
  }, [onPlayerStateUpdate, currentTrack, savePosition]);

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    onPlayerStateUpdate({ 
      volume: newVolume,
      isMuted: newVolume === 0
    });
  }, [onPlayerStateUpdate]);

  const toggleMute = useCallback(() => {
    onPlayerStateUpdate({ isMuted: !playerState.isMuted });
  }, [playerState.isMuted, onPlayerStateUpdate]);

  const toggleShuffle = useCallback(() => {
    onPlayerStateUpdate({ isShuffling: !playerState.isShuffling });
  }, [playerState.isShuffling, onPlayerStateUpdate]);

  const toggleRepeat = useCallback(() => {
    onPlayerStateUpdate({ isRepeating: !playerState.isRepeating });
  }, [playerState.isRepeating, onPlayerStateUpdate]);

  // Get saved position display
  const savedPosition = currentTrack ? getSavedPosition(currentTrack.id) : 0;

  if (!currentTrack) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Track info */}
      <div className="text-center">
        <h3 className="text-lg font-semibold">{currentTrack.title}</h3>
        <p className="text-sm text-gray-600">{currentTrack.categoryName}</p>
        {audioError && (
          <p className="text-sm text-red-600 mt-1">{audioError}</p>
        )}
        {isRestoringPosition && (
          <p className="text-sm text-blue-600 mt-1 flex items-center justify-center gap-1">
            <RotateCcw className="w-3 h-3 animate-spin" />
            Restaurando posição...
          </p>
        )}
        {savedPosition > 0 && !isRestoringPosition && (
          <p className="text-xs text-gray-500 mt-1">
            Última posição salva: {formatTime(savedPosition)}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Slider
          value={[playerState.currentTime]}
          max={playerState.duration || 0}
          step={1}
          onValueChange={handleSeek}
          disabled={playerState.isLoading || !!audioError}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-600">
          <span>{formatTime(playerState.currentTime)}</span>
          <span>{formatTime(playerState.duration)}</span>
        </div>
      </div>

      {/* Main controls */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleShuffle}
          className={playerState.isShuffling ? 'bg-blue-100 text-blue-600' : ''}
        >
          <Shuffle className="w-4 h-4" />
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={onPrevious}
          disabled={audioTracks.length === 0}
        >
          <SkipBack className="w-4 h-4" />
        </Button>

        <Button 
          size="lg" 
          onClick={handlePlayPause}
          disabled={!currentTrack || !!audioError}
        >
          {playerState.isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : playerState.isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={onNext}
          disabled={audioTracks.length === 0}
        >
          <SkipForward className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleRepeat}
          className={playerState.isRepeating ? 'bg-blue-100 text-blue-600' : ''}
        >
          <Repeat className="w-4 h-4" />
        </Button>
      </div>

      {/* Volume control */}
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" onClick={toggleMute}>
          {playerState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
        <Slider
          value={[playerState.isMuted ? 0 : playerState.volume]}
          max={1}
          step={0.1}
          onValueChange={handleVolumeChange}
          className="flex-1"
        />
      </div>

      {/* Audio element */}
      <audio
        ref={audioRef}
        preload="metadata"
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default AudioPlayer;
