
import { Music, Loader2, Play, Pause } from 'lucide-react';

interface AudioTrack {
  id: string;
  title: string;
  audioPath: string;
  categoryName?: string;
  categoryId?: string;
}

interface AudioListProps {
  tracks: AudioTrack[];
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  onTrackSelect: (track: AudioTrack, index: number) => void;
  originalTracks: AudioTrack[];
}

const AudioList = ({ 
  tracks, 
  currentTrack, 
  isPlaying, 
  isLoading, 
  onTrackSelect, 
  originalTracks 
}: AudioListProps) => {
  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum áudio encontrado
        </h3>
        <p className="text-gray-600">
          Tente ajustar os filtros de pesquisa
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tracks.map((track) => {
        const originalIndex = originalTracks.findIndex(t => t.id === track.id);
        const isCurrentTrack = currentTrack?.id === track.id;
        
        return (
          <div
            key={track.id}
            onClick={() => onTrackSelect(track, originalIndex)}
            className={`group flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              isCurrentTrack
                ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                : 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-200'
            }`}
          >
            <div className="flex-shrink-0 relative">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                isCurrentTrack 
                  ? 'bg-blue-100' 
                  : 'bg-gray-100 group-hover:bg-gray-200'
              }`}>
                {isCurrentTrack && isLoading ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : isCurrentTrack && isPlaying ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-4 bg-blue-600 rounded-full animate-pulse"></div>
                    <div className="w-1 h-3 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-5 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                ) : isCurrentTrack ? (
                  <Pause className="w-5 h-5 text-blue-600" />
                ) : (
                  <Play className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate transition-colors ${
                isCurrentTrack 
                  ? 'text-blue-900' 
                  : 'text-gray-900 group-hover:text-gray-700'
              }`}>
                {track.title}
              </p>
              <p className={`text-sm truncate transition-colors ${
                isCurrentTrack 
                  ? 'text-blue-700' 
                  : 'text-gray-600 group-hover:text-gray-500'
              }`}>
                {track.categoryName}
              </p>
            </div>
            
            <div className="flex-shrink-0">
              {isCurrentTrack && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-xs font-medium text-blue-600">
                    {isLoading ? 'Carregando...' : isPlaying ? 'Tocando' : 'Pausado'}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AudioList;
