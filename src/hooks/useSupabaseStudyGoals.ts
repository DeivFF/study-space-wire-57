import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

export interface StudyGoal {
  id: string;
  user_id: string;
  title: string;
  daily_hours: number;
  start_date: string;
  end_date: string;
  category_ids: string[];
  is_active: boolean;
  daily_schedule?: DailyScheduleItem[];
  created_at: string;
  updated_at: string;
}

export interface DailyScheduleItem {
  date: string;
  planned_lessons: {
    id: string;
    name: string;
    duration: number;
    completed: boolean;
  }[];
  total_time: number;
}

// Função para obter a data atual no fuso horário brasileiro
const getCurrentBrasiliaDate = (): Date => {
  const now = new Date();
  const brasiliaDate = toZonedTime(now, BRAZIL_TIMEZONE);
  console.log('useSupabaseStudyGoals - Data atual UTC:', now.toISOString());
  console.log('useSupabaseStudyGoals - Data atual Brasília:', brasiliaDate.toISOString());
  console.log('useSupabaseStudyGoals - Data formatada Brasília:', formatInTimeZone(now, BRAZIL_TIMEZONE, 'yyyy-MM-dd HH:mm:ss'));
  return brasiliaDate;
};

// Função para obter uma string de data no formato YYYY-MM-DD para Brasília
const getBrasiliaDateString = (date: Date): string => {
  const brasiliaDate = toZonedTime(date, BRAZIL_TIMEZONE);
  const dateStr = formatInTimeZone(brasiliaDate, BRAZIL_TIMEZONE, 'yyyy-MM-dd');
  return dateStr;
};

export const useSupabaseStudyGoals = () => {
  const [studyGoals, setStudyGoals] = useState<StudyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchStudyGoals = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('study_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching study goals:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar metas de estudo",
          variant: "destructive"
        });
        return;
      }

      const convertedGoals: StudyGoal[] = (data || []).map(goal => ({
        ...goal,
        category_ids: Array.isArray(goal.category_ids) ? 
          (goal.category_ids as unknown as string[]) : 
          (typeof goal.category_ids === 'string' ? [goal.category_ids] : []),
        daily_schedule: Array.isArray(goal.daily_schedule) ? 
          (goal.daily_schedule as unknown as DailyScheduleItem[]) : 
          undefined
      }));

      setStudyGoals(convertedGoals);
    } catch (error) {
      console.error('Error fetching study goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStudyGoal = async (goalData: Omit<StudyGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('study_goals')
        .insert([{
          ...goalData,
          user_id: user.id,
          category_ids: goalData.category_ids as any,
          daily_schedule: goalData.daily_schedule as any
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating study goal:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar meta de estudo",
          variant: "destructive"
        });
        return null;
      }

      await fetchStudyGoals();
      toast({
        title: "Meta criada!",
        description: "Meta de estudo criada com sucesso"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating study goal:', error);
      return null;
    }
  };

  const updateStudyGoal = async (id: string, updates: Partial<StudyGoal>) => {
    if (!user) return null;

    try {
      const updateData: any = { ...updates };
      if (updates.category_ids) {
        updateData.category_ids = updates.category_ids as any;
      }
      if (updates.daily_schedule) {
        updateData.daily_schedule = updates.daily_schedule as any;
      }

      const { data, error } = await supabase
        .from('study_goals')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating study goal:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar meta de estudo",
          variant: "destructive"
        });
        return null;
      }

      await fetchStudyGoals();
      return data;
    } catch (error) {
      console.error('Error updating study goal:', error);
      return null;
    }
  };

  const deleteStudyGoal = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('study_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting study goal:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir meta de estudo",
          variant: "destructive"
        });
        return false;
      }

      await fetchStudyGoals();
      toast({
        title: "Meta excluída!",
        description: "Meta de estudo excluída com sucesso"
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting study goal:', error);
      return false;
    }
  };

  const recalculateGoalSchedule = async (goalId: string, lessons: any[]) => {
    const goal = studyGoals.find(g => g.id === goalId);
    if (!goal) return;

    const aulasNaoAssistidas = lessons.filter(lesson => 
      goal.category_ids.includes(lesson.category_id) && !lesson.watched
    );

    console.log('recalculateGoalSchedule: Unfiltered lessons:', aulasNaoAssistidas);

    // CORRIGIDO: Ordenar por nome (número crescente) para garantir ordem sequencial correta
    const uncompletedLessons = aulasNaoAssistidas.sort((a, b) => {
      // Extrair números do início do nome das aulas
      const getNumberFromName = (name: string) => {
        const match = name.match(/^(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      
      const numA = getNumberFromName(a.name);
      const numB = getNumberFromName(b.name);
      
      console.log(`Recalculate - Comparing ${a.name} (${numA}) vs ${b.name} (${numB})`);
      return numA - numB; // Ordem crescente: números menores primeiro
    });

    console.log('recalculateGoalSchedule: Lessons ordered by number (ascending):', 
      uncompletedLessons.map(a => ({ name: a.name, number: a.name.match(/^(\d+)/)?.[1] }))
    );

    const dailyTimeMinutes = goal.daily_hours * 60;
    const newSchedule: DailyScheduleItem[] = [];
    
    // CORRIGIDO: Usar data atual de Brasília em vez de new Date()
    const currentBrasiliaDate = getCurrentBrasiliaDate();
    const currentDate = new Date(currentBrasiliaDate);
    const lessonsToSchedule = [...uncompletedLessons];

    console.log('recalculateGoalSchedule: Iniciando cronograma a partir de:', getBrasiliaDateString(currentDate));

    while (lessonsToSchedule.length > 0) {
      const dayLessons: typeof newSchedule[0]['planned_lessons'] = [];
      let dayTimeUsed = 0;

      while (lessonsToSchedule.length > 0 && dayTimeUsed < dailyTimeMinutes) {
        const lesson = lessonsToSchedule[0];
        
        if (dayTimeUsed + lesson.duration_minutes <= dailyTimeMinutes) {
          dayLessons.push({
            id: lesson.id,
            name: lesson.name,
            duration: lesson.duration_minutes,
            completed: false
          });
          dayTimeUsed += lesson.duration_minutes;
          lessonsToSchedule.shift();
          
          console.log(`Recalculate - Added to day ${getBrasiliaDateString(currentDate)}: ${lesson.name}`);
        } else {
          break;
        }
      }

      if (dayLessons.length > 0) {
        const dateStr = getBrasiliaDateString(currentDate);
        newSchedule.push({
          date: dateStr,
          planned_lessons: dayLessons,
          total_time: dayTimeUsed
        });
        
        console.log(`Recalculate - Day ${dateStr} schedule:`, dayLessons.map(l => l.name));
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const endDate = newSchedule.length > 0 
      ? newSchedule[newSchedule.length - 1].date 
      : goal.end_date;

    console.log('recalculateGoalSchedule: Final recalculated schedule:', newSchedule);

    await updateStudyGoal(goalId, {
      daily_schedule: newSchedule,
      end_date: endDate
    });
  };

  useEffect(() => {
    fetchStudyGoals();
  }, [user]);

  return {
    studyGoals,
    loading,
    createStudyGoal,
    updateStudyGoal,
    deleteStudyGoal,
    recalculateGoalSchedule,
    refetch: fetchStudyGoals
  };
};
