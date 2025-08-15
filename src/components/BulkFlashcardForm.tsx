import { useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSupabaseLessonFlashcards } from '@/hooks/useSupabaseLessonFlashcards';
import FlashcardTable from './FlashcardTable';

interface BulkFlashcardFormProps {
  lessonId: string;
  lessonTitle: string;
  onBack: () => void;
  onFlashcardsCreated: () => void;
}

const BulkFlashcardForm = ({ lessonId, lessonTitle, onBack, onFlashcardsCreated }: BulkFlashcardFormProps) => {
  const { adicionarFlashcard, flashcards, carregarFlashcards, loading } = useSupabaseLessonFlashcards();
  const [flashcardsText, setFlashcardsText] = useState('');
  const [showTable, setShowTable] = useState(false);

  const parseFlashcards = (text: string) => {
    try {
      console.log('Parsing flashcards JSON:', text);
      
      // Parse the JSON array
      const jsonData = JSON.parse(text);
      
      if (!Array.isArray(jsonData)) {
        console.log('Data is not an array');
        return [];
      }
      
      const flashcards = [];
      
      for (const item of jsonData) {
        console.log('Processing flashcard item:', item);
        
        if (typeof item !== 'object' || item === null) {
          console.log('Item is not an object:', item);
          continue;
        }
        
        const frente = item.frente || item.front || '';
        const verso = item.verso || item.back || '';
        const dica = item.dica || item.hint || '';
        
        console.log('Parsed flashcard:', { frente, verso, dica });
        
        if (frente && verso) {
          flashcards.push({
            front: frente,
            back: verso,
            hint: dica
          });
        }
      }
      
      console.log('Final parsed flashcards:', flashcards);
      return flashcards;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return [];
    }
  };

  const handleSubmit = async () => {
    const flashcards = parseFlashcards(flashcardsText);
    
    if (flashcards.length === 0) {
      alert('Nenhum flashcard válido encontrado. Verifique o formato JSON.');
      return;
    }

    let successCount = 0;
    
    for (const card of flashcards) {
      const result = await adicionarFlashcard(lessonId, card.front, card.back, card.hint);
      if (result) successCount++;
    }

    if (successCount > 0) {
      setFlashcardsText('');
      setShowTable(true);
      await carregarFlashcards(lessonId);
      onFlashcardsCreated();
    }
  };

  const handleFlashcardUpdated = async () => {
    await carregarFlashcards(lessonId);
  };

  const lessonFlashcards = flashcards.filter(f => f.lesson_id === lessonId);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Adicionar Múltiplos Flashcards</h2>
            <p className="text-purple-100">{lessonTitle}</p>
          </div>
          <Button onClick={onBack} variant="outline" className="text-purple-600 border-white hover:bg-white">
            <X className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>

      {!showTable ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="flashcards-text">Flashcards (formato JSON)</Label>
              <p className="text-sm text-gray-600 mb-2">
                Formato: Array JSON com objetos contendo "frente", "verso" e "dica" (opcional)
              </p>
              <Textarea
                id="flashcards-text"
                value={flashcardsText}
                onChange={(e) => setFlashcardsText(e.target.value)}
                placeholder={`[
  {
    "frente": "O que é HTML?",
    "verso": "HyperText Markup Language",
    "dica": "Linguagem de marcação para páginas web"
  },
  {
    "frente": "Qual é a capital da França?",
    "verso": "Paris",
    "dica": "Cidade mais populosa da França"
  },
  {
    "frente": "Como se diz 'olá' em inglês?",
    "verso": "Hello",
    "dica": "Cumprimento básico em inglês"
  }
]`}
                rows={15}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleSubmit} 
                disabled={loading || !flashcardsText.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Salvando...' : `Processar Flashcards`}
              </Button>
            </div>

            {flashcardsText.trim() && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Flashcards detectados: {parseFlashcards(flashcardsText).length}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {(showTable || lessonFlashcards.length > 0) && (
        <FlashcardTable
          flashcards={lessonFlashcards}
          lessonId={lessonId}
          onFlashcardUpdated={handleFlashcardUpdated}
        />
      )}

      {showTable && (
        <div className="flex justify-center">
          <Button
            onClick={() => setShowTable(false)}
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Mais Flashcards
          </Button>
        </div>
      )}
    </div>
  );
};

export default BulkFlashcardForm;
