
import { useState, useEffect } from 'react';
import { History, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';

interface Tentativa {
  id: string;
  questaoId: string;
  data: Date;
  respostaDada: number;
  tempoGasto: number;
  acertou: boolean;
}

interface HistoricoTentativasProps {
  questaoId: string;
}

const HistoricoTentativas = ({ questaoId }: HistoricoTentativasProps) => {
  const [tentativas, setTentativas] = useState<Tentativa[]>([]);

  useEffect(() => {
    const historico = JSON.parse(localStorage.getItem('cnuHistoricoTentativas') || '[]');
    const tentativasQuestao = historico.filter((t: Tentativa) => t.questaoId === questaoId);
    setTentativas(tentativasQuestao.sort((a: Tentativa, b: Tentativa) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    ));
  }, [questaoId]);

  if (tentativas.length === 0) {
    return (
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center text-gray-500">
          <History className="w-4 h-4 mr-2" />
          <span className="text-sm">Nenhuma tentativa anterior registrada</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <h4 className="text-sm font-medium text-gray-800 flex items-center mb-3">
        <History className="w-4 h-4 mr-1" />
        Histórico de Tentativas ({tentativas.length})
      </h4>

      <div className="space-y-2 max-h-32 overflow-y-auto">
        {tentativas.map((tentativa, index) => (
          <div key={tentativa.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              {tentativa.acertou ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <XCircle className="w-3 h-3 text-red-500" />
              )}
              <span className={tentativa.acertou ? 'text-green-700' : 'text-red-700'}>
                Alternativa {String.fromCharCode(65 + tentativa.respostaDada)}
              </span>
            </div>
            
            <div className="flex items-center space-x-3 text-gray-600">
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {tentativa.tempoGasto}s
              </span>
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(tentativa.data).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoricoTentativas;
