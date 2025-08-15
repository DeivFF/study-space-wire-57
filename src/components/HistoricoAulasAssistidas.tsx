import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, TrendingUp, CalendarDays, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useSupabaseLessons } from '@/hooks/useSupabaseLessons';
import { useSupabaseStats } from '@/hooks/useSupabaseStats';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';
interface DailyStats {
  date: string;
  aulasAssistidas: number;
  exerciciosFeitos: number;
  horasAulas: number;
  questoesResolvidas: number;
  questoesCorretas: number;
  lessons: Array<{
    id: string;
    name: string;
    duration_minutes: number;
    watched_at: string;
  }>;
  exercises: Array<{
    id: string;
    title: string;
    completed_at: string;
    time_spent: number;
  }>;
}
const HistoricoAulasAssistidas = () => {
  const {
    user
  } = useAuth();
  const {
    lessons
  } = useSupabaseLessons();
  const {
    stats
  } = useSupabaseStats();
  const {
    sessions
  } = useStudySessions();
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [questionStats, setQuestionStats] = useState<Record<string, {
    questoes_resolvidas: number;
    questoes_corretas: number;
  }>>({});

  // Função para obter a data atual no fuso horário brasileiro
  const getCurrentBrasiliaDate = (): Date => {
    const now = new Date();
    const brasiliaDate = toZonedTime(now, BRAZIL_TIMEZONE);
    return brasiliaDate;
  };

  // Inicializar as datas usando a data atual de Brasília
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const currentBrasiliaDate = getCurrentBrasiliaDate();
    return subDays(currentBrasiliaDate, 6);
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => {
    return getCurrentBrasiliaDate();
  });

  // Função para converter uma data UTC para string no fuso horário brasileiro
  const getLocalDateString = (utcDateString: string): string => {
    const utcDate = new Date(utcDateString);
    const brasiliaDate = toZonedTime(utcDate, BRAZIL_TIMEZONE);
    const dateStr = format(brasiliaDate, 'yyyy-MM-dd');
    return dateStr;
  };

  // Função para obter uma data específica no fuso horário brasileiro
  const getBrasiliaDateString = (date: Date): string => {
    const brasiliaDate = toZonedTime(date, BRAZIL_TIMEZONE);
    const dateStr = format(brasiliaDate, 'yyyy-MM-dd');
    return dateStr;
  };

  // Hook separado para carregar dados do Supabase
  useEffect(() => {
    if (!user) return;
    const loadQuestionStats = async () => {
      const currentBrasiliaDate = getCurrentBrasiliaDate();
      const start = startDate || subDays(currentBrasiliaDate, parseInt(selectedPeriod) - 1);
      const end = endDate || currentBrasiliaDate;
      try {
        const {
          data,
          error
        } = await supabase.from('estatisticas_estudo').select('data, questoes_resolvidas, questoes_corretas').eq('user_id', user.id).gte('data', getBrasiliaDateString(start)).lte('data', getBrasiliaDateString(end));
        if (error) throw error;
        const statsRecord: Record<string, {
          questoes_resolvidas: number;
          questoes_corretas: number;
        }> = {};
        data?.forEach(item => {
          statsRecord[item.data] = {
            questoes_resolvidas: item.questoes_resolvidas || 0,
            questoes_corretas: item.questoes_corretas || 0
          };
        });
        setQuestionStats(statsRecord);
      } catch (error) {
        console.error('Erro ao carregar estatísticas de questões:', error);
      }
    };
    loadQuestionStats();
  }, [user, selectedPeriod, startDate, endDate]);

  // Hook separado para calcular estatísticas quando os dados mudam
  useEffect(() => {
    if (!user || Object.keys(questionStats).length === 0) return;
    const calculateDailyStats = () => {
      const currentBrasiliaDate = getCurrentBrasiliaDate();
      const start = startDate || subDays(currentBrasiliaDate, parseInt(selectedPeriod) - 1);
      const end = endDate || currentBrasiliaDate;
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const statsMap = new Map<string, DailyStats>();

      // Inicializar os dias no período selecionado usando fuso horário brasileiro
      for (let i = 0; i < days; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        const dateStr = getBrasiliaDateString(date);
        const dayQuestionStats = questionStats[dateStr] || {
          questoes_resolvidas: 0,
          questoes_corretas: 0
        };
        statsMap.set(dateStr, {
          date: dateStr,
          aulasAssistidas: 0,
          exerciciosFeitos: 0,
          horasAulas: 0,
          questoesResolvidas: dayQuestionStats.questoes_resolvidas,
          questoesCorretas: dayQuestionStats.questoes_corretas,
          lessons: [],
          exercises: []
        });
      }

      // Processar aulas assistidas - convertendo de UTC para Brasília
      lessons.filter(lesson => {
        if (!lesson.watched || !lesson.watched_at) return false;
        const watchedDateStr = getLocalDateString(lesson.watched_at);
        const watchedDate = new Date(watchedDateStr + 'T00:00:00');
        const startDateStr = getBrasiliaDateString(start);
        const endDateStr = getBrasiliaDateString(end);
        const startCompare = new Date(startDateStr + 'T00:00:00');
        const endCompare = new Date(endDateStr + 'T23:59:59');
        const isInRange = watchedDate >= startCompare && watchedDate <= endCompare;
        return isInRange;
      }).forEach(lesson => {
        const watchedDateStr = getLocalDateString(lesson.watched_at!);
        const stats = statsMap.get(watchedDateStr);
        if (stats) {
          stats.aulasAssistidas++;
          stats.horasAulas += lesson.duration_minutes;
          stats.lessons.push({
            id: lesson.id,
            name: lesson.name,
            duration_minutes: lesson.duration_minutes,
            watched_at: lesson.watched_at!
          });
        }
      });

      // Processar sessões de exercícios (questões)
      sessions.filter(session => {
        if (!session.is_completed || session.study_type !== 'questao') return false;
        const sessionDate = new Date(session.study_date);
        const startDateStr = getBrasiliaDateString(start);
        const endDateStr = getBrasiliaDateString(end);
        const startCompare = new Date(startDateStr + 'T00:00:00');
        const endCompare = new Date(endDateStr + 'T23:59:59');
        return sessionDate >= startCompare && sessionDate <= endCompare;
      }).forEach(session => {
        const sessionDateStr = session.study_date;
        const stats = statsMap.get(sessionDateStr);
        if (stats) {
          stats.exerciciosFeitos++;
          stats.exercises.push({
            id: session.id,
            title: session.resource_title,
            completed_at: session.created_at,
            time_spent: session.time_spent_minutes || 0
          });
        }
      });
      const finalStats = Array.from(statsMap.values()).reverse();
      setDailyStats(finalStats);
    };
    calculateDailyStats();
  }, [user, questionStats, lessons, sessions, selectedPeriod, startDate, endDate]);
  const handlePeriodChange = (period: string) => {
    const currentBrasiliaDate = getCurrentBrasiliaDate();
    setSelectedPeriod(period);
    const end = currentBrasiliaDate;
    const start = subDays(end, parseInt(period) - 1);
    setStartDate(start);
    setEndDate(end);
  };
  const formatDate = (dateStr: string) => {
    // Criar a data especificando que é uma data local brasileira
    const currentBrasiliaDate = getCurrentBrasiliaDate();
    const today = getBrasiliaDateString(currentBrasiliaDate);
    const yesterday = getBrasiliaDateString(subDays(currentBrasiliaDate, 1));
    if (dateStr === today) {
      return `Hoje (${format(new Date(dateStr + 'T12:00:00'), 'dd/MM')})`;
    } else if (dateStr === yesterday) {
      return `Ontem (${format(new Date(dateStr + 'T12:00:00'), 'dd/MM')})`;
    } else {
      // Usar uma hora do meio-dia para evitar problemas de timezone
      const date = new Date(dateStr + 'T12:00:00');
      return format(date, 'EEE dd/MM');
    }
  };
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };
  const totalLessons = dailyStats.reduce((acc, day) => acc + day.aulasAssistidas, 0);
  const totalExercises = dailyStats.reduce((acc, day) => acc + day.exerciciosFeitos, 0);
  const totalMinutes = dailyStats.reduce((acc, day) => acc + day.horasAulas, 0);
  const totalQuestions = dailyStats.reduce((acc, day) => acc + day.questoesResolvidas, 0);
  const totalCorrectQuestions = dailyStats.reduce((acc, day) => acc + day.questoesCorretas, 0);
  const questionAccuracy = totalQuestions > 0 ? Math.round(totalCorrectQuestions / totalQuestions * 100) : 0;
  const averagePerDay = dailyStats.length > 0 ? Math.round(totalMinutes / dailyStats.length) : 0;
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        
        <div className="flex items-center space-x-4">
          {/* Filtro de período pré-definido */}
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro de data customizado */}
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Data início"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>

            <span className="text-gray-500">até</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy") : "Data fim"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Resumo do Período */}
      

      {/* Histórico Diário */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Diário</CardTitle>
          <p className="text-sm text-muted-foreground">
            Período: {startDate && endDate ? `${format(startDate, 'dd/MM/yyyy')} até ${format(endDate, 'dd/MM/yyyy')}` : `Últimos ${selectedPeriod} dias`}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyStats.map(day => <div key={day.date} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{formatDate(day.date)}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long'
                  })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{day.aulasAssistidas} aulas</span>
                    <span>{day.questoesResolvidas} questões</span>
                    <span>{formatDuration(day.horasAulas)}</span>
                  </div>
                </div>
                
                {/* Aulas assistidas */}
                {day.lessons.length > 0 && <div className="mb-2">
                    <h5 className="text-sm font-medium text-blue-700 mb-1">Aulas Assistidas:</h5>
                    <div className="space-y-1">
                      {day.lessons.map(lesson => <div key={lesson.id} className="text-sm text-gray-600 flex justify-between pl-2">
                          <span>• {lesson.name}</span>
                          <span>{formatDuration(lesson.duration_minutes)}</span>
                        </div>)}
                    </div>
                  </div>}

                {/* Questões respondidas */}
                {day.questoesResolvidas > 0 && <div className="mb-2">
                    <h5 className="text-sm font-medium text-purple-700 mb-1">Questões Respondidas:</h5>
                    <div className="text-sm text-gray-600 pl-2">
                      <span>• {day.questoesResolvidas} questões respondidas</span>
                      {day.questoesCorretas > 0 && <span className="ml-2 text-green-600">
                          ({day.questoesCorretas} acertos - {Math.round(day.questoesCorretas / day.questoesResolvidas * 100)}%)
                        </span>}
                    </div>
                  </div>}
                
                {day.aulasAssistidas === 0 && day.questoesResolvidas === 0 && <div className="text-sm text-gray-400 italic">
                    Nenhuma atividade de estudo neste dia
                  </div>}
              </div>)}
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default HistoricoAulasAssistidas;