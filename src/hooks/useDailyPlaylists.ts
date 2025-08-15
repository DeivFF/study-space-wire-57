import { useState, useEffect } from 'react';
import { useSupabaseLessons } from './useSupabaseLessons';
import { format, subDays, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

interface DailyPlaylist {
  id: string;
  name: string;
  date: string;
  tracks: Array<{
    id: string;
    title: string;
    audioPath: string;
    categoryName?: string;
    categoryId?: string;
    watchedAt: string;
  }>;
}

export const useDailyPlaylists = () => {
  const { lessons, categories } = useSupabaseLessons();
  const [dailyPlaylists, setDailyPlaylists] = useState<DailyPlaylist[]>([]);

  const getCurrentBrasiliaDate = (): Date => {
    const now = new Date();
    const brasiliaDate = toZonedTime(now, BRAZIL_TIMEZONE);
    return brasiliaDate;
  };

  const getLocalDateString = (utcDateString: string): string => {
    const utcDate = new Date(utcDateString);
    const brasiliaDate = toZonedTime(utcDate, BRAZIL_TIMEZONE);
    const dateStr = format(brasiliaDate, 'yyyy-MM-dd');
    return dateStr;
  };

  const getBrasiliaDateString = (date: Date): string => {
    const brasiliaDate = toZonedTime(date, BRAZIL_TIMEZONE);
    const dateStr = format(brasiliaDate, 'yyyy-MM-dd');
    return dateStr;
  };

  const formatPlaylistName = (dateStr: string): string => {
    const date = new Date(dateStr + 'T12:00:00');
    const currentBrasiliaDate = getCurrentBrasiliaDate();
    const today = getBrasiliaDateString(currentBrasiliaDate);
    const yesterday = getBrasiliaDateString(subDays(currentBrasiliaDate, 1));

    if (dateStr === today) {
      return `Hoje (${format(date, 'dd/MM')})`;
    } else if (dateStr === yesterday) {
      return `Ontem (${format(date, 'dd/MM')})`;
    } else {
      return format(date, 'EEE dd/MM', { locale: ptBR });
    }
  };

  useEffect(() => {
    // Criar playlists baseadas nas aulas assistidas dos últimos 30 dias
    const currentBrasiliaDate = getCurrentBrasiliaDate();
    const thirtyDaysAgo = subDays(currentBrasiliaDate, 29);

    // Filtrar aulas assistidas com áudio nos últimos 30 dias
    const watchedLessonsWithAudio = lessons.filter(lesson => {
      if (!lesson.watched || !lesson.watched_at || !lesson.audio_file_path) {
        return false;
      }

      const watchedDateStr = getLocalDateString(lesson.watched_at);
      const watchedDate = new Date(watchedDateStr + 'T00:00:00');
      const startDate = new Date(getBrasiliaDateString(thirtyDaysAgo) + 'T00:00:00');
      const endDate = new Date(getBrasiliaDateString(currentBrasiliaDate) + 'T23:59:59');

      return watchedDate >= startDate && watchedDate <= endDate;
    });

    // Agrupar por data
    const lessonsByDate = new Map<string, typeof watchedLessonsWithAudio>();

    watchedLessonsWithAudio.forEach(lesson => {
      const dateStr = getLocalDateString(lesson.watched_at!);
      if (!lessonsByDate.has(dateStr)) {
        lessonsByDate.set(dateStr, []);
      }
      lessonsByDate.get(dateStr)!.push(lesson);
    });

    // Criar playlists para cada dia
    const playlists: DailyPlaylist[] = [];

    lessonsByDate.forEach((lessons, dateStr) => {
      const tracks = lessons.map(lesson => {
        const category = categories.find(cat => cat.id === lesson.category_id);
        return {
          id: lesson.id,
          title: lesson.name,
          audioPath: lesson.audio_file_path!,
          categoryName: category?.name || 'Sem categoria',
          categoryId: lesson.category_id,
          watchedAt: lesson.watched_at!
        };
      });

      // Ordenar tracks por ordem de assistida (mais antiga primeiro)
      tracks.sort((a, b) => new Date(a.watchedAt).getTime() - new Date(b.watchedAt).getTime());

      playlists.push({
        id: `daily-${dateStr}`,
        name: formatPlaylistName(dateStr),
        date: dateStr,
        tracks
      });
    });

    // Ordenar playlists por data (mais recente primeiro)
    playlists.sort((a, b) => b.date.localeCompare(a.date));

    setDailyPlaylists(playlists);
  }, [lessons, categories]);

  const getTodayPlaylist = (): DailyPlaylist | null => {
    const today = getBrasiliaDateString(getCurrentBrasiliaDate());
    return dailyPlaylists.find(playlist => playlist.date === today) || null;
  };

  const getYesterdayPlaylist = (): DailyPlaylist | null => {
    const yesterday = getBrasiliaDateString(subDays(getCurrentBrasiliaDate(), 1));
    return dailyPlaylists.find(playlist => playlist.date === yesterday) || null;
  };

  const getPlaylistByDate = (dateStr: string): DailyPlaylist | null => {
    return dailyPlaylists.find(playlist => playlist.date === dateStr) || null;
  };

  return {
    dailyPlaylists,
    getTodayPlaylist,
    getYesterdayPlaylist,
    getPlaylistByDate,
    formatPlaylistName
  };
};