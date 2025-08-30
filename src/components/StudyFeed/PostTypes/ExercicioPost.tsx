import { useState } from 'react';
import { useExerciseResponse } from '@/hooks/useExerciseResponse';
import { CheckCircle, XCircle } from 'lucide-react';

interface ExercicioPostProps {
 content: string;
  options: string[] | Array<{letra: string, texto: string, correta: boolean}>;
  difficulty?: string;
  subject?: string;
  postId: string;
}

const ExercicioPost: React.FC<ExercicioPostProps> = ({ content, options, difficulty, subject, postId }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { submitResponse, loading, error } = useExerciseResponse();

  // Helper function to get option className based on state
  const getOptionClassName = (index: number, isSelected: boolean) => {
    const baseClasses = "flex items-center gap-3 p-3 rounded-md border transition-all duration-200 cursor-pointer";
    
    if (!hasResponded) {
      return `${baseClasses} ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`;
    }
    
    if (correctOptionIndex === index) {
      return `${baseClasses} border-2 border-green-500 bg-green-50`;
    }
    
    if (isSelected && !isCorrect) {
      return `${baseClasses} border-2 border-red-500 bg-red-50`;
    }
    
    return `${baseClasses} border-gray-200 bg-gray-50 opacity-75`;
  };

  // Handle both string[] and object[] formats
  const renderOptions = () => {
    if (!options || options.length === 0) return null;
    
    // Check if options is array of objects (new format)
    if (typeof options[0] === 'object' && options[0] !== null && 'letra' in options[0]) {
      const objOptions = options as Array<{letra: string, texto: string, correta: boolean}>;
      return (
        <div className="space-y-2 mb-4">
          {objOptions.map((option, index) => {
            const isUserSelection = selectedOption === index;
            const isCorrectOption = correctOptionIndex === index;
            
            return (
              <label 
                key={index} 
                className={getOptionClassName(index, isUserSelection)}
              >
                <input 
                  type="radio" 
                  name={`ex${postId}`} 
                  checked={selectedOption === index}
                  onChange={() => !hasResponded && setSelectedOption(index)}
                  disabled={hasResponded}
                  className="w-4 h-4 text-blue-600"
                  aria-label={`Alternativa ${option.letra}: ${option.texto}`}
                />
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                  hasResponded && isCorrectOption ? 'bg-green-600 text-white' :
                  hasResponded && isUserSelection && !isCorrect ? 'bg-red-600 text-white' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {option.letra}
                </span>
                <span className="text-sm font-medium flex-1">{option.texto}</span>
                {hasResponded && isCorrectOption && <CheckCircle className="h-5 w-5 text-green-600" />}
                {hasResponded && isUserSelection && !isCorrect && <XCircle className="h-5 w-5 text-red-600" />}
              </label>
            );
          })}
        </div>
      );
    }
    
    // Handle string[] format (legacy)
    const strOptions = options as string[];
    return (
      <div className="space-y-2 mb-4">
        {strOptions.map((option: string, index: number) => {
          const isUserSelection = selectedOption === index;
          const isCorrectOption = correctOptionIndex === index;
          const letter = String.fromCharCode(65 + index);
          
          return (
            <label 
              key={index} 
              className={getOptionClassName(index, isUserSelection)}
            >
              <input 
                type="radio" 
                name={`ex${postId}`} 
                checked={selectedOption === index}
                onChange={() => !hasResponded && setSelectedOption(index)}
                disabled={hasResponded}
                className="w-4 h-4 text-blue-600"
                aria-label={`Alternativa ${letter}: ${option}`}
              />
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                hasResponded && isCorrectOption ? 'bg-green-600 text-white' :
                hasResponded && isUserSelection && !isCorrect ? 'bg-red-600 text-white' :
                'bg-gray-200 text-gray-700'
              }`}>
                {letter}
              </span>
              <span className="text-sm font-medium flex-1">{option}</span>
              {hasResponded && isCorrectOption && <CheckCircle className="h-5 w-5 text-green-600" />}
              {hasResponded && isUserSelection && !isCorrect && <XCircle className="h-5 w-5 text-red-600" />}
            </label>
          );
        })}
      </div>
    );
  };

  // Feedback component with improved design
  const FeedbackMessage = ({ isCorrect, explanation }: { isCorrect: boolean; explanation?: string }) => (
    <div className={`mt-4 p-4 rounded-lg border ${
      isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center mb-2">
        {isCorrect ? (
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600 mr-2" />
        )}
        <span className={`font-semibold ${
          isCorrect ? 'text-green-800' : 'text-red-800'
        }`}>
          {isCorrect ? 'Correto!' : 'Incorreto'}
        </span>
      </div>
      <p className={`text-sm ${
        isCorrect ? 'text-green-700' : 'text-red-700'
      }`}>
        {isCorrect 
          ? 'Parabéns! Você acertou a resposta.' 
          : 'Não foi desta vez. A alternativa correta está destacada acima.'
        }
      </p>
      {explanation && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-sm text-gray-700">{explanation}</p>
        </div>
      )}
    </div>
  );

  const handleSubmit = async () => {
    if (selectedOption === null) return;

    const response = await submitResponse(postId, { selectedOptionIndex: selectedOption });
    if (response) {
      setHasResponded(true);
      setIsCorrect(response.isCorrect ?? null);
      setCorrectOptionIndex(response.correctOptionIndex ?? null);
      setFeedback(response.explanation || null);
    }
  };

  return (
    <div className="study-post-text">
      <p className="mb-4">{content}</p>
      {renderOptions()}
      {!hasResponded ? (
        <button 
          className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedOption !== null && !loading
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleSubmit}
          disabled={selectedOption === null || loading}
        >
          {loading ? 'Enviando...' : 'Enviar resposta'}
        </button>
      ) : (
        isCorrect !== null && <FeedbackMessage isCorrect={isCorrect} explanation={feedback} />
      )}
      {(difficulty || subject) && (
        <div className="flex flex-wrap gap-2 mt-4">
          {difficulty && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              Dificuldade: {difficulty}
            </span>
          )}
          {subject && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              Tema: {subject}
            </span>
          )}
        </div>
      )}
      {error && <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 rounded">{error}</div>}
    </div>
  );
};

export default ExercicioPost;