import React from 'react';
import { BarChart3, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Question {
  id: string;
  title: string;
  code: string;
}

interface SessionSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  sessionTime: number;
  questions: Question[];
  answeredQuestions: string[];
  questionTimers: Record<string, number>;
  answers: Record<string, string>;
  correctAnswers: Record<string, string>;
  onNewSession: () => void;
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-muted/50 rounded-lg p-4">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className="text-xl font-semibold">{value}</div>
  </div>
);

export const SessionSummaryModal: React.FC<SessionSummaryProps> = ({
  isOpen,
  onClose,
  sessionTime,
  questions,
  answeredQuestions,
  questionTimers,
  answers,
  correctAnswers,
  onNewSession
}) => {
  const answeredCount = answeredQuestions.length;
  const correctCount = answeredQuestions.filter(qId => 
    answers[qId] === correctAnswers[qId]
  ).length;
  
  const successRate = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  
  const times = Object.values(questionTimers).filter(t => t > 0);
  const avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const fastestTime = times.length > 0 ? Math.min(...times) : 0;
  const slowestTime = times.length > 0 ? Math.max(...times) : 0;

  const handleNewSession = () => {
    onNewSession();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto" data-testid="session-summary-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resumo da sessão
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Tempo total" value={formatTime(sessionTime)} />
            <StatCard label="Questões respondidas" value={answeredCount} />
            <StatCard label="Aproveitamento" value={`${successRate}%`} />
            <StatCard label="Média por questão" value={formatTime(avgTime)} />
            <StatCard label="Mais rápida" value={formatTime(fastestTime)} />
            <StatCard label="Mais lenta" value={formatTime(slowestTime)} />
          </div>

          {/* Tabela Detalhada */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left text-sm text-muted-foreground p-2">#</th>
                  <th className="text-left text-sm text-muted-foreground p-2">Questão</th>
                  <th className="text-left text-sm text-muted-foreground p-2">Tempo</th>
                  <th className="text-left text-sm text-muted-foreground p-2">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {questions
                  .filter(question => answeredQuestions.includes(question.id))
                  .map((question, idx) => {
                  const userAnswer = answers[question.id];
                  const correctAnswer = correctAnswers[question.id];
                  const isCorrect = userAnswer === correctAnswer;
                  const time = questionTimers[question.id];
                  
                  return (
                    <tr key={idx} className="border-b">
                      <td className="text-sm text-muted-foreground p-2">{idx + 1}</td>
                      <td className="text-sm p-2">
                        {question.title} <span className="text-muted-foreground">({question.code})</span>
                      </td>
                      <td className="text-sm p-2">
                        {time ? formatTime(time) : '—'}
                      </td>
                      <td className="text-sm p-2">
                        {isCorrect ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            ✔ correta
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                            ✖ errada
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleNewSession}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Nova sessão
            </Button>
            <Button onClick={onClose}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Concluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};