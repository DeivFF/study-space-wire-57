
import { useState } from 'react';
import { StickyNote, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnotacoesQuestaoProps {
  questaoId: string;
}

const AnotacoesQuestao = ({ questaoId }: AnotacoesQuestaoProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [anotacao, setAnotacao] = useState(() => {
    const anotacoes = JSON.parse(localStorage.getItem('cnuAnotacoes') || '{}');
    return anotacoes[questaoId] || '';
  });

  const salvarAnotacao = () => {
    const anotacoes = JSON.parse(localStorage.getItem('cnuAnotacoes') || '{}');
    if (anotacao.trim()) {
      anotacoes[questaoId] = anotacao;
    } else {
      delete anotacoes[questaoId];
    }
    localStorage.setItem('cnuAnotacoes', JSON.stringify(anotacoes));
    setIsEditing(false);
  };

  const cancelarEdicao = () => {
    const anotacoes = JSON.parse(localStorage.getItem('cnuAnotacoes') || '{}');
    setAnotacao(anotacoes[questaoId] || '');
    setIsEditing(false);
  };

  return (
    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-yellow-800 flex items-center">
          <StickyNote className="w-4 h-4 mr-1" />
          Suas Anotações
        </h4>
        {!isEditing && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsEditing(true)}
            className="text-xs"
          >
            {anotacao ? 'Editar' : 'Adicionar'}
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={anotacao}
            onChange={(e) => setAnotacao(e.target.value)}
            placeholder="Ex: Errei porque confundi conceito X com Y..."
            className="w-full p-2 text-sm border border-yellow-300 rounded resize-none"
            rows={3}
          />
          <div className="flex space-x-2">
            <Button size="sm" onClick={salvarAnotacao}>
              <Save className="w-3 h-3 mr-1" />
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={cancelarEdicao}>
              <X className="w-3 h-3 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-yellow-700">
          {anotacao || 'Clique em "Adicionar" para escrever suas anotações sobre esta questão.'}
        </div>
      )}
    </div>
  );
};

export default AnotacoesQuestao;
