import { useState, useEffect } from 'react';
import { usePollVote } from '@/hooks/usePollVote';

interface EnquetePostProps {
  title?: string;
  options: string[];
  duration?: string;
  postId: string;
}

const EnquetePost: React.FC<EnquetePostProps> = ({ title, options, duration, postId }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { vote, getResults, loading, error } = usePollVote();

  // Check if user has already voted when component mounts
  useEffect(() => {
    const loadResults = async () => {
      const pollResults = await getResults(postId);
      if (pollResults && pollResults.userVote !== null) {
        // Only set results if user has already voted
        setResults(pollResults);
        setHasVoted(true);
      }
    };

    loadResults();
  }, [postId, getResults]);

  const handleVote = async () => {
    if (selectedOption === null) return;

    const pollResults = await vote(postId, selectedOption);
    if (pollResults) {
      setResults(pollResults);
      setHasVoted(true);
    }
  };

  // Render poll options with voting interface
  const renderVotingInterface = () => {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {options.map((option: string, index: number) => (
            <label 
              key={index}
              className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedOption === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <input 
                type="radio" 
                name={`poll${postId}`} 
                checked={selectedOption === index}
                onChange={() => setSelectedOption(index)}
                disabled={hasVoted}
                className="w-4 h-4 text-blue-600"
                aria-label={`Opção ${index + 1}: ${option}`}
              />
              <span className="text-sm font-medium">{option}</span>
            </label>
          ))}
        </div>
        <button 
          className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedOption !== null && !hasVoted && !loading
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={handleVote}
          disabled={selectedOption === null || hasVoted || loading}
        >
          {loading ? 'Enviando...' : 'Confirmar voto'}
        </button>
      </div>
    );
  };

  // Component for result bar with improved animations
  const ResultBar = ({ result, isUserChoice }: { result: any, isUserChoice: boolean }) => (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className={`text-sm font-medium ${isUserChoice ? 'text-green-700 font-semibold' : ''}`}>
          {result.optionText}
          {isUserChoice && <span className="ml-1 text-green-600">✓</span>}
        </span>
        <span className="text-xs text-muted-foreground">{result.percentage}% ({result.voteCount})</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-2 rounded-full transition-all duration-700 ease-out ${
            isUserChoice ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${result.percentage}%` }}
        />
      </div>
    </div>
  );

  // Render poll results with visual bars
  const renderResults = () => {
    if (!results) return null;

    return (
      <div className="space-y-3">
        {results.results.map((result: any) => (
          <ResultBar 
            key={result.optionIndex} 
            result={result} 
            isUserChoice={results.userVote === result.optionIndex}
          />
        ))}
        <div className="text-sm text-muted-foreground mt-4 pt-2 border-t">
          {results.totalVotes} voto{results.totalVotes !== 1 ? 's' : ''} total
          {duration && ` • Encerra em ${duration} dias`}
        </div>
      </div>
    );
  };

  return (
    <div className="study-post-text">
      {title && <p className="font-bold mb-3">{title}</p>}
      {hasVoted && results ? renderResults() : renderVotingInterface()}
      {error && <div className="error text-sm mt-2">{error}</div>}
    </div>
  );
};

export default EnquetePost;