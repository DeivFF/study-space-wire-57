import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseLessons } from '@/hooks/useSupabaseLessons';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useSupabaseStats } from '@/hooks/useSupabaseStats';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
const GraficosEstatisticas = () => {
  const {
    user
  } = useAuth();
  const {
    lessons,
    categories
  } = useSupabaseLessons();
  const {
    sessions
  } = useStudySessions();
  const {
    stats
  } = useSupabaseStats();
  const [selectedPeriod, setSelectedPeriod] = useState('7');

  // Função helper para garantir valores numéricos válidos
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? defaultValue : num;
  };

  // Calcular datas de filtro baseadas no período selecionado
  const getDateRange = useCallback(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, parseInt(selectedPeriod) - 1);
    return {
      startDate,
      endDate
    };
  }, [selectedPeriod]);

  // Filtrar lessons e sessions baseado no período selecionado
  const getFilteredData = useCallback(() => {
    const {
      startDate,
      endDate
    } = getDateRange();
    const filteredLessons = lessons.filter(lesson => {
      if (!lesson.watched || !lesson.watched_at) return false;
      const watchedDate = new Date(lesson.watched_at);
      return isAfter(watchedDate, startOfDay(startDate)) && isBefore(watchedDate, endOfDay(endDate));
    });
    const filteredSessions = sessions.filter(session => {
      if (!session.is_completed || session.study_type !== 'questao') return false;
      const sessionDate = new Date(session.study_date);
      return isAfter(sessionDate, startOfDay(startDate)) && isBefore(sessionDate, endOfDay(endDate));
    });
    return {
      filteredLessons,
      filteredSessions
    };
  }, [getDateRange, lessons, sessions]);

  // Dados para gráfico de progresso semanal
  const dadosSemanais = useMemo(() => {
    if (!user) return [];
    const {
      startDate,
      endDate
    } = getDateRange();
    const {
      filteredLessons,
      filteredSessions
    } = getFilteredData();
    const days = parseInt(selectedPeriod);
    const ultimosDias = [];
    for (let i = days - 1; i >= 0; i--) {
      const data = subDays(endDate, i);
      const dataStr = data.toISOString().split('T')[0];
      const aulasNoDia = filteredLessons.filter(lesson => lesson.watched_at && new Date(lesson.watched_at).toISOString().split('T')[0] === dataStr).length;
      const exerciciosNoDia = filteredSessions.filter(session => session.study_date === dataStr).length;
      ultimosDias.push({
        dia: format(data, 'dd/MM'),
        aulas: safeNumber(aulasNoDia),
        exercicios: safeNumber(exerciciosNoDia),
        data: dataStr
      });
    }
    return ultimosDias;
  }, [user, selectedPeriod, getDateRange, getFilteredData]);

  // Dados para gráfico de categorias (considerando apenas aulas do período)
  const dadosCategorias = useMemo(() => {
    if (!user || !categories.length) return [];
    const {
      filteredLessons
    } = getFilteredData();
    return categories.map(category => {
      const aulasCategoria = lessons.filter(lesson => lesson.category_id === category.id);
      const aulasAssistidasNoPeriodo = filteredLessons.filter(lesson => lesson.category_id === category.id).length;
      const total = aulasCategoria.length;
      const progresso = total > 0 ? Math.round(aulasAssistidasNoPeriodo / total * 100) : 0;
      return {
        nome: category.name.length > 15 ? category.name.substring(0, 15) + '...' : category.name,
        nomeCompleto: category.name,
        total: safeNumber(total),
        assistidas: safeNumber(aulasAssistidasNoPeriodo),
        progresso: safeNumber(progresso)
      };
    }).filter(item => item.total > 0); // Filtrar categorias sem aulas
  }, [user, categories, lessons, getFilteredData]);

  // Dados para gráfico de pizza - distribuição de tempo (filtrado por período)
  const dadosDistribuicao = useMemo(() => {
    if (!user) return [];
    const {
      filteredLessons,
      filteredSessions
    } = getFilteredData();
    const tempoAulas = filteredLessons.reduce((acc, lesson) => acc + safeNumber(lesson.duration_minutes), 0);
    const tempoExercicios = filteredSessions.reduce((acc, session) => acc + safeNumber(session.time_spent_minutes), 0);
    const dados = [];
    if (tempoAulas > 0) {
      dados.push({
        nome: 'Aulas',
        tempo: tempoAulas,
        cor: '#3b82f6'
      });
    }
    if (tempoExercicios > 0) {
      dados.push({
        nome: 'Exercícios',
        tempo: tempoExercicios,
        cor: '#10b981'
      });
    }
    return dados;
  }, [user, getFilteredData]);

  // Dados para linha de exercícios realizados
  const dadosLinha = useMemo(() => {
    return dadosSemanais.map(dia => ({
      ...dia,
      exerciciosRealizados: safeNumber(dia.exercicios)
    }));
  }, [dadosSemanais]);
  const chartConfig = {
    aulas: {
      label: "Aulas",
      color: "#3b82f6"
    },
    exercicios: {
      label: "Exercícios",
      color: "#10b981"
    }
  };

  // Se não há dados, mostrar mensagem
  if (!user) {
    return <div className="text-center py-8">
        <p className="text-gray-500">Faça login para ver suas estatísticas</p>
      </div>;
  }
  return <div className="space-y-6">
      {/* Seletor de Período */}
      <div className="flex justify-end">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="15">Últimos 15 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Progresso Semanal */}
        <Card>
          <CardHeader>
            <CardTitle>Progresso dos Últimos {selectedPeriod} Dias</CardTitle>
          </CardHeader>
          <CardContent>
            {dadosSemanais.length > 0 ? <ChartContainer config={chartConfig} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosSemanais} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                    <XAxis dataKey="dia" tick={{
                  fontSize: 12
                }} height={40} />
                    <YAxis tick={{
                  fontSize: 12
                }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="aulas" fill="var(--color-aulas)" name="Aulas" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="exercicios" fill="var(--color-exercicios)" name="Exercícios" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer> : <div className="h-64 flex items-center justify-center text-gray-500">
                Nenhum dado disponível para o período selecionado
              </div>}
          </CardContent>
        </Card>

        {/* Gráfico de Progresso por Categoria - Melhorado */}
        <Card>
          <CardHeader>
            <CardTitle>Progresso por Categoria (Últimos {selectedPeriod} dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {dadosCategorias.length > 0 ? <ChartContainer config={chartConfig} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosCategorias} layout="horizontal" margin={{
                top: 5,
                right: 30,
                left: 100,
                bottom: 5
              }}>
                    <XAxis type="number" domain={[0, 100]} tick={{
                  fontSize: 11
                }} tickFormatter={value => `${value}%`} />
                    <YAxis type="category" dataKey="nome" width={90} tick={{
                  fontSize: 10
                }} interval={0} />
                    <ChartTooltip content={<ChartTooltipContent />} formatter={(value, name, props) => [`${value}%`, `Progresso - ${props.payload.nomeCompleto}`]} labelFormatter={(label, props) => {
                  if (props && props.length > 0) {
                    const data = props[0].payload;
                    return `${data.nomeCompleto}: ${data.assistidas}/${data.total} aulas`;
                  }
                  return label;
                }} />
                    <Bar dataKey="progresso" fill="var(--color-aulas)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer> : <div className="h-64 flex items-center justify-center text-gray-500">
                Nenhuma categoria com aulas encontrada
              </div>}
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição de Tempo */}
        

        {/* Gráfico de Exercícios Realizados */}
        <Card>
          <CardHeader>
            <CardTitle>Exercícios Realizados (Últimos {selectedPeriod} dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {dadosLinha.length > 0 ? <ChartContainer config={chartConfig} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosLinha} margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                    <XAxis dataKey="dia" tick={{
                  fontSize: 12
                }} />
                    <YAxis tick={{
                  fontSize: 12
                }} />
                    <ChartTooltip content={<ChartTooltipContent />} formatter={value => [`${value}`, 'Exercícios']} />
                    <Line type="monotone" dataKey="exerciciosRealizados" stroke="var(--color-exercicios)" strokeWidth={3} name="Exercícios Realizados" dot={{
                  fill: 'var(--color-exercicios)',
                  strokeWidth: 2,
                  r: 4
                }} activeDot={{
                  r: 6,
                  stroke: 'var(--color-exercicios)',
                  strokeWidth: 2
                }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer> : <div className="h-64 flex items-center justify-center text-gray-500">
                Nenhum exercício realizado no período
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default GraficosEstatisticas;