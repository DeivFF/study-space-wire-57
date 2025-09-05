import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, Table, Trash2, Calendar, Filter, Search,
  FileText, Target, CheckCircle, Upload, RotateCcw, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActivity } from '@/hooks/useActivity';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryTimelineProps {
  lessonId: string;
}

interface ActivityEntry {
  id: string;
  timestamp: string;
  kind: 'flashcard' | 'exercise';
  tipo: string;
  pergunta: string;
  tags: string[];
  referencia: string;
  // Flashcard specific
  grade?: number;
  before?: { ef: number; reps: number; ivl: number; due: number };
  after?: { ef: number; reps: number; ivl: number; due: number };
  respostaCurta?: string;
  respostaAprofundada?: string;
  // Exercise specific
  result?: boolean;
  timeSpent?: number;
  difficulty?: string;
  userAnswer?: string | number;
  correctAnswer?: string;
  options?: string[];
}

interface Filters {
  startDate: string;
  endDate: string;
  kind: 'all' | 'flashcard' | 'exercise';
  tipo: 'all' | 'conceito' | 'definição' | 'caso' | 'mcq' | 'essay';
  grade: 'all' | '5' | '4' | '3' | '0';
  search: string;
}

export const HistoryTimeline = ({ lessonId }: HistoryTimelineProps) => {
  const { activities, isLoading, clearActivity } = useActivity(lessonId);
  const [viewModal, setViewModal] = useState<{ isOpen: boolean; entry: ActivityEntry | null }>({
    isOpen: false,
    entry: null
  });

  const [filters, setFilters] = useState<Filters>({
    startDate: '',
    endDate: '',
    kind: 'all',
    tipo: 'all',
    grade: 'all',
    search: ''
  });

  // Mock data for demonstration
  const mockHistory: ActivityEntry[] = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      kind: 'flashcard',
      tipo: 'conceito',
      pergunta: 'O que é controle difuso de constitucionalidade?',
      tags: ['constitucional', 'controle'],
      referencia: 'CF/88, art. 97',
      grade: 5,
      before: { ef: 2.5, reps: 0, ivl: 0, due: Date.now() + 3 * 86400000 },
      after: { ef: 2.5, reps: 1, ivl: 4, due: Date.now() + 7 * 86400000 },
      respostaCurta: 'Qualquer juiz/tribunal afasta a lei no caso concreto.',
      respostaAprofundada: 'É exercido incidentalmente; efeitos inter partes, salvo modulação pelo STF.'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      kind: 'exercise',
      tipo: 'mcq',
      pergunta: 'Nos termos da Lei 14.133/2021, qual o critério do menor preço?',
      tags: ['licitações'],
      referencia: 'Lei 14.133/2021',
      result: true,
      timeSpent: 48,
      difficulty: 'médio',
      userAnswer: 1,
      correctAnswer: '1',
      options: ['Preço global', 'Preço unitário quando previsto', 'Maior desconto', 'Técnica e preço sempre']
    }
  ];

  const getFilteredEntries = () => {
    let filtered = mockHistory;

    // Filter by date range
    if (filters.startDate) {
      const start = startOfDay(new Date(filters.startDate));
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= start);
    }
    if (filters.endDate) {
      const end = endOfDay(new Date(filters.endDate));
      filtered = filtered.filter(entry => new Date(entry.timestamp) <= end);
    }

    // Filter by kind
    if (filters.kind !== 'all') {
      filtered = filtered.filter(entry => entry.kind === filters.kind);
    }

    // Filter by tipo
    if (filters.tipo !== 'all') {
      filtered = filtered.filter(entry => entry.tipo === filters.tipo);
    }

    // Filter by grade
    if (filters.grade !== 'all') {
      if (filters.grade === '0') {
        filtered = filtered.filter(entry => entry.grade !== undefined && entry.grade <= 2);
      } else {
        const grade = parseInt(filters.grade);
        filtered = filtered.filter(entry => entry.grade === grade);
      }
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.pergunta.toLowerCase().includes(searchLower) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        entry.referencia.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const setDateRange = (range: 'today' | '7' | '30' | 'all') => {
    const now = new Date();
    let startDate = '';
    let endDate = format(now, 'yyyy-MM-dd');

    switch (range) {
      case 'today':
        startDate = format(now, 'yyyy-MM-dd');
        break;
      case '7':
        startDate = format(subDays(now, 7), 'yyyy-MM-dd');
        break;
      case '30':
        startDate = format(subDays(now, 30), 'yyyy-MM-dd');
        break;
      case 'all':
        startDate = '';
        endDate = '';
        break;
    }

    setFilters(prev => ({ ...prev, startDate, endDate }));
  };

  const exportData = (format: 'json' | 'csv') => {
    const data = getFilteredEntries();
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historico-${lessonId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV export logic would go here
      console.log('CSV export not implemented yet');
    }
  };

  const filteredEntries = getFilteredEntries();
  const stats = {
    total: filteredEntries.length,
    accuracy: filteredEntries.length > 0 ? 
      Math.round((filteredEntries.filter(e => e.result === true || (e.grade && e.grade >= 3)).length / filteredEntries.length) * 100) : 0,
    avgEF: filteredEntries.filter(e => e.after?.ef).length > 0 ?
      (filteredEntries.filter(e => e.after?.ef).reduce((sum, e) => sum + (e.after?.ef || 0), 0) / filteredEntries.filter(e => e.after?.ef).length).toFixed(1) : '—'
  };

  return (
    <div className="space-y-4">
      {/* Statistics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-app-border rounded-xl p-4 bg-app-bg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Resumo</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-app-text-muted">Registros</span>
              <span>{stats.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-app-text-muted">Acerto (geral)</span>
              <span>{stats.accuracy}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-app-text-muted">EF médio (flashcards)</span>
              <span>{stats.avgEF}</span>
            </div>
          </div>
        </div>

        <div className="border border-app-border rounded-xl p-4 bg-app-bg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold">Período</span>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text text-sm"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-lg bg-app-bg border border-app-border text-app-text text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {[
                { key: 'today', label: 'Hoje' },
                { key: '7', label: '7 dias' },
                { key: '30', label: '30 dias' },
                { key: 'all', label: 'Tudo' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDateRange(key as any)}
                  className="px-2 py-1 border border-app-border rounded-full text-xs hover:bg-app-muted"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-app-border rounded-xl p-4 bg-app-bg">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-5 h-5" />
            <span className="font-semibold">Filtros</span>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Buscar pergunta/tags/ref…"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="text-sm bg-app-bg border-app-border"
            />
            <div className="grid grid-cols-2 gap-2">
              <Select value={filters.kind} onValueChange={(value: any) => setFilters(prev => ({ ...prev, kind: value }))}>
                <SelectTrigger className="text-sm bg-app-bg border-app-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Conteúdo: Todos</SelectItem>
                  <SelectItem value="flashcard">Flashcards</SelectItem>
                  <SelectItem value="exercise">Exercícios</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.tipo} onValueChange={(value: any) => setFilters(prev => ({ ...prev, tipo: value }))}>
                <SelectTrigger className="text-sm bg-app-bg border-app-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tipo: Todos</SelectItem>
                  <SelectItem value="conceito">Conceito</SelectItem>
                  <SelectItem value="definição">Definição</SelectItem>
                  <SelectItem value="caso">Caso</SelectItem>
                  <SelectItem value="mcq">Múltipla escolha</SelectItem>
                  <SelectItem value="essay">Dissertativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={filters.grade} onValueChange={(value: any) => setFilters(prev => ({ ...prev, grade: value }))}>
              <SelectTrigger className="text-sm bg-app-bg border-app-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Resultado/Nota</SelectItem>
                <SelectItem value="5">Certo / Fácil (5)</SelectItem>
                <SelectItem value="4">Bom (4)</SelectItem>
                <SelectItem value="3">Difícil (3)</SelectItem>
                <SelectItem value="0">Errado (0–2)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-2">
        <Button onClick={() => exportData('json')} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar JSON
        </Button>
        <Button onClick={() => exportData('csv')} variant="outline" size="sm">
          <Table className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
        <div className="flex-1" />
        <Button onClick={() => clearActivity()} variant="outline" size="sm" className="border-destructive text-destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Limpar histórico
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block border border-app-border rounded-xl overflow-hidden">
        <div className="flex items-center px-3 py-2.5 text-xs text-app-text-muted border-b border-app-border bg-app-muted">
          <div className="w-10 text-center">
            <input type="checkbox" className="accent-app-accent" />
          </div>
          <div className="w-[120px] text-center">Conteúdo</div>
          <div className="w-[180px]">Data</div>
          <div className="flex-1 min-w-0">Pergunta</div>
          <div className="w-[140px] text-center">Tipo</div>
          <div className="w-[160px] text-center">Resultado/Nota</div>
          <div className="w-[200px] text-center">Meta</div>
          <div className="w-[140px] text-center">Ações</div>
        </div>
        <div className="divide-y divide-app-border">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="flex items-center px-3 py-3 hover:bg-app-bg-soft">
              <div className="w-10 text-center">
                <input type="checkbox" className="accent-app-accent" />
              </div>
              <div className="w-[120px] text-center">
                <Badge className="text-xs">
                  {entry.kind === 'flashcard' ? 'FC' : 'EX'}
                </Badge>
              </div>
              <div className="w-[180px] text-sm text-app-text">
                {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </div>
              <div className="flex-1 min-w-0 text-sm text-app-text pr-4">
                {entry.pergunta}
              </div>
              <div className="w-[140px] text-center">
                <Badge variant="outline" className="text-xs">
                  {entry.tipo}
                </Badge>
              </div>
              <div className="w-[160px] text-center">
                {entry.kind === 'flashcard' && entry.grade !== undefined && (
                  <Badge className={`text-xs ${
                    entry.grade >= 4 ? 'bg-green-100 text-green-800' :
                    entry.grade === 3 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Nota {entry.grade}
                  </Badge>
                )}
                {entry.kind === 'exercise' && (
                  <Badge className={`text-xs ${
                    entry.result ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {entry.result ? 'Certo' : 'Errado'}
                  </Badge>
                )}
              </div>
              <div className="w-[200px] text-center text-xs text-app-text-muted">
                {entry.kind === 'flashcard' && entry.after && (
                  `EF: ${entry.after.ef.toFixed(1)} | Próx: ${format(new Date(entry.after.due), 'dd/MM')}`
                )}
                {entry.kind === 'exercise' && entry.timeSpent && (
                  `${Math.floor(entry.timeSpent / 60)}:${(entry.timeSpent % 60).toString().padStart(2, '0')}`
                )}
              </div>
              <div className="w-[140px] text-center">
                <Button
                  onClick={() => setViewModal({ isOpen: true, entry })}
                  variant="ghost"
                  size="sm"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="border border-app-border rounded-xl p-4 bg-app-bg">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className="text-xs">
                  {entry.kind === 'flashcard' ? 'FC' : 'EX'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {entry.tipo}
                </Badge>
              </div>
              <Button
                onClick={() => setViewModal({ isOpen: true, entry })}
                variant="ghost"
                size="sm"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-sm font-medium text-app-text mb-1">
              {entry.pergunta}
            </div>
            <div className="text-xs text-app-text-muted">
              {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </div>
          </div>
        ))}
      </div>

      {/* View Entry Modal */}
      <Dialog open={viewModal.isOpen} onOpenChange={(open) => setViewModal({ isOpen: open, entry: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-app-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalhes
            </DialogTitle>
          </DialogHeader>
          
          {viewModal.entry && (
            <div className="space-y-4">
              <div className="text-sm text-app-text-muted">
                {format(new Date(viewModal.entry.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </div>
              
              <div className="text-lg font-semibold text-app-text">
                {viewModal.entry.pergunta}
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <Badge className="text-xs">
                  {viewModal.entry.kind === 'flashcard' ? 'Flashcard' : 'Exercício'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {viewModal.entry.tipo}
                </Badge>
                {viewModal.entry.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                <span className="text-xs text-app-text-muted">
                  Ref.: {viewModal.entry.referencia}
                </span>
              </div>

              {/* Flashcard Details */}
              {viewModal.entry.kind === 'flashcard' && (
                <div className="space-y-3">
                  {viewModal.entry.before && viewModal.entry.after && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="border border-app-border rounded-lg p-3">
                        <div className="text-xs text-app-text-muted">Antes</div>
                        <div className="text-sm">
                          EF: {viewModal.entry.before.ef} | Reps: {viewModal.entry.before.reps}
                        </div>
                      </div>
                      <div className="border border-app-border rounded-lg p-3">
                        <div className="text-xs text-app-text-muted">Depois</div>
                        <div className="text-sm">
                          EF: {viewModal.entry.after.ef} | Reps: {viewModal.entry.after.reps}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {viewModal.entry.grade !== undefined && (
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${
                        viewModal.entry.grade >= 4 ? 'bg-green-100 text-green-800' :
                        viewModal.entry.grade === 3 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Nota: {viewModal.entry.grade}
                      </Badge>
                    </div>
                  )}

                  {viewModal.entry.respostaCurta && (
                    <div>
                      <div className="font-semibold mb-1 text-sm">Resposta curta</div>
                      <div className="text-sm text-app-text-muted">{viewModal.entry.respostaCurta}</div>
                    </div>
                  )}

                  {viewModal.entry.respostaAprofundada && (
                    <div>
                      <div className="font-semibold mb-1 text-sm">Resposta aprofundada</div>
                      <div className="text-sm text-app-text-muted">{viewModal.entry.respostaAprofundada}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Exercise Details */}
              {viewModal.entry.kind === 'exercise' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="border border-app-border rounded-lg p-3">
                      <div className="text-xs text-app-text-muted">Resultado</div>
                      <div className="text-sm">
                        {viewModal.entry.result ? 'Correto' : 'Incorreto'}
                      </div>
                    </div>
                    {viewModal.entry.timeSpent && (
                      <div className="border border-app-border rounded-lg p-3">
                        <div className="text-xs text-app-text-muted">Tempo</div>
                        <div className="text-sm">
                          {Math.floor(viewModal.entry.timeSpent / 60)}:{(viewModal.entry.timeSpent % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                    )}
                    {viewModal.entry.difficulty && (
                      <div className="border border-app-border rounded-lg p-3">
                        <div className="text-xs text-app-text-muted">Dificuldade</div>
                        <div className="text-sm">{viewModal.entry.difficulty}</div>
                      </div>
                    )}
                  </div>

                  {viewModal.entry.options && (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-semibold">Sua resposta:</span> {
                          typeof viewModal.entry.userAnswer === 'number' 
                            ? String.fromCharCode(65 + viewModal.entry.userAnswer)
                            : viewModal.entry.userAnswer
                        }
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold">Gabarito:</span> {viewModal.entry.correctAnswer}
                      </div>
                      <div className="text-sm space-y-1">
                        {viewModal.entry.options.map((option, index) => (
                          <div key={index}>
                            {String.fromCharCode(65 + index)}) {option}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};