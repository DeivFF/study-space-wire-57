
import { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Target, AlertTriangle } from 'lucide-react';

interface HeatmapData {
  materia: string;
  assunto: string;
  totalQuestoes: number;
  acertos: number;
  taxaAcerto: number;
  dificuldade: 'critica' | 'baixa' | 'media' | 'boa' | 'excelente';
}

const HeatmapDificuldade = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);

  useEffect(() => {
    // Carregar dados das questões e calcular heatmap
    const questoes = JSON.parse(localStorage.getItem('cnuBancoQuestoes') || '[]');
    const heatmap = calcularHeatmap(questoes);
    setHeatmapData(heatmap);
  }, []);

  const calcularHeatmap = (questoes: any[]) => {
    const materiaAssunto = new Map();
    
    questoes.forEach(questao => {
      if (!questao.respondida) return;
      
      const key = `${questao.materia}-${questao.assunto}`;
      if (!materiaAssunto.has(key)) {
        materiaAssunto.set(key, {
          materia: questao.materia,
          assunto: questao.assunto,
          totalQuestoes: 0,
          acertos: 0
        });
      }
      
      const data = materiaAssunto.get(key);
      data.totalQuestoes++;
      if (questao.acertou) data.acertos++;
    });

    return Array.from(materiaAssunto.values()).map(item => {
      const taxaAcerto = item.totalQuestoes > 0 ? (item.acertos / item.totalQuestoes) * 100 : 0;
      let dificuldade: HeatmapData['dificuldade'];
      
      if (taxaAcerto < 30) dificuldade = 'critica';
      else if (taxaAcerto < 50) dificuldade = 'baixa';
      else if (taxaAcerto < 70) dificuldade = 'media';
      else if (taxaAcerto < 85) dificuldade = 'boa';
      else dificuldade = 'excelente';

      return {
        ...item,
        taxaAcerto: Math.round(taxaAcerto),
        dificuldade
      };
    }).sort((a, b) => a.taxaAcerto - b.taxaAcerto);
  };

  const getDificuldadeColor = (dificuldade: string) => {
    switch (dificuldade) {
      case 'critica': return 'bg-red-500 text-white';
      case 'baixa': return 'bg-orange-400 text-white';
      case 'media': return 'bg-yellow-400 text-black';
      case 'boa': return 'bg-green-400 text-white';
      case 'excelente': return 'bg-green-600 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getDificuldadeIcon = (dificuldade: string) => {
    switch (dificuldade) {
      case 'critica': return AlertTriangle;
      case 'baixa': return TrendingDown;
      case 'media': return Target;
      case 'boa': return TrendingUp;
      case 'excelente': return TrendingUp;
      default: return Target;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
        Mapa de Calor - Prioridades de Revisão
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {heatmapData.map((item, index) => {
          const Icon = getDificuldadeIcon(item.dificuldade);
          return (
            <div
              key={`${item.materia}-${item.assunto}`}
              className={`p-4 rounded-lg ${getDificuldadeColor(item.dificuldade)} relative`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold">#{index + 1}</span>
              </div>
              <h4 className="font-medium text-sm mb-1">{item.materia}</h4>
              <p className="text-xs opacity-90 mb-2">{item.assunto}</p>
              <div className="flex justify-between items-center text-xs">
                <span>{item.taxaAcerto}% acertos</span>
                <span>{item.totalQuestoes} questões</span>
              </div>
            </div>
          );
        })}
      </div>

      {heatmapData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Responda algumas questões para gerar o mapa de calor</p>
        </div>
      )}
    </div>
  );
};

export default HeatmapDificuldade;
