
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Eye, EyeOff, Edit, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseLessonFlashcards } from '@/hooks/useSupabaseLessonFlashcards';
import FlashcardTable from './FlashcardTable';

interface LessonFlashcardWizardProps {
  lessonId: string;
  lessonTitle: string;
  onBack: () => void;
}

const LessonFlashcardWizard = ({ lessonId, lessonTitle, onBack }: LessonFlashcardWizardProps) => {
  const { flashcards, carregarFlashcards } = useSupabaseLessonFlashcards();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showVerso, setShowVerso] = useState(false);
  const [showDica, setShowDica] = useState(false);
  const [lessonFlashcards, setLessonFlashcards] = useState<any[]>([]);
  const [showManagement, setShowManagement] = useState(false);

  useEffect(() => {
    carregarFlashcards(lessonId);
  }, [lessonId, carregarFlashcards]);

  useEffect(() => {
    const filtered = flashcards.filter(f => f.lesson_id === lessonId);
    setLessonFlashcards(filtered);
    setCurrentIndex(0);
    setShowVerso(false);
    setShowDica(false);
  }, [flashcards, lessonId]);

  const currentFlashcard = lessonFlashcards[currentIndex];

  const nextCard = () => {
    if (currentIndex < lessonFlashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowVerso(false);
      setShowDica(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowVerso(false);
      setShowDica(false);
    }
  };

  const toggleVerso = () => {
    setShowVerso(!showVerso);
  };

  const toggleDica = () => {
    setShowDica(!showDica);
  };

  const resetCard = () => {
    setShowVerso(false);
    setShowDica(false);
  };

  const handleFlashcardUpdated = async () => {
    await carregarFlashcards(lessonId);
  };

  if (showManagement) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button onClick={() => setShowManagement(false)} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar ao Estudo
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Flashcards</h1>
            <p className="text-gray-600">{lessonTitle}</p>
          </div>
        </div>

        <FlashcardTable
          flashcards={lessonFlashcards}
          lessonId={lessonId}
          onFlashcardUpdated={handleFlashcardUpdated}
        />
      </div>
    );
  }

  if (lessonFlashcards.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
            <p className="text-gray-600">{lessonTitle}</p>
          </div>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum flashcard encontrado</p>
              <p className="text-sm">Crie flashcards para esta aula primeiro</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
            <p className="text-gray-600">{lessonTitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            {currentIndex + 1} de {lessonFlashcards.length}
          </div>
          <Button 
            onClick={() => setShowManagement(true)} 
            variant="outline"
            size="sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Gerenciar
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="min-h-[400px]">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">
                {showVerso ? 'Verso' : 'Frente'}
              </CardTitle>
              <div className="flex space-x-2">
                {currentFlashcard?.dica && (
                  <Button
                    onClick={toggleDica}
                    size="sm"
                    variant="outline"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {showDica ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    Dica
                  </Button>
                )}
                <Button
                  onClick={resetCard}
                  size="sm"
                  variant="outline"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <div className="text-lg leading-relaxed">
                {showVerso ? currentFlashcard?.verso : currentFlashcard?.frente}
              </div>
            </div>

            {showDica && currentFlashcard?.dica && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Dica:</span>
                </div>
                <p className="text-sm text-blue-700">{currentFlashcard.dica}</p>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                onClick={toggleVerso}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {showVerso ? 'Mostrar Frente' : 'Mostrar Verso'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={prevCard}
            disabled={currentIndex === 0}
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          <div className="flex space-x-1">
            {lessonFlashcards.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={nextCard}
            disabled={currentIndex === lessonFlashcards.length - 1}
            variant="outline"
          >
            Próximo
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LessonFlashcardWizard;
