
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, Clock, Brain, Calendar, Play } from 'lucide-react';

interface DadosDesempenho {
  questoesPorDia: Array<{ dia: string; questoes: number; acertos: number }>;
  desempenhoPorMateria: Array<{ materia: string; total: number; acertos: number; percentual: number }>;
  tempoEstudoPorDia: Array<{ dia: string; minutos: number; minutosVideo: number }>;
  evolucaoSemanal: Array<{ semana: string; percentualAcertos: number }>;
}

const AnaliseDesempenho = () => {
  const [dadosDesempenho, setDadosDesempenho] = useState<DadosDesempenho>({
    questoesPorDia: [],
    desempenhoPorMateria: [],
    tempoEstudoPorDia: [],
    evolucaoSemanal: []
  });

  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    // TODO: Implement real data fetching for performance analysis
    // The previous mock data has been removed as part of feature deletion.
  }, [periodo]);

  const calcularEstatisticas = () => {
    const totalQuestoes = dadosDesempenho.questoesPorDia.reduce((acc, dia) => acc + dia.questoes, 0);
    const totalAcertos = dadosDesempenho.questoesPorDia.reduce((acc, dia) => acc + dia.acertos, 0);
    const percentualGeral = totalQuestoes > 0 ? (totalAcertos / totalQuestoes * 100) : 0;
    const mediaQuestoesDia = totalQuestoes / dadosDesempenho.questoesPorDia.length;
    const tempoTotalMinutos = dadosDesempenho.tempoEstudoPorDia.reduce((acc, dia) => acc + dia.minutos, 0);
    const tempoTotalVideo = dadosDesempenho.tempoEstudoPorDia.reduce((acc, dia) => acc + dia.minutosVideo, 0);
    const tempoMedioDia = tempoTotalMinutos / dadosDesempenho.tempoEstudoPorDia.length;
    const tempoMedioVideo = tempoTotalVideo / dadosDesempenho.tempoEstudoPorDia.length;

    return {
      totalQuestoes,
      totalAcertos,
      percentualGeral,
      mediaQuestoesDia,
      tempoTotalMinutos,
      tempoTotalVideo,
      tempoMedioDia,
      tempoMedioVideo
    };
  };

  const stats = calcularEstatisticas();

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Análise de Desempenho</h2>
        <p className="text-indigo-100">Insights detalhados sobre seu progresso nos estudos</p>
        
        {/* Filtro de Período */}
        <div className="mt-4 flex space-x-2">
          {['7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodo === p
                  ? 'bg-white text-indigo-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de Estatísticas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Acertos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.percentualGeral.toFixed(1)}%</p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Questões/Dia</p>
              <p className="text-2xl font-bold text-gray-900">{stats.mediaQuestoesDia.toFixed(0)}</p>
            </div>
            <Brain className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tempo Médio/Dia</p>
              <p className="text-2xl font-bold text-gray-900">{Math.floor(stats.tempoMedioDia / 60)}h {Math.floor(stats.tempoMedioDia % 60)}m</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vídeos/Dia</p>
              <p className="text-2xl font-bold text-gray-900">{Math.floor(stats.tempoMedioVideo / 60)}h {Math.floor(stats.tempoMedioVideo % 60)}m</p>
            </div>
            <Play className="w-8 h-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Questões</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuestoes}</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Diária */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Questões por Dia</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosDesempenho.questoesPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="questoes" fill="#8b5cf6" name="Total" />
              <Bar dataKey="acertos" fill="#10b981" name="Acertos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Desempenho por Matéria */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Desempenho por Matéria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dadosDesempenho.desempenhoPorMateria}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ materia, percentual }) => `${materia}: ${percentual.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="percentual"
              >
                {dadosDesempenho.desempenhoPorMateria.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tempo de Estudo incluindo Vídeos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Tempo de Estudo Diário</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosDesempenho.tempoEstudoPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip formatter={(value, name) => [`${value} min`, name === 'minutos' ? 'Estudo Total' : 'Vídeos']} />
              <Bar dataKey="minutos" fill="#06b6d4" name="minutos" />
              <Bar dataKey="minutosVideo" fill="#8b5cf6" name="minutosVideo" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Evolução Semanal */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Evolução Semanal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dadosDesempenho.evolucaoSemanal}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Taxa de Acertos']} />
              <Line type="monotone" dataKey="percentualAcertos" stroke="#10b981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights e Recomendações */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Insights e Recomendações</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-800">Pontos Fortes</h4>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Excelente desempenho em Atualidades (90%)</li>
              <li>• Consistência no tempo de estudo diário</li>
              <li>• Bom equilíbrio entre vídeos e questões</li>
              <li>• Melhoria constante nas últimas semanas</li>
            </ul>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown className="w-5 h-5 text-orange-600" />
              <h4 className="font-medium text-orange-800">Áreas para Melhoria</h4>
            </div>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Foque mais em Matemática (70% de acertos)</li>
              <li>• Aumente o número de questões de Direito</li>
              <li>• Balanceie mais tempo entre teoria e prática</li>
              <li>• Mantenha regularidade nos finais de semana</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnaliseDesempenho;
