
import { useState, useEffect, useCallback } from 'react';
import { Medal, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface MateriaRanking {
  materia: string;
  totalQuestoes: number;
  acertos: number;
  taxaAcerto: number;
  posicao: number;
  tendencia: 'subindo' | 'descendo' | 'estavel';
}

const RankingMaterias = () => {
  const [ranking, setRanking] = useState<MateriaRanking[]>([]);

  const calcularRanking = useCallback(() => {
    const questoes = JSON.parse(localStorage.getItem('cnuBancoQuestoes') || '[]');
    const materiasStats = new Map();

    questoes.forEach((questao: any) => {
      if (!questao.respondida) return;

      if (!materiasStats.has(questao.materia)) {
        materiasStats.set(questao.materia, {
          materia: questao.materia,
          totalQuestoes: 0,
          acertos: 0,
          ultimasRespostas: []
        });
      }

      const stats = materiasStats.get(questao.materia);
      stats.totalQuestoes++;
      if (questao.acertou) stats.acertos++;
      stats.ultimasRespostas.push(questao.acertou);
    });

    const rankingArray = Array.from(materiasStats.values()).map((stats: any) => {
      const taxaAcerto = (stats.acertos / stats.totalQuestoes) * 100;
      
      // Calcular tendência baseada nas últimas 5 respostas
      const ultimas5 = stats.ultimasRespostas.slice(-5);
      const primeiras5 = stats.ultimasRespostas.slice(0, 5);
      const tendencia = calcularTendencia(primeiras5, ultimas5);

      return {
        materia: stats.materia,
        totalQuestoes: stats.totalQuestoes,
        acertos: stats.acertos,
        taxaAcerto: Math.round(taxaAcerto),
        tendencia
      };
    }).sort((a, b) => b.taxaAcerto - a.taxaAcerto);

    // Adicionar posições
    const rankingComPosicoes = rankingArray.map((item, index) => ({
      ...item,
      posicao: index + 1
    }));

    setRanking(rankingComPosicoes);
  }, []);

  useEffect(() => {
    calcularRanking();
  }, [calcularRanking]);

  const calcularTendencia = (primeiras: boolean[], ultimas: boolean[]): 'subindo' | 'descendo' | 'estavel' => {
    if (primeiras.length < 3 || ultimas.length < 3) return 'estavel';
    
    const taxaPrimeiras = primeiras.filter(r => r).length / primeiras.length;
    const taxaUltimas = ultimas.filter(r => r).length / ultimas.length;
    
    if (taxaUltimas > taxaPrimeiras + 0.1) return 'subindo';
    if (taxaUltimas < taxaPrimeiras - 0.1) return 'descendo';
    return 'estavel';
  };

  const getPosicaoIcon = (posicao: number) => {
    switch (posicao) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${posicao}`;
    }
  };

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'subindo': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'descendo': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Target className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTaxaColor = (taxa: number) => {
    if (taxa >= 80) return 'text-green-600 bg-green-100';
    if (taxa >= 60) return 'text-blue-600 bg-blue-100';
    if (taxa >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Medal className="w-5 h-5 mr-2 text-yellow-500" />
        Ranking Pessoal de Matérias
      </h3>

      {ranking.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Medal className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Responda questões para gerar seu ranking pessoal</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranking.map((item) => (
            <div key={item.materia} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-bold text-gray-600 w-8">
                  {getPosicaoIcon(item.posicao)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{item.materia}</h4>
                  <p className="text-sm text-gray-600">
                    {item.acertos}/{item.totalQuestoes} questões
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {getTendenciaIcon(item.tendencia)}
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getTaxaColor(item.taxaAcerto)}`}>
                  {item.taxaAcerto}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {ranking.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">💡 Recomendações</h4>
          <div className="text-sm text-blue-700 space-y-1">
            {ranking[ranking.length - 1] && (
              <p>• Foque mais em: <strong>{ranking[ranking.length - 1].materia}</strong> ({ranking[ranking.length - 1].taxaAcerto}%)</p>
            )}
            {ranking[0] && (
              <p>• Continue assim em: <strong>{ranking[0].materia}</strong> ({ranking[0].taxaAcerto}%)</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingMaterias;
