
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseLessonFlashcards } from '@/hooks/useSupabaseLessonFlashcards';

interface LessonFlashcardFormProps {
  lessonId: string;
  lessonTitle: string;
  onBack: () => void;
  onFlashcardCreated: () => void;
}

const LessonFlashcardForm = ({ lessonId, lessonTitle, onBack, onFlashcardCreated }: LessonFlashcardFormProps) => {
  const [frente, setFrente] = useState('');
  const [verso, setVerso] = useState('');
  const [dica, setDica] = useState('');

  const { adicionarFlashcard, loading } = useSupabaseLessonFlashcards();

  const handleSubmit = async () => {
    if (!frente.trim() || !verso.trim()) {
      alert('Preencha a frente e o verso do flashcard');
      return;
    }

    try {
      const result = await adicionarFlashcard(lessonId, frente, verso, dica || undefined);
      if (result) {
        setFrente('');
        setVerso('');
        setDica('');
        onFlashcardCreated();
      }
    } catch (error) {
      console.error('Erro ao criar flashcard:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button onClick={onBack} variant="outline">
          <X className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Criar Flashcard</h1>
          <p className="text-gray-600">{lessonTitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="frente">Frente do Flashcard</Label>
            <Textarea
              id="frente"
              placeholder="Digite a pergunta ou conceito da frente do cartão"
              value={frente}
              onChange={(e) => setFrente(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="verso">Verso do Flashcard</Label>
            <Textarea
              id="verso"
              placeholder="Digite a resposta ou explicação do verso do cartão"
              value={verso}
              onChange={(e) => setVerso(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="dica">Dica (Opcional)</Label>
            <Input
              id="dica"
              placeholder="Digite uma dica que pode ajudar a lembrar da resposta"
              value={dica}
              onChange={(e) => setDica(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button onClick={onBack} variant="outline" disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !frente.trim() || !verso.trim()}>
              {loading ? 'Criando...' : 'Criar Flashcard'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonFlashcardForm;
