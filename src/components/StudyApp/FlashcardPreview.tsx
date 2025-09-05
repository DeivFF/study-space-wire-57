import React, { useState, useEffect } from 'react';
import { Eye, Lightbulb, Package, Star } from 'lucide-react';
import { Button } from '../ui/button';

interface FlashcardPreviewProps {
  card: {
    q?: string;
    a?: string;
    hint?: string;
    pergunta?: string;
    resposta?: string;
    dica?: string;
    tipo?: string;
    referencia?: string;
    tags?: string[];
    id?: string;
  };
  showExportButton?: boolean;
  showMetadata?: boolean;
  showRating?: boolean;
  onExport?: () => void;
  onRate?: (cardId: string, rating: number) => void;
}

export function FlashcardPreview({ card, showExportButton = true, showMetadata = false, showRating = false, onExport, onRate }: FlashcardPreviewProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  // Get question and answer from either format
  const question = card.pergunta || card.q || 'Sem pergunta';
  const answer = card.resposta || card.a || 'Sem resposta';
  const hint = card.dica || card.hint || "Lembre-se de que esta pergunta está relacionada à estrutura básica dos compostos orgânicos.";
  
  // Reset states when card changes
  useEffect(() => {
    setShowAnswer(false);
    setShowHint(false);
  }, [question]);

  return (
    <div className="border border-app-border rounded-xl overflow-hidden bg-app-muted">
      <div className="p-4 bg-app-panel">
        <div className="space-y-3">
          <div>
            <span className="font-medium text-sm text-app-text">Pergunta:</span>
            <div className="text-sm mt-1 p-2 bg-app-muted rounded-lg text-app-text" dangerouslySetInnerHTML={{ __html: question }} />
          </div>
          

          
          {showHint && (
            <div>
              <span className="font-medium text-sm text-app-text">Dica:</span>
              <div className="text-sm mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">{hint}</div>
            </div>
          )}
          {showAnswer && (
            <div>
              <span className="font-medium text-sm text-app-text">Resposta:</span>
              <div className="text-sm mt-1 p-2 bg-app-muted rounded-lg text-app-text" dangerouslySetInnerHTML={{ __html: answer }} />
            </div>
          )}
          
          {showAnswer && showRating && onRate && (
            <div>
              <span className="font-medium text-sm text-app-text mb-2 block">Como você avalia sua resposta?</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => onRate(card.id || '', rating)}
                    className="hover:scale-110 transition-transform cursor-pointer"
                    title={rating === 1 ? 'Muito Difícil' : rating === 2 ? 'Difícil' : rating === 3 ? 'Regular' : rating === 4 ? 'Bom' : 'Muito Fácil'}
                  >
                    <Star className="w-6 h-6 text-yellow-400 hover:text-yellow-500 fill-yellow-400" />
                  </button>
                ))}
                <span className="text-xs text-app-text-secondary ml-2">1★ = Difícil | 5★ = Fácil</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          {!showAnswer && (
            <>
              <Button onClick={() => setShowAnswer(true)} className="gap-2">
                <Eye className="w-4 h-4" />
                Ver Resposta
              </Button>
              <Button variant="outline" onClick={() => setShowHint(!showHint)} className="gap-2">
                <Lightbulb className="w-4 h-4" />
                {showHint ? 'Ocultar Dica' : 'Dica'}
              </Button>
            </>
          )}
          {showExportButton && (
            <Button variant="outline" onClick={onExport || (() => alert('Exportar .apkg (mock)'))} className="gap-2">
              <Package className="w-4 h-4" />
              Exportar .apkg
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}