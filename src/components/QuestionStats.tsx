import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Users, Clock, CheckCircle, X } from 'lucide-react';

interface QuestionStatsProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
}

export function QuestionStats({ isOpen, onClose, questionId }: QuestionStatsProps) {
  // Dados mockados para demonstração
  const stats = {
    totalAnswers: 1247,
    correctAnswers: 789,
    averageTime: '2m 34s',
    difficulty: 'Médio',
    options: [
      { key: 'A', percentage: 15, count: 187 },
      { key: 'B', percentage: 22, count: 274 },
      { key: 'C', percentage: 18, count: 224 },
      { key: 'D', percentage: 63, count: 789, correct: true },
      { key: 'E', percentage: 12, count: 150 },
    ]
  };

  const successRate = Math.round((stats.correctAnswers / stats.totalAnswers) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-app-bg-soft border-app-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-app-text">
            <BarChart3 className="h-5 w-5 text-app-accent" />
            Estatísticas da Questão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas Gerais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-app-muted rounded-lg p-4 text-center">
              <Users className="h-8 w-8 text-app-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-app-text">{stats.totalAnswers.toLocaleString()}</div>
              <div className="text-sm text-app-text-muted">Respostas</div>
            </div>
            
            <div className="bg-app-muted rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-app-success mx-auto mb-2" />
              <div className="text-2xl font-bold text-app-text">{successRate}%</div>
              <div className="text-sm text-app-text-muted">Taxa de Acerto</div>
            </div>
            
            <div className="bg-app-muted rounded-lg p-4 text-center">
              <Clock className="h-8 w-8 text-app-warning mx-auto mb-2" />
              <div className="text-2xl font-bold text-app-text">{stats.averageTime}</div>
              <div className="text-sm text-app-text-muted">Tempo Médio</div>
            </div>
            
            <div className="bg-app-muted rounded-lg p-4 text-center">
              <BarChart3 className="h-8 w-8 text-app-text-muted mx-auto mb-2" />
              <div className="text-2xl font-bold text-app-text">{stats.difficulty}</div>
              <div className="text-sm text-app-text-muted">Dificuldade</div>
            </div>
          </div>

          {/* Distribuição por Alternativa */}
          <div className="bg-app-muted rounded-lg p-4">
            <h3 className="text-lg font-semibold text-app-text mb-4">Distribuição das Respostas</h3>
            <div className="space-y-3">
              {stats.options.map((option) => (
                <div key={option.key} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-semibold text-sm ${
                    option.correct 
                      ? 'bg-app-success/10 border-app-success text-app-success' 
                      : 'bg-app-bg-soft border-app-border text-app-text'
                  }`}>
                    {option.key}
                    {option.correct && <CheckCircle className="h-3 w-3 ml-1" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-app-text">
                        Alternativa {option.key}
                      </span>
                      <span className="text-sm text-app-text-muted">
                        {option.percentage}% ({option.count})
                      </span>
                    </div>
                    <Progress 
                      value={option.percentage} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Análise de Dificuldade */}
          <div className="bg-app-muted rounded-lg p-4">
            <h3 className="text-lg font-semibold text-app-text mb-2">Análise</h3>
            <p className="text-app-text-muted text-sm">
              Esta questão apresenta nível de dificuldade <strong className="text-app-text">{stats.difficulty.toLowerCase()}</strong> com taxa de acerto de <strong className="text-app-text">{successRate}%</strong>. 
              A alternativa mais escolhida incorretamente foi a <strong className="text-app-text">B (22%)</strong>, 
              indicando possível confusão com o conceito de universalidade orçamentária.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}