import { useState, useEffect } from 'react';
import { Calendar, BookOpen, Plus, Clock, Target, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseLessons } from '@/hooks/useSupabaseLessons';
import { useSupabaseStudyGoals, StudyGoal } from '@/hooks/useSupabaseStudyGoals';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

interface AtividadeEstudo {
  id: string;
  titulo: string;
  materia: string;
  tipo: 'teoria' | 'exercicios' | 'revisao';
  duracao: number;
  concluida: boolean;
  data: Date;
  observacoes?: string;
  lessonId?: string;
}

// Função para obter a data atual no fuso horário brasileiro
const getCurrentBrasiliaDate = (): Date => {
  const now = new Date();
  return toZonedTime(now, BRAZIL_TIMEZONE);
};

// Função para obter uma string de data no formato YYYY-MM-DD para Brasília
const getBrasiliaDateString = (date: Date): string => {
  return formatInTimeZone(date, BRAZIL_TIMEZONE, 'yyyy-MM-dd');
};

// Helper function to get today's date string in Brasília timezone
const getTodayBrasiliaString = (): string => {
  const now = new Date();
  return formatInTimeZone(now, BRAZIL_TIMEZONE, 'yyyy-MM-dd');
};

const PlanoEstudos = () => {
  const { toast } = useToast();
  const { categories, lessons, loading: lessonsLoading } = useSupabaseLessons();
  const { studyGoals, loading: goalsLoading, createStudyGoal, updateStudyGoal, deleteStudyGoal, recalculateGoalSchedule } = useSupabaseStudyGoals();
  
  
  const [atividades, setAtividades] = useState<AtividadeEstudo[]>([]);
  const [novaAtividade, setNovaAtividade] = useState({
    titulo: '',
    materia: '',
    tipo: 'teoria' as const,
    duracao: 60,
    data: getTodayBrasiliaString()
  });
  const [novaMeta, setNovaMeta] = useState({
    titulo: '',
    horasDiarias: 4,
    dataInicio: getTodayBrasiliaString(),
    categoryIds: [''] as string[]
  });
  const [visualizacao, setVisualizacao] = useState<'semana' | 'mes'>('semana');
  const [dataAtual, setDataAtual] = useState(new Date());
  const [modoAdicionar, setModoAdicionar] = useState<'atividade' | 'meta' | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    try {
      const savedAtividades = localStorage.getItem('cnuPlanoEstudos');
      
      if (savedAtividades) {
        const parsed = JSON.parse(savedAtividades);
        const processedAtividades = parsed.map((atividade: any) => ({
          ...atividade,
          data: new Date(atividade.data)
        }));
        setAtividades(processedAtividades);
      }
    } catch (error) {
      console.error('PlanoEstudos: Error loading saved data', error);
    }
  }, []);

  useEffect(() => {
    if (studyGoals.length > 0 && lessons.length > 0) {
      const currentBrasiliaDate = getCurrentBrasiliaDate();
      const today = getBrasiliaDateString(currentBrasiliaDate);
      
      studyGoals.forEach(goal => {
        if (goal.is_active && goal.daily_schedule) {
          const todaySchedule = goal.daily_schedule.find(day => day.date === today);
          
          if (todaySchedule) {
            const hasCompletedLessons = todaySchedule.planned_lessons.some(plannedLesson => {
              const actualLesson = lessons.find(l => l.id === plannedLesson.id);
              return actualLesson?.watched && !plannedLesson.completed;
            });

            if (hasCompletedLessons) {
              recalculateGoalSchedule(goal.id, lessons);
            }
          }
        }
      });
    }
  }, [lessons, studyGoals, recalculateGoalSchedule]);

  const salvarDados = (novasAtividades?: AtividadeEstudo[]) => {
    try {
      if (novasAtividades) {
        setAtividades(novasAtividades);
        localStorage.setItem('cnuPlanoEstudos', JSON.stringify(novasAtividades));
      }
    } catch (error) {
      console.error('PlanoEstudos: Error saving data', error);
    }
  };

  const calcularCronograma = (
    categoryIds: string[], 
    horasDiarias: number, 
    dataInicio: Date
  ): { dataFim: Date; cronograma: any[] } => {
    try {
      const aulasNaoAssistidas = lessons.filter(lesson => 
        categoryIds.includes(lesson.category_id) && !lesson.watched
      );
      
      const aulasOrdenadas = aulasNaoAssistidas.sort((a, b) => {
        const getNumberFromName = (name: string) => {
          const match = name.match(/^(\d+)/);
          return match ? parseInt(match[1]) : 0;
        };
        
        const numA = getNumberFromName(a.name);
        const numB = getNumberFromName(b.name);
        
        return numA - numB; // Ordem crescente: números menores primeiro
      });
      
      const tempoDisponiveHDiario = horasDiarias * 60;
      
      if (tempoDisponiveHDiario <= 0) {
        return { dataFim: dataInicio, cronograma: [] };
      }
      
      const cronograma: any[] = [];
      const aulasRestantes = [...aulasOrdenadas];
      
      const currentBrasiliaDate = getCurrentBrasiliaDate();
      let dataAtual = new Date(currentBrasiliaDate);
      
      // Se a dataInicio é diferente de hoje, usar a dataInicio fornecida
      if (getBrasiliaDateString(dataInicio) !== getBrasiliaDateString(currentBrasiliaDate)) {
        dataAtual = new Date(dataInicio);
      }
      
      while (aulasRestantes.length > 0) {
        const aulasPlantDia: any[] = [];
        let tempoAcumulado = 0;
        
        while (aulasRestantes.length > 0 && tempoAcumulado < tempoDisponiveHDiario) {
          const proximaAula = aulasRestantes[0];
          
          if (tempoAcumulado + proximaAula.duration_minutes <= tempoDisponiveHDiario) {
            aulasPlantDia.push({
              id: proximaAula.id,
              name: proximaAula.name,
              duration: proximaAula.duration_minutes,
              completed: false
            });
            tempoAcumulado += proximaAula.duration_minutes;
            aulasRestantes.shift();
          } else {
            break;
          }
        }
        
        if (aulasPlantDia.length > 0) {
          const dateStr = getBrasiliaDateString(dataAtual);
          cronograma.push({
            date: dateStr,
            planned_lessons: aulasPlantDia,
            total_time: tempoAcumulado
          });
        }
        
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
      
      const dataFim = cronograma.length > 0 ? new Date(cronograma[cronograma.length - 1].date) : dataInicio;
      
      return { dataFim, cronograma };
    } catch (error) {
      console.error('PlanoEstudos: Erro calculando cronograma', error);
      return { dataFim: dataInicio, cronograma: [] };
    }
  };


  const adicionarAtividade = () => {
    if (!novaAtividade.titulo || !novaAtividade.materia) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const atividade: AtividadeEstudo = {
      id: Date.now().toString(),
      ...novaAtividade,
      data: new Date(novaAtividade.data),
      concluida: false
    };

    salvarDados([...atividades, atividade]);
    setNovaAtividade({
      titulo: '',
      materia: '',
      tipo: 'teoria',
      duracao: 60,
      data: getTodayBrasiliaString()
    });
    setModoAdicionar(null);
    
    toast({
      title: "Atividade adicionada!",
      description: "Nova atividade criada no plano de estudos"
    });
  };

  const adicionarMeta = async () => {
    if (!novaMeta.titulo || novaMeta.categoryIds.every(id => !id)) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const categoriesValidas = novaMeta.categoryIds.filter(id => id);
    const { dataFim, cronograma } = calcularCronograma(
      categoriesValidas, 
      novaMeta.horasDiarias, 
      new Date(novaMeta.dataInicio)
    );

    const metaData = {
      title: novaMeta.titulo,
      daily_hours: novaMeta.horasDiarias,
      start_date: novaMeta.dataInicio,
      end_date: dataFim.toISOString().split('T')[0],
      category_ids: categoriesValidas,
      is_active: true,
      daily_schedule: cronograma
    };

    const result = await createStudyGoal(metaData);
    
    if (result) {
      setNovaMeta({
        titulo: '',
        horasDiarias: 4,
        dataInicio: getTodayBrasiliaString(),
        categoryIds: ['']
      });
      setModoAdicionar(null);
    }
  };

  const marcarConcluida = (id: string) => {
    const atividadesAtualizadas = atividades.map(atividade =>
      atividade.id === id 
        ? { ...atividade, concluida: !atividade.concluida }
        : atividade
    );
    
    salvarDados(atividadesAtualizadas);
    
    toast({
      title: "Atividade atualizada!",
      description: "Status da atividade foi alterado"
    });
  };

  const abrirModalData = (data: Date) => {
    setDataSelecionada(data);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setDataSelecionada(null);
  };

  const getAtividadesDia = (data: Date) => {
    return atividades.filter(atividade => 
      atividade.data.toDateString() === data.toDateString()
    );
  };

  const getAulasProgramadasDia = (data: Date) => {
    const dataStr = getBrasiliaDateString(data);
    const aulasPlanas: any[] = [];
    
    studyGoals.forEach(goal => {
      if (goal.is_active && goal.daily_schedule) {
        const daySchedule = goal.daily_schedule.find(day => day.date === dataStr);
        if (daySchedule) {
          aulasPlanas.push(...daySchedule.planned_lessons);
        }
      }
    });
    
    return aulasPlanas;
  };

  const getDiasSemana = () => {
    const inicio = new Date(dataAtual);
    inicio.setDate(dataAtual.getDate() - dataAtual.getDay());
    
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + i);
      dias.push(dia);
    }
    return dias;
  };

  const getDiasMes = () => {
    const inicio = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
    const fim = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);
    
    const dias = [];
    for (let i = 1; i <= fim.getDate(); i++) {
      dias.push(new Date(dataAtual.getFullYear(), dataAtual.getMonth(), i));
    }
    return dias;
  };

  const calcularProgresso = () => {
    const currentBrasiliaDate = getCurrentBrasiliaDate();
    const hojeStr = getBrasiliaDateString(currentBrasiliaDate);
    
    // Contar atividades manuais do dia
    const atividadesHoje = getAtividadesDia(currentBrasiliaDate);
    const atividadesConcluidas = atividadesHoje.filter(a => a.concluida).length;
    
    // Contar aulas assistidas hoje
    const aulasAssistidasHoje = lessons.filter(lesson => {
      if (!lesson.watched || !lesson.watched_at) return false;
      const watchedDate = toZonedTime(new Date(lesson.watched_at), BRAZIL_TIMEZONE);
      const watchedDateStr = getBrasiliaDateString(watchedDate);
      return watchedDateStr === hojeStr;
    }).length;
    
    // Contar aulas programadas para hoje
    const aulasProgramadasHoje = getAulasProgramadasDia(currentBrasiliaDate).length;
    
    const totalAtividades = atividadesHoje.length + aulasProgramadasHoje;
    const totalConcluidas = atividadesConcluidas + aulasAssistidasHoje;
    
    return { 
      concluidas: totalConcluidas, 
      total: totalAtividades, 
      percentual: totalAtividades > 0 ? (totalConcluidas / totalAtividades) * 100 : 0 
    };
  };

  const calcularHorasEstudadas = () => {
    const currentBrasiliaDate = getCurrentBrasiliaDate();
    const hojeStr = getBrasiliaDateString(currentBrasiliaDate);
    
    // Horas de atividades manuais concluídas hoje
    const atividadesHoje = getAtividadesDia(currentBrasiliaDate);
    const horasAtividades = atividadesHoje
      .filter(a => a.concluida)
      .reduce((acc, a) => acc + a.duracao, 0) / 60;
    
    // Horas de aulas assistidas hoje
    const aulasAssistidasHoje = lessons.filter(lesson => {
      if (!lesson.watched || !lesson.watched_at) return false;
      const watchedDate = toZonedTime(new Date(lesson.watched_at), BRAZIL_TIMEZONE);
      const watchedDateStr = getBrasiliaDateString(watchedDate);
      return watchedDateStr === hojeStr;
    });
    
    const horasAulas = aulasAssistidasHoje.reduce((acc, lesson) => acc + lesson.duration_minutes, 0) / 60;
    
    const totalHoras = horasAtividades + horasAulas;
    
    const metaAtiva = studyGoals.find(m => m.is_active);
    const metaHoras = metaAtiva?.daily_hours || 0;
    
    return { estudadas: totalHoras, meta: metaHoras };
  };

  const materias = [...new Set([
    ...atividades.map(a => a.materia),
    ...studyGoals.flatMap(m => 
      m.category_ids.map(id => {
        const cat = categories.find(c => c.id === id);
        return cat?.name || '';
      }).filter(Boolean)
    )
  ])].filter(Boolean);

  const confirmarExclusaoMeta = async (meta: StudyGoal) => {
    if (window.confirm(`Tem certeza que deseja excluir a meta "${meta.title}"? Esta ação não pode ser desfeita.`)) {
      await deleteStudyGoal(meta.id);
    }
  };

  const calcularProgressoPorCategoria = (dataSelecionada: Date) => {
    const dataStr = getBrasiliaDateString(dataSelecionada);
    const categoriasProgresso = new Map<string, {
      nome: string;
      totalHoras: number;
      horasFeitas: number;
      totalAulas: number;
      aulasFeitas: number;
    }>();

    // Processar metas ativas
    studyGoals.forEach(goal => {
      if (goal.is_active && goal.daily_schedule) {
        const daySchedule = goal.daily_schedule.find(day => day.date === dataStr);
        if (daySchedule) {
          goal.category_ids.forEach(categoryId => {
            const categoria = categories.find(cat => cat.id === categoryId);
            if (categoria) {
              const aulasCategoria = daySchedule.planned_lessons.filter(lesson => {
                const lessonData = lessons.find(l => l.id === lesson.id);
                return lessonData?.category_id === categoryId;
              });

              const aulasFeitas = aulasCategoria.filter(lesson => {
                const lessonData = lessons.find(l => l.id === lesson.id);
                return lessonData?.watched || false;
              });

              const totalMinutos = aulasCategoria.reduce((acc, lesson) => acc + lesson.duration, 0);
              const minutosFeitos = aulasFeitas.reduce((acc, lesson) => acc + lesson.duration, 0);

              if (!categoriasProgresso.has(categoryId)) {
                categoriasProgresso.set(categoryId, {
                  nome: categoria.name,
                  totalHoras: 0,
                  horasFeitas: 0,
                  totalAulas: 0,
                  aulasFeitas: 0
                });
              }

              const progresso = categoriasProgresso.get(categoryId)!;
              progresso.totalHoras += totalMinutos;
              progresso.horasFeitas += minutosFeitos;
              progresso.totalAulas += aulasCategoria.length;
              progresso.aulasFeitas += aulasFeitas.length;
            }
          });
        }
      }
    });

    return Array.from(categoriasProgresso.values());
  };

  if (lessonsLoading || goalsLoading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  const progresso = calcularProgresso();
  const horas = calcularHorasEstudadas();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-blue-500" />
          Plano de Estudos
        </h2>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setModoAdicionar('atividade')}
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Atividade
          </Button>
          <Button onClick={() => setModoAdicionar('meta')}>
            <Target className="w-4 h-4 mr-2" />
            Nova Meta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center">
          <h3 className="text-2xl font-bold text-blue-600">{progresso.concluidas}/{progresso.total}</h3>
          <p className="text-gray-600">Atividades Hoje</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progresso.percentual}%` }}
            />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4 text-center">
          <h3 className="text-2xl font-bold text-green-600">
            {horas.estudadas.toFixed(1)}h
          </h3>
          <p className="text-gray-600">Estudadas Hoje</p>
          <p className="text-sm text-gray-500">Meta: {horas.meta}h</p>
        </div>
        
        <div className="bg-white rounded-lg border p-4 text-center">
          <h3 className="text-2xl font-bold text-purple-600">{materias.length}</h3>
          <p className="text-gray-600">Categorias</p>
        </div>
        
        <div className="bg-white rounded-lg border p-4 text-center">
          <h3 className="text-2xl font-bold text-orange-600">{studyGoals.filter(m => m.is_active).length}</h3>
          <p className="text-gray-600">Metas Ativas</p>
        </div>
      </div>

      {studyGoals.filter(m => m.is_active).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Metas Ativas
          </h3>
          <div className="space-y-4">
            {studyGoals.filter(m => m.is_active).map((meta, index) => {
              const diasRestantes = Math.ceil((new Date(meta.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const diasTotal = Math.ceil((new Date(meta.end_date).getTime() - new Date(meta.start_date).getTime()) / (1000 * 60 * 60 * 24));
              const progressoMeta = Math.max(0, ((diasTotal - diasRestantes) / diasTotal) * 100);
              
              return (
                <div key={meta.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{meta.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        diasRestantes > 7 ? 'bg-green-100 text-green-800' :
                        diasRestantes > 3 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {diasRestantes > 0 ? `${diasRestantes} dias restantes` : 'Prazo expirado'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => confirmarExclusaoMeta(meta)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <p>Meta diária: {meta.daily_hours}h</p>
                    <p>Categorias: {meta.category_ids.map(id => {
                      const cat = categories.find(c => c.id === id);
                      return cat?.name;
                    }).filter(Boolean).join(', ')}</p>
                    <p>Período: {new Date(meta.start_date).toLocaleDateString('pt-BR')} até {new Date(meta.end_date).toLocaleDateString('pt-BR')}</p>
                    {meta.daily_schedule && (
                      <p>Total de aulas: {meta.daily_schedule.reduce((acc, dia) => acc + dia.planned_lessons.length, 0)} aulas</p>
                    )}
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${progressoMeta}%` }}
                    />
                  </div>

                  {meta.daily_schedule && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-2">Próximas aulas programadas:</h5>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {meta.daily_schedule
                          .filter(dia => new Date(dia.date) >= new Date())
                          .slice(0, 7)
                          .map((dia, index) => (
                            <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                              <div className="font-medium">{new Date(dia.date).toLocaleDateString('pt-BR')}</div>
                              <div className="text-gray-600">
                                {dia.planned_lessons.length} aulas • {Math.floor(dia.total_time / 60)}h {dia.total_time % 60}min
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-white rounded-lg border p-4">
        <div className="flex space-x-2">
          <Button 
            onClick={() => setVisualizacao('semana')}
            variant={visualizacao === 'semana' ? 'default' : 'outline'}
            size="sm"
          >
            Semana
          </Button>
          <Button 
            onClick={() => setVisualizacao('mes')}
            variant={visualizacao === 'mes' ? 'default' : 'outline'}
            size="sm"
          >
            Mês
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => {
              const nova = new Date(dataAtual);
              if (visualizacao === 'semana') {
                nova.setDate(nova.getDate() - 7);
              } else {
                nova.setMonth(nova.getMonth() - 1);
              }
              setDataAtual(nova);
            }}
            variant="outline"
            size="sm"
          >
            &#8249;
          </Button>
          
          <span className="font-medium">
            {visualizacao === 'semana' 
              ? `Semana de ${dataAtual.toLocaleDateString('pt-BR')}`
              : `${dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
            }
          </span>
          
          <Button 
            onClick={() => {
              const nova = new Date(dataAtual);
              if (visualizacao === 'semana') {
                nova.setDate(nova.getDate() + 7);
              } else {
                nova.setMonth(nova.getMonth() + 1);
              }
              setDataAtual(nova);
            }}
            variant="outline"
            size="sm"
          >
            &#8250;
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className={`grid gap-4 ${
          visualizacao === 'semana' ? 'grid-cols-7' : 'grid-cols-7'
        }`}>
          {visualizacao === 'semana' && ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
            <div key={dia} className="text-center font-medium text-gray-600 p-2">
              {dia}
            </div>
          ))}
          
          {(visualizacao === 'semana' ? getDiasSemana() : getDiasMes()).map(dia => {
            const atividadesDia = getAtividadesDia(dia);
            const aulasProgramadas = getAulasProgramadasDia(dia);
            const currentBrasiliaDate = getCurrentBrasiliaDate();
            const isHoje = getBrasiliaDateString(dia) === getBrasiliaDateString(currentBrasiliaDate);
            const totalItens = atividadesDia.length + aulasProgramadas.length;
            const itensConcluidos = atividadesDia.filter(a => a.concluida).length + 
              aulasProgramadas.filter(aula => {
                const lessonData = lessons.find(l => l.id === aula.id);
                return lessonData?.watched || false;
              }).length;
            
            return (
              <div 
                key={dia.toISOString()}
                className={`h-24 border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${
                  isHoje ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => abrirModalData(dia)}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isHoje ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {dia.getDate()}
                </div>
                
                {totalItens > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">
                      {totalItens} {totalItens === 1 ? 'item' : 'itens'}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full transition-all"
                        style={{ width: `${totalItens > 0 ? (itensConcluidos / totalItens) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {itensConcluidos}/{totalItens} concluídos
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dataSelecionada && (
                <>
                  Atividades de {dataSelecionada.toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {dataSelecionada && (
            <div className="space-y-6">
              {/* Progresso por Categoria */}
              {(() => {
                const categoriesProgress = calcularProgressoPorCategoria(dataSelecionada);
                return categoriesProgress.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Progresso por Categoria
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoriesProgress.map((categoria, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{categoria.nome}</h4>
                            <span className={`text-sm px-2 py-1 rounded ${
                              categoria.aulasFeitas === categoria.totalAulas
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {categoria.aulasFeitas}/{categoria.totalAulas} aulas
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-2">
                            <div className="flex justify-between">
                              <span>Tempo:</span>
                              <span>
                                {Math.floor(categoria.horasFeitas / 60)}h {categoria.horasFeitas % 60}m / {Math.floor(categoria.totalHoras / 60)}h {categoria.totalHoras % 60}m
                              </span>
                            </div>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ 
                                width: `${categoria.totalAulas > 0 ? (categoria.aulasFeitas / categoria.totalAulas) * 100 : 0}%` 
                              }}
                            />
                          </div>
                          
                          <div className="text-xs text-gray-500 mt-1">
                            {categoria.totalAulas > 0 
                              ? Math.round((categoria.aulasFeitas / categoria.totalAulas) * 100)
                              : 0
                            }% concluído
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Atividades manuais */}
              {getAtividadesDia(dataSelecionada).length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Atividades Manuais</h3>
                  <div className="space-y-2">
                    {getAtividadesDia(dataSelecionada).map(atividade => (
                      <div 
                        key={atividade.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          atividade.concluida 
                            ? 'bg-green-50 border-green-200 text-green-800' 
                            : 'bg-white border-gray-200 hover:shadow-sm'
                        }`}
                        onClick={() => marcarConcluida(atividade.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{atividade.titulo}</h4>
                            <p className="text-sm text-gray-600">
                              {atividade.duracao}min - {atividade.materia} - {atividade.tipo}
                            </p>
                          </div>
                          {atividade.concluida && <CheckCircle className="w-5 h-5 text-green-600" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aulas programadas */}
              {getAulasProgramadasDia(dataSelecionada).length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Aulas Programadas</h3>
                  <div className="space-y-2">
                    {getAulasProgramadasDia(dataSelecionada).map(aula => {
                      const lessonData = lessons.find(l => l.id === aula.id);
                      const isCompleted = lessonData?.watched || false;
                      const categoria = categories.find(cat => cat.id === lessonData?.category_id);
                      
                      return (
                        <div 
                          key={aula.id}
                          className={`p-3 rounded-lg border ${
                            isCompleted 
                              ? 'bg-green-50 border-green-200 text-green-800' 
                              : 'bg-purple-50 border-purple-200 text-purple-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{aula.name}</h4>
                              <p className="text-sm text-gray-600">
                                {aula.duration}min - {categoria?.name || 'Categoria desconhecida'}
                              </p>
                            </div>
                            {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {getAtividadesDia(dataSelecionada).length === 0 && getAulasProgramadasDia(dataSelecionada).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma atividade programada para este dia</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {modoAdicionar === 'atividade' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Adicionar Atividade</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="titulo-atividade">Título</Label>
              <Input
                id="titulo-atividade"
                value={novaAtividade.titulo}
                onChange={(e) => setNovaAtividade({...novaAtividade, titulo: e.target.value})}
                placeholder="Ex: Estudar Direitos Fundamentais"
              />
            </div>
            
            <div>
              <Label htmlFor="materia-atividade">Matéria</Label>
              <Input
                id="materia-atividade"
                value={novaAtividade.materia}
                onChange={(e) => setNovaAtividade({...novaAtividade, materia: e.target.value})}
                placeholder="Ex: Direito Constitucional"
              />
            </div>
            
            <div>
              <Label htmlFor="tipo-atividade">Tipo</Label>
              <Select
                value={novaAtividade.tipo}
                onValueChange={(value: any) => setNovaAtividade({...novaAtividade, tipo: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teoria">Teoria</SelectItem>
                  <SelectItem value="exercicios">Exercícios</SelectItem>
                  <SelectItem value="revisao">Revisão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="duracao-atividade">Duração (minutos)</Label>
              <Input
                id="duracao-atividade"
                type="number"
                value={novaAtividade.duracao}
                onChange={(e) => setNovaAtividade({...novaAtividade, duracao: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="data-atividade">Data</Label>
              <Input
                id="data-atividade"
                type="date"
                value={novaAtividade.data}
                onChange={(e) => setNovaAtividade({...novaAtividade, data: e.target.value})}
              />
            </div>
          </div>

          <div className="flex space-x-4 mt-4">
            <Button onClick={adicionarAtividade}>Adicionar Atividade</Button>
            <Button onClick={() => setModoAdicionar(null)} variant="outline">Cancelar</Button>
          </div>
        </div>
      )}

      {modoAdicionar === 'meta' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Criar Nova Meta</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="titulo-meta">Título da Meta</Label>
              <Input
                id="titulo-meta"
                value={novaMeta.titulo}
                onChange={(e) => setNovaMeta({...novaMeta, titulo: e.target.value})}
                placeholder="Ex: Preparação para CNU 2024"
              />
            </div>
            
            <div>
              <Label htmlFor="horas-diarias">Horas de Estudo por Dia</Label>
              <Input
                id="horas-diarias"
                type="number"
                min="1"
                max="16"
                value={novaMeta.horasDiarias}
                onChange={(e) => setNovaMeta({...novaMeta, horasDiarias: parseInt(e.target.value)})}
              />
            </div>
            
            <div>
              <Label htmlFor="data-inicio">Data de Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={novaMeta.dataInicio}
                onChange={(e) => setNovaMeta({...novaMeta, dataInicio: e.target.value})}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label>Categorias de Aulas</Label>
              {novaMeta.categoryIds.map((categoryId, index) => (
                <div key={index} className="flex items-center space-x-2 mt-2">
                  <Select
                    value={categoryId}
                    onValueChange={(value) => {
                      const newCategoryIds = [...novaMeta.categoryIds];
                      newCategoryIds[index] = value;
                      setNovaMeta({...novaMeta, categoryIds: newCategoryIds});
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                     <SelectContent>
                       {categories.map(category => {
                         const aulasCategoria = lessons.filter(lesson => lesson.category_id === category.id && !lesson.watched);
                         const tempoTotalMinutos = aulasCategoria.reduce((acc, lesson) => acc + lesson.duration_minutes, 0);
                         const horas = Math.floor(tempoTotalMinutos / 60);
                         const minutos = tempoTotalMinutos % 60;
                         return (
                           <SelectItem key={category.id} value={category.id}>
                             {category.name} ({aulasCategoria.length} aulas • {horas}h {minutos}m)
                           </SelectItem>
                         );
                       })}
                     </SelectContent>
                  </Select>
                  {index === novaMeta.categoryIds.length - 1 ? (
                    <Button
                      onClick={() => setNovaMeta({...novaMeta, categoryIds: [...novaMeta.categoryIds, '']})}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        const newCategoryIds = novaMeta.categoryIds.filter((_, i) => i !== index);
                        setNovaMeta({...novaMeta, categoryIds: newCategoryIds});
                      }}
                      size="sm"
                      variant="outline"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              
               {novaMeta.categoryIds.some(id => id) && (
                 <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                   <h5 className="text-sm font-medium text-blue-800 mb-2">Resumo:</h5>
                   {novaMeta.categoryIds.filter(id => id).map(categoryId => {
                     const categoria = categories.find(cat => cat.id === categoryId);
                     const aulasCategoria = lessons.filter(lesson => lesson.category_id === categoryId && !lesson.watched);
                     const tempoTotalMinutos = aulasCategoria.reduce((acc, lesson) => acc + lesson.duration_minutes, 0);
                     const horas = Math.floor(tempoTotalMinutos / 60);
                     const minutos = tempoTotalMinutos % 60;
                     return (
                       <div key={categoryId} className="text-sm text-blue-700">
                         • {categoria?.name}: {aulasCategoria.length} aulas ({horas}h {minutos}m)
                       </div>
                     );
                   })}
                   <div className="text-sm text-blue-800 font-medium mt-2">
                     Data prevista de conclusão será calculada automaticamente
                   </div>
                 </div>
               )}
            </div>
          </div>

          <div className="flex space-x-4 mt-4">
            <Button onClick={adicionarMeta}>Criar Meta</Button>
            <Button onClick={() => setModoAdicionar(null)} variant="outline">Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanoEstudos;
