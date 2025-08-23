
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { QuestionStats } from '@/components/QuestionStats';
import { Button } from '@/components/ui/button';
import { 
  HelpCircle, 
  CheckCircle2, 
  MessageSquare, 
  MessageCircle, 
  BarChart3, 
  BookOpen, 
  X,
  ChevronLeft,
  ChevronRight,
  List,
  ArrowRight
} from 'lucide-react';

interface Option {
  key: string;
  text: string;
}

interface Question {
  id: string;
  title: string;
  category: string;
  question: string;
  options: Option[];
  correctAnswer: string;
  explanation?: string;
  source: string;
  year: string;
  institution: string;
  subject: string;
  topic: string;
  code: string;
}

const questionsData: Question[] = [
  {
    id: '1',
    title: 'Princípio da Exclusividade',
    category: 'Tecnólogo de Administração',
    question: 'Assinale a alternativa que apresenta a ideia principal contida no princípio orçamentário da exclusividade.',
    options: [
      {
        key: 'A',
        text: 'Todas as receitas e todas as despesas devem constar na peça orçamentária com seus valores brutos e não líquidos.'
      },
      {
        key: 'B', 
        text: 'Todas as receitas e todas as despesas devem constar da lei orçamentária, não podendo haver omissão.'
      },
      {
        key: 'C',
        text: 'O planejamento e o orçamento devem se basear em elementos de fácil compreensão.'
      },
      {
        key: 'D',
        text: 'A lei orçamentária não poderá conter matéria estranha à fixação das despesas e à previsão das receitas.'
      },
      {
        key: 'E',
        text: 'É preferível que a execução das ações ocorra no nível mais próximo de seus beneficiários.'
      }
    ],
    correctAnswer: 'D',
    source: 'IF-MS',
    year: '2025',
    institution: 'INSTITUTO AOCP',
    subject: 'Administração Financeira e Orçamentária',
    topic: 'Princípios Orçamentários',
    code: 'Q3548759'
  },
  {
    id: '2',
    title: 'Princípio da Universalidade',
    category: 'Analista Administrativo',
    question: 'O princípio orçamentário da universalidade estabelece que:',
    options: [
      {
        key: 'A',
        text: 'O orçamento deve conter apenas as despesas principais do governo.'
      },
      {
        key: 'B',
        text: 'Todas as receitas e despesas devem estar incluídas no orçamento.'
      },
      {
        key: 'C',
        text: 'O orçamento deve ser votado anualmente.'
      },
      {
        key: 'D',
        text: 'As receitas devem ser apresentadas pelos valores líquidos.'
      },
      {
        key: 'E',
        text: 'O orçamento não pode conter autorizações estranhas.'
      }
    ],
    correctAnswer: 'B',
    source: 'UFPR',
    year: '2024',
    institution: 'INSTITUTO AOCP',
    subject: 'Administração Financeira e Orçamentária',
    topic: 'Princípios Orçamentários',
    code: 'Q3548760'
  }
];

const comments = [
  {
    id: 1,
    author: 'Ana Paula',
    time: 'há 2 dias',
    text: 'A alternativa D trata da exclusividade (sem matérias estranhas). A é universalidade; C é clareza.',
    avatar: 'A'
  },
  {
    id: 2,
    author: 'João Marcos', 
    time: 'há 1 dia',
    text: 'Essa banca adora trocar exclusividade x universalidade. Fiquem atentos!',
    avatar: 'J'
  },
  {
    id: 3,
    author: 'Larissa',
    time: 'há 1 hora', 
    text: 'Fonte: CF/88 art. 165 §8º e Lei 4.320/64. 👍',
    avatar: 'L'
  },
  {
    id: 4,
    author: 'Mateus',
    time: 'há 15 min',
    text: 'Bom item para revisar princípios: unidade, universalidade, anualidade e exclusividade.',
    avatar: 'M'
  }
];

export default function Questoes() {
  const [viewMode, setViewMode] = useState<'list' | 'wizard'>('list');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const currentQuestion = questionsData[currentQuestionIndex];
  const selectedOption = answers[currentQuestion.id] || null;
  const isAnswered = answeredQuestions.has(currentQuestion.id);

  const handleOptionSelect = (questionId: string, key: string) => {
    if (answeredQuestions.has(questionId)) return;
    setAnswers(prev => ({ ...prev, [questionId]: key }));
  };

  const handleAnswer = (questionId: string) => {
    const selectedAnswer = answers[questionId];
    if (!selectedAnswer) {
      alert('Selecione uma alternativa.');
      return;
    }
    setAnsweredQuestions(prev => new Set([...prev, questionId]));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questionsData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const getOptionClass = (questionId: string, key: string) => {
    const selectedAnswer = answers[questionId];
    const isQuestionAnswered = answeredQuestions.has(questionId);
    const question = questionsData.find(q => q.id === questionId);
    
    let baseClass = 'flex items-start gap-3 p-3 border border-app-border bg-app-bg-soft rounded-xl cursor-pointer transition-all duration-150 hover:bg-app-muted';
    
    if (!isQuestionAnswered && selectedAnswer === key) {
      baseClass += ' border-app-accent bg-app-accent/10';
    } else if (isQuestionAnswered && question) {
      if (key === question.correctAnswer) {
        baseClass += ' border-app-success bg-app-success/10';
      } else if (key === selectedAnswer && selectedAnswer !== question.correctAnswer) {
        baseClass += ' border-app-danger bg-app-danger/10';
      }
    }
    
    return baseClass;
  };

  const renderQuestion = (question: Question, index?: number) => (
    <div key={question.id} className="bg-app-bg-soft border border-app-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-app-border">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-app-accent mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap mb-1">
              <h1 className="text-lg font-semibold text-app-text">
                {viewMode === 'wizard' && `${index! + 1}. `}Questão — {question.title}
              </h1>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-app-muted text-app-text rounded-full border border-app-border">
                {question.category}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-app-text-muted flex-wrap">
              <span className="inline-flex items-center px-2 py-1 bg-app-muted text-app-text rounded-full border border-app-border">
                {viewMode === 'list' ? index! + 1 : currentQuestionIndex + 1}
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-app-muted text-app-text rounded-full border border-app-border">
                {question.code}
              </span>
              <span className="font-semibold text-app-text">{question.institution} - {question.year}</span>
              <span className="opacity-50">›</span>
              <span>{question.subject}</span>
              <span className="opacity-50">›</span>
              <span className="font-semibold text-app-text">{question.topic}</span>
              <span className="text-app-text-muted">{question.source}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xl font-medium text-app-text mb-4">
          {question.question}
        </p>

        {/* Options */}
        <div className="space-y-3 mb-4">
          {question.options.map((option) => (
            <label 
              key={option.key}
              className={getOptionClass(question.id, option.key)}
              onClick={() => handleOptionSelect(question.id, option.key)}
            >
              <div className="w-7 h-7 rounded-full border border-app-border flex items-center justify-center font-semibold text-sm bg-app-bg-soft flex-shrink-0">
                {option.key}
              </div>
              <span className="flex-1 text-app-text">{option.text}</span>
            </label>
          ))}
        </div>

        {/* Answer Button */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => handleAnswer(question.id)}
            className="bg-app-accent hover:bg-app-accent/90 text-white"
            disabled={answeredQuestions.has(question.id)}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Responder
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-app-border bg-app-muted flex items-center justify-between rounded-b-2xl">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-app-border bg-app-bg-soft hover:bg-app-muted">
            <MessageSquare className="h-4 w-4 mr-2" />
            Solicitar gabarito comentado
          </Button>
          <Button 
            onClick={() => setShowComments(!showComments)}
            variant="outline" 
            size="sm"
            className="border-app-border bg-app-muted hover:bg-app-border"
            title={showComments ? 'Ocultar comentários' : 'Ver comentários'}
          >
            {showComments ? <X className="h-4 w-4 mr-2" /> : <MessageCircle className="h-4 w-4 mr-2" />}
            Comentários de alunos <strong className="ml-1">4</strong>
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowStats(true)}
            className="hover:bg-app-muted"
            title="Estatísticas"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-app-muted" title="Aulas">
            <BookOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4">
        {/* View Mode Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-app-text">Questões</h1>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-app-accent text-white' : 'border-app-border hover:bg-app-muted'}
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
            <Button
              variant={viewMode === 'wizard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('wizard')}
              className={viewMode === 'wizard' ? 'bg-app-accent text-white' : 'border-app-border hover:bg-app-muted'}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Wizard
            </Button>
          </div>
        </div>

        {viewMode === 'list' ? (
          /* List Mode */
          <div className={`grid gap-6 ${showComments ? 'grid-cols-1 lg:grid-cols-[3fr_1fr]' : 'grid-cols-1'}`}>
            <div className="space-y-6">
              {questionsData.map((question, index) => renderQuestion(question, index))}
            </div>
            
            {/* Comments Panel for List Mode */}
            {showComments && (
              <aside className="bg-app-bg-soft border border-app-border rounded-2xl overflow-hidden shadow-sm h-fit">
                <div className="p-4 border-b border-app-border">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-app-accent" />
                    <h2 className="text-lg font-semibold text-app-text">Comentários de alunos</h2>
                    <div className="flex-1"></div>
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-app-muted text-app-text rounded-full border border-app-border">
                      {comments.length} comentários
                    </span>
                  </div>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 pb-4 border-b border-app-border last:border-b-0">
                        <div className="w-8 h-8 rounded-full bg-app-muted flex items-center justify-center font-semibold text-sm text-app-text flex-shrink-0">
                          {comment.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-app-text">{comment.author}</span>
                            <span className="text-xs text-app-text-muted">• {comment.time}</span>
                          </div>
                          <p className="text-sm text-app-text-muted">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        ) : (
          /* Wizard Mode */
          <div className={`grid gap-4 ${showComments ? 'grid-cols-1 lg:grid-cols-[3fr_1fr]' : 'grid-cols-1'}`}>
            <div className="space-y-4">
              {/* Question Navigation */}
              <div className="bg-app-bg-soft border border-app-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-app-text-muted">
                    Questão {currentQuestionIndex + 1} de {questionsData.length}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={previousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="border-app-border hover:bg-app-muted"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextQuestion}
                      disabled={currentQuestionIndex === questionsData.length - 1}
                      className="border-app-border hover:bg-app-muted"
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-app-text-muted mb-1">
                    <span>Progresso</span>
                    <span>{Math.round(((currentQuestionIndex + 1) / questionsData.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-app-muted rounded-full h-2">
                    <div 
                      className="bg-app-accent h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${((currentQuestionIndex + 1) / questionsData.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Current Question */}
              {renderQuestion(currentQuestion, currentQuestionIndex)}
            </div>
            
            {/* Comments Panel for Wizard Mode */}
            {showComments && (
              <aside className="bg-app-bg-soft border border-app-border rounded-2xl overflow-hidden shadow-sm h-fit">
                <div className="p-4 border-b border-app-border">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-app-accent" />
                    <h2 className="text-lg font-semibold text-app-text">Comentários de alunos</h2>
                    <div className="flex-1"></div>
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-app-muted text-app-text rounded-full border border-app-border">
                      {comments.length} comentários
                    </span>
                  </div>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 pb-4 border-b border-app-border last:border-b-0">
                        <div className="w-8 h-8 rounded-full bg-app-muted flex items-center justify-center font-semibold text-sm text-app-text flex-shrink-0">
                          {comment.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-app-text">{comment.author}</span>
                            <span className="text-xs text-app-text-muted">• {comment.time}</span>
                          </div>
                          <p className="text-sm text-app-text-muted">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}

        {/* Question Stats Modal */}
        <QuestionStats 
          isOpen={showStats}
          onClose={() => setShowStats(false)}
          questionId={viewMode === 'wizard' ? currentQuestion.id : questionsData[0].id}
        />
      </div>
    </Layout>
  );
}
