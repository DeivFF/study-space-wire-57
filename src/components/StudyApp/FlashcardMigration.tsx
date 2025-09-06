import React, { useState, useEffect } from 'react';
import { AlertCircle, Download, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { studyAPI } from '@/services/studyApi';
import { toast } from '@/components/ui/enhanced-toast';

interface LocalFlashcard {
  id: string;
  tipo: string;
  pergunta: string;
  resposta?: string;
  respostaCurta?: string;
  respostaAprofundada?: string;
  dica?: string;
  notasProfessor?: string;
  referencia?: string;
  tags: string[];
}

interface FlashcardMigrationProps {
  lessonId: string;
  onComplete: () => void;
}

export const FlashcardMigration: React.FC<FlashcardMigrationProps> = ({ 
  lessonId, 
  onComplete 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localCards, setLocalCards] = useState<LocalFlashcard[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStats, setMigrationStats] = useState({ success: 0, failed: 0 });

  useEffect(() => {
    // Check for local flashcards data
    const checkLocalData = () => {
      try {
        const localData = localStorage.getItem('flashcards-bank-v1');
        if (localData) {
          const cards: LocalFlashcard[] = JSON.parse(localData);
          if (cards.length > 0) {
            setLocalCards(cards);
            setIsOpen(true);
          }
        }
      } catch (error) {
        console.error('Error checking local flashcards:', error);
      }
    };

    checkLocalData();
  }, []);

  const migrateFlashcards = async () => {
    setIsMigrating(true);
    let successCount = 0;
    let failedCount = 0;
    setMigrationStats({ success: 0, failed: 0 });

    for (const card of localCards) {
      try {
        // Convert local card format to API format
        const frontContent = card.pergunta || '';
        let backContent = '';
        
        // Combine different response fields
        if (card.resposta) backContent = card.resposta;
        else if (card.respostaCurta) backContent = card.respostaCurta;
        else if (card.respostaAprofundada) backContent = card.respostaAprofundada;

        // Add additional info to back content if available
        const additionalInfo = [];
        if (card.dica) additionalInfo.push(`**Dica:** ${card.dica}`);
        if (card.notasProfessor) additionalInfo.push(`**Notas:** ${card.notasProfessor}`);
        if (card.referencia) additionalInfo.push(`**Referência:** ${card.referencia}`);
        
        if (additionalInfo.length > 0) {
          backContent += '\n\n' + additionalInfo.join('\n\n');
        }

        if (!frontContent.trim() || !backContent.trim()) {
          throw new Error('Conteúdo inválido');
        }

        await studyAPI.createFlashcard(lessonId, {
          front_content: frontContent,
          back_content: backContent,
          tags: card.tags || []
        });

        successCount++;
        setMigrationStats(prev => ({ ...prev, success: prev.success + 1 }));
        
      } catch (error) {
        console.error('Error migrating card:', error);
        failedCount++;
        setMigrationStats(prev => ({ ...prev, failed: prev.failed + 1 }));
      }
    }

    setIsMigrating(false);
    
    // Show completion toast
    if (successCount > 0) {
      toast.success(`Migração concluída! ${successCount} flashcards migrados com sucesso.`);
    }
    if (failedCount > 0) {
      toast.error(`${failedCount} flashcards falharam na migração.`);
    }

    // Clear local storage after successful migration
    if (successCount > 0) {
      localStorage.removeItem('flashcards-bank-v1');
    }

    onComplete();
    setIsOpen(false);
  };

  const skipMigration = () => {
    setIsOpen(false);
    onComplete();
  };

  if (!isOpen || localCards.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md bg-app-bg border-app-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-app-text">
            <Download className="w-5 h-5" />
            Migração de Flashcards
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Encontramos {localCards.length} flashcard{localCards.length > 1 ? 's' : ''} 
              salvos localmente no seu navegador. Deseja migrar para o banco de dados?
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-app-text">
              Preview dos flashcards encontrados:
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {localCards.slice(0, 5).map((card, index) => (
                <div 
                  key={card.id || index} 
                  className="text-xs p-2 bg-app-muted rounded border border-app-border"
                >
                  <div className="font-medium text-app-text truncate">
                    {card.pergunta || 'Sem pergunta'}
                  </div>
                  <div className="text-app-text-muted truncate">
                    {card.resposta || card.respostaCurta || 'Sem resposta'}
                  </div>
                </div>
              ))}
              {localCards.length > 5 && (
                <div className="text-xs text-app-text-muted text-center py-1">
                  ... e mais {localCards.length - 5} flashcard{localCards.length - 5 > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {isMigrating && (
            <div className="space-y-2">
              <div className="text-sm text-app-text">
                Migrando flashcards... {migrationStats.success + migrationStats.failed} / {localCards.length}
              </div>
              <div className="flex items-center gap-2 text-xs text-app-text-muted">
                <span className="text-green-600">✓ {migrationStats.success} sucessos</span>
                <span className="text-red-600">✗ {migrationStats.failed} falhas</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={migrateFlashcards}
              disabled={isMigrating}
              className="flex-1 bg-app-accent text-white hover:bg-app-accent/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isMigrating ? 'Migrando...' : 'Migrar'}
            </Button>
            <Button
              variant="outline"
              onClick={skipMigration}
              disabled={isMigrating}
              className="flex-1 text-app-text border-app-border hover:bg-app-muted"
            >
              <X className="w-4 h-4 mr-2" />
              Pular
            </Button>
          </div>

          <div className="text-xs text-app-text-muted">
            <strong>Importante:</strong> Os flashcards locais serão removidos do navegador 
            após a migração bem-sucedida.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};