
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Music, Calendar, PlayCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useSupabaseLessons } from '@/hooks/useSupabaseLessons';
import { useSupabaseLessonFiles } from '@/hooks/useSupabaseLessonFiles';
import { useAudioPreferences } from '@/hooks/useAudioPreferences';
import { useDailyPlaylists } from '@/hooks/useDailyPlaylists';
import { useStudyActivityLogger } from '@/hooks/useStudyActivityLogger';
import AudioPlayer from './audio/AudioPlayer';
import AudioList from './audio/AudioList';
import AudioFilters from './audio/AudioFilters';
import AudioSubtitles from './AudioSubtitles';

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

const Audios = () => {
  const { lessons, categories } = useSupabaseLessons();
  const { getFileUrl } = useSupabaseLessonFiles();
  const { preferences, updatePreferences, isLoaded } = useAudioPreferences();
  const { dailyPlaylists, getTodayPlaylist, getYesterdayPlaylist } = useDailyPlaylists();
  const { logAudioPlayed } = useStudyActivityLogger();
  
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('library');
  const [activePlaylist, setActivePlaylist] = useState<string | null>(null);
  const [isLibraryExpanded, setIsLibraryExpanded] = useState(true);
  
  // Estados centralizados do player - inicializado com preferências
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: preferences.volume,
    isMuted: preferences.isMuted,
    isShuffling: preferences.isShuffling,
    isRepeating: preferences.isRepeating,
  });

  // Update player state when preferences are loaded
  useEffect(() => {
    if (isLoaded) {
      setPlayerState(prev => ({
        ...prev,
        volume: preferences.volume,
        isMuted: preferences.isMuted,
        isShuffling: preferences.isShuffling,
        isRepeating: preferences.isRepeating,
      }));
    }
  }, [isLoaded, preferences]);

  // Load audio tracks from lessons and organize by category then alphabetically
  useEffect(() => {
    const tracks: AudioTrack[] = lessons
      .filter(lesson => lesson.audio_file_path)
      .map(lesson => {
        const category = categories.find(cat => cat.id === lesson.category_id);
        return {
          id: lesson.id,
          title: lesson.name,
          audioPath: lesson.audio_file_path!,
          categoryName: category?.name || 'Sem categoria',
          categoryId: lesson.category_id
        };
      });
    
    // Sort by category name first, then by title within each category
    const sortedTracks = tracks.sort((a, b) => {
      // First sort by category name
      const categoryComparison = (a.categoryName || '').localeCompare(b.categoryName || '', 'pt-BR', { sensitivity: 'base' });
      if (categoryComparison !== 0) {
        return categoryComparison;
      }
      // Then sort by title within the same category
      return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
    });
    
    setAudioTracks(sortedTracks);
    
    // Set current track based on preferences or first track
    if (sortedTracks.length > 0 && !currentTrack) {
      let trackToPlay = sortedTracks[0];
      let trackIndex = 0;

      // Try to restore last played track
      if (preferences.lastPlayedTrackId) {
        const lastTrackIndex = sortedTracks.findIndex(t => t.id === preferences.lastPlayedTrackId);
        if (lastTrackIndex !== -1) {
          trackToPlay = sortedTracks[lastTrackIndex];
          trackIndex = lastTrackIndex;
        }
      }

      setCurrentTrack(trackToPlay);
      setCurrentTrackIndex(trackIndex);
    }
  }, [lessons, categories, currentTrack, preferences.lastPlayedTrackId]);

  // Get current tracks based on active tab
  const getCurrentTracks = () => {
    if (activeTab === 'playlists' && activePlaylist) {
      const playlist = dailyPlaylists.find(p => p.id === activePlaylist);
      return playlist ? playlist.tracks : [];
    }
    
    // Library mode - filter tracks by category and search term
    return audioTracks.filter(track => {
      const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || track.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const filteredTracks = getCurrentTracks();

  // When filters change, update current track if it's not in filtered results
  useEffect(() => {
    if (currentTrack && filteredTracks.length > 0) {
      const isCurrentTrackInFiltered = filteredTracks.some(track => track.id === currentTrack.id);
      if (!isCurrentTrackInFiltered) {
        // Switch to first track in filtered results
        const firstFilteredTrack = filteredTracks[0];
        const originalIndex = audioTracks.findIndex(t => t.id === firstFilteredTrack.id);
        handleTrackChange(firstFilteredTrack, originalIndex);
      }
    }
  }, [searchTerm, selectedCategory, filteredTracks, currentTrack, audioTracks]);

  const handleTrackChange = useCallback((track: AudioTrack, originalIndex?: number) => {
    setCurrentTrack(track);
    
    // Find the correct index in the original array
    const realIndex = originalIndex !== undefined 
      ? originalIndex 
      : audioTracks.findIndex(t => t.id === track.id);
    
    setCurrentTrackIndex(realIndex);
    
    // Reset player state when changing tracks
    setPlayerState(prev => ({
      ...prev,
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      duration: 0
    }));

    // Save as last played track and log activity
    updatePreferences({ lastPlayedTrackId: track.id });
    logAudioPlayed(track.title);
  }, [audioTracks, updatePreferences, logAudioPlayed]);

  const getNextTrackFromFiltered = useCallback(() => {
    if (filteredTracks.length === 0) return null;
    
    const currentFilteredIndex = filteredTracks.findIndex(t => t.id === currentTrack?.id);
    let nextIndex;
    
    if (playerState.isShuffling) {
      // Shuffle: pick random track (but not the same one)
      do {
        nextIndex = Math.floor(Math.random() * filteredTracks.length);
      } while (nextIndex === currentFilteredIndex && filteredTracks.length > 1);
    } else {
      // Normal: next track in sequence
      nextIndex = (currentFilteredIndex + 1) % filteredTracks.length;
    }
    
    return filteredTracks[nextIndex];
  }, [filteredTracks, currentTrack, playerState.isShuffling]);

  const getPreviousTrackFromFiltered = useCallback(() => {
    if (filteredTracks.length === 0) return null;
    
    const currentFilteredIndex = filteredTracks.findIndex(t => t.id === currentTrack?.id);
    let prevIndex;
    
    if (playerState.isShuffling) {
      // Shuffle: pick random track (but not the same one)
      do {
        prevIndex = Math.floor(Math.random() * filteredTracks.length);
      } while (prevIndex === currentFilteredIndex && filteredTracks.length > 1);
    } else {
      // Normal: previous track
      prevIndex = currentFilteredIndex === 0 
        ? filteredTracks.length - 1 
        : currentFilteredIndex - 1;
    }
    
    return filteredTracks[prevIndex];
  }, [filteredTracks, currentTrack, playerState.isShuffling]);

  const handleNext = useCallback(() => {
    const nextTrack = getNextTrackFromFiltered();
    if (nextTrack) {
      const originalIndex = audioTracks.findIndex(t => t.id === nextTrack.id);
      handleTrackChange(nextTrack, originalIndex);
    }
  }, [getNextTrackFromFiltered, audioTracks, handleTrackChange]);

  const handlePrevious = useCallback(() => {
    // If more than 3 seconds have passed, restart current track
    if (playerState.currentTime > 3) {
      setPlayerState(prev => ({ ...prev, currentTime: 0 }));
      return;
    }

    const prevTrack = getPreviousTrackFromFiltered();
    if (prevTrack) {
      const originalIndex = audioTracks.findIndex(t => t.id === prevTrack.id);
      handleTrackChange(prevTrack, originalIndex);
    }
  }, [playerState.currentTime, getPreviousTrackFromFiltered, audioTracks, handleTrackChange]);

  const handleAudioEnded = useCallback(() => {
    if (playerState.isRepeating) {
      // Restart current track
      setPlayerState(prev => ({ ...prev, currentTime: 0, isPlaying: true }));
    } else {
      // Play next track automatically
      handleNext();
      // Auto-play the next track
      setTimeout(() => {
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
      }, 100);
    }
  }, [playerState.isRepeating, handleNext]);

  const updatePlayerState = useCallback((updates: Partial<AudioPlayerState>) => {
    setPlayerState(prev => ({ ...prev, ...updates }));
    
    // Save relevant preferences
    if ('volume' in updates || 'isMuted' in updates || 'isShuffling' in updates || 'isRepeating' in updates) {
      const preferencesToSave: Partial<typeof preferences> = {};
      if ('volume' in updates) preferencesToSave.volume = updates.volume;
      if ('isMuted' in updates) preferencesToSave.isMuted = updates.isMuted;
      if ('isShuffling' in updates) preferencesToSave.isShuffling = updates.isShuffling;
      if ('isRepeating' in updates) preferencesToSave.isRepeating = updates.isRepeating;
      
      if (Object.keys(preferencesToSave).length > 0) {
        updatePreferences(preferencesToSave);
      }
    }
  }, [updatePreferences]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (e.target && (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          // Toggle play/pause
          updatePlayerState({ isPlaying: !playerState.isPlaying });
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':  
          e.preventDefault();
          handlePrevious();
          break;
        case 'KeyS':
          e.preventDefault();
          updatePlayerState({ isShuffling: !playerState.isShuffling });
          break;
        case 'KeyR':
          e.preventDefault();
          updatePlayerState({ isRepeating: !playerState.isRepeating });
          break;
        case 'KeyM':
          e.preventDefault();
          updatePlayerState({ isMuted: !playerState.isMuted });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [playerState.isPlaying, playerState.isShuffling, playerState.isRepeating, playerState.isMuted, handleNext, handlePrevious, updatePlayerState]);

  return (
    <div className="flex h-full gap-6">
      {/* Main Player Area - Left Side */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Áudios</h1>
            <p className="text-gray-600">Player de áudio das suas aulas</p>
            <p className="text-xs text-gray-500 mt-1">
              Atalhos: Espaço (play/pause), ← → (navegar), S (aleatório), R (repetir), M (mudo)
            </p>
          </div>
        </div>

        {/* Main Player */}
        {currentTrack && (
          <Card>
            <CardContent className="p-6">
              <AudioPlayer
                currentTrack={currentTrack}
                audioTracks={filteredTracks}
                currentTrackIndex={currentTrackIndex}
                playerState={playerState}
                onTrackChange={handleTrackChange}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onPlayerStateUpdate={updatePlayerState}
                onAudioEnded={handleAudioEnded}
                getFileUrl={getFileUrl}
              />
            </CardContent>
          </Card>
        )}

        {/* Audio Subtitles */}
        {currentTrack && playerState.currentTime > 0 && (
          <AudioSubtitles
            lessonId={currentTrack.id}
            currentTime={playerState.currentTime}
            isPlaying={playerState.isPlaying}
          />
        )}
      </div>

      {/* Audio Library Sidebar - Right Side */}
      <div className="w-96 flex flex-col h-full">
        <Card className="flex-1 flex flex-col">
          <Collapsible open={isLibraryExpanded} onOpenChange={setIsLibraryExpanded}>
            <CollapsibleTrigger asChild>
              <CardHeader className="flex-shrink-0 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle>Biblioteca de Áudios</CardTitle>
                  {isLibraryExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-6 pb-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="library" className="flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      Biblioteca
                    </TabsTrigger>
                    <TabsTrigger value="playlists" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Playlists Diárias
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="library" className="mt-4">
                    <AudioFilters
                      searchTerm={searchTerm}
                      selectedCategory={selectedCategory}
                      categories={categories}
                      onSearchChange={setSearchTerm}
                      onCategoryChange={setSelectedCategory}
                    />
                  </TabsContent>
                  
                  <TabsContent value="playlists" className="mt-4">
                    <div className="space-y-2">
                      {dailyPlaylists.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Nenhuma playlist disponível
                        </p>
                      ) : (
                        dailyPlaylists.slice(0, 7).map((playlist) => (
                          <button
                            key={playlist.id}
                            onClick={() => setActivePlaylist(playlist.id)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              activePlaylist === playlist.id
                                ? 'bg-blue-50 border-2 border-blue-200'
                                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{playlist.name}</p>
                                <p className="text-xs text-gray-500">
                                  {playlist.tracks.length} áudios
                                </p>
                              </div>
                              <PlayCircle className="w-4 h-4 text-gray-400" />
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          {isLibraryExpanded && (
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[400px] px-6 pb-6">
                {activeTab === 'library' && audioTracks.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum áudio disponível
                    </h3>
                    <p className="text-gray-600">
                      Adicione áudios às suas aulas para começar
                    </p>
                  </div>
                ) : activeTab === 'playlists' && (!activePlaylist || filteredTracks.length === 0) ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {!activePlaylist ? 'Selecione uma playlist' : 'Playlist vazia'}
                    </h3>
                    <p className="text-gray-600">
                      {!activePlaylist 
                        ? 'Escolha uma playlist diária para começar'
                        : 'Nenhum áudio nesta playlist'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {activeTab === 'playlists' && activePlaylist && (
                      <div className="px-2 py-3 border-b border-gray-100 mb-2">
                        <h4 className="font-medium text-sm text-gray-900">
                          {dailyPlaylists.find(p => p.id === activePlaylist)?.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Aulas assistidas neste dia
                        </p>
                      </div>
                    )}
                    
                    <AudioList
                      tracks={filteredTracks}
                      currentTrack={currentTrack}
                      isPlaying={playerState.isPlaying}
                      isLoading={playerState.isLoading}
                      onTrackSelect={handleTrackChange}
                      originalTracks={audioTracks}
                    />
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Audios;
