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
import { studyAPI } from '@/services/studyApi';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryTimelineProps {
  lessonId: string;
}

interface ActivityEntry {
  id: string;
  timestamp: string;
  type: string;
  details: string;
  duration?: number;
  data?: any;
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

  const getFilteredEntries = () => {
    let filtered = activities;

    // Filter by date range
    if (filters.startDate) {
      const start = startOfDay(new Date(filters.startDate));
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= start);
    }
    if (filters.endDate) {
      const end = endOfDay(new Date(filters.endDate));
      filtered = filtered.filter(entry => new Date(entry.timestamp) <= end);
    }

    // Filter by kind (activity type)
    if (filters.kind !== 'all') {
      if (filters.kind === 'flashcard') {
        filtered = filtered.filter(entry => entry.type.includes('flashcard'));
      } else if (filters.kind === 'exercise') {
        filtered = filtered.filter(entry => entry.type.includes('exercise'));
      }
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.details.toLowerCase().includes(searchLower) ||
        (entry.data?.tags && entry.data.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)))
      );
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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

  const exportData = async (format: 'json' | 'csv') => {
    try {
      await studyAPI.exportLessonActivity(lessonId, format);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const filteredEntries = getFilteredEntries();
  
  // Calculate stats
  const stats = {
    total: filteredEntries.length,
    accuracy: filteredEntries.length > 0 ? 
      Math.round((filteredEntries.filter(e => 
        (e.type.includes('exercise') && e.data?.isCorrect) ||
        (e.type.includes('flashcard') && (e.data?.grade || 0) >= 3)
      ).length / filteredEntries.length) * 100) : 0,
    avgEF: filteredEntries.filter(e => e.data?.after?.ef).length > 0 ?
      (filteredEntries.filter(e => e.data?.after?.ef).reduce((sum, e) => sum + (e.data?.after?.ef || 0), 0) / 
       filteredEntries.filter(e => e.data?.after?.ef).length).toFixed(1) : '—'
  };

  const getActivityBadge = (entry: ActivityEntry) => {
    if (entry.type.includes('exercise')) {
      const isCorrect = entry.data?.isCorrect;
      return (
        <Badge className={`text-xs ${
          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isCorrect ? 'Certo' : 'Errado'}
        </Badge>
      );
    }
    
    if (entry.type.includes('flashcard')) {
      const grade = entry.data?.grade || 0;
      return (
        <Badge className={`text-xs ${
          grade >= 4 ? 'bg-green-100 text-green-800' :
          grade === 3 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          Nota {grade}
        </Badge>
      );
    }

    return <Badge variant="outline" className="text-xs">Atividade</Badge>;
  };

  const getMetaText = (entry: ActivityEntry) => {
    if (entry.type.includes('exercise') && entry.data?.timeSpent) {
      const timeSpent = entry.data.timeSpent;
      const minutes = Math.floor(timeSpent / 60);
      const seconds = timeSpent % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    if (entry.type.includes('flashcard') && entry.data?.after?.due) {
      return `Próx: ${format(new Date(entry.data.after.due), 'dd/MM')}`;
    }

    if (entry.duration) {
      const minutes = Math.floor(entry.duration / 60);
      const seconds = entry.duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    return '—';
  };

  const getActivityType = (entry: ActivityEntry) => {
    if (entry.type.includes('exercise')) return 'Exercício';
    if (entry.type.includes('flashcard')) return 'Flashcard';
    if (entry.type.includes('file')) return 'Arquivo';
    if (entry.type.includes('note')) return 'Anotação';
    return 'Atividade';
  };

  if (isLoading) {
    return <div className="text-center py-8 text-app-text-muted">Carregando histórico...</div>;
  }

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
          <div className="flex-1 min-w-0">Detalhes</div>
          <div className="w-[140px] text-center">Tipo</div>
          <div className="w-[160px] text-center">Resultado</div>
          <div className="w-[140px] text-center">Meta</div>
          <div className="w-[100px] text-center">Ações</div>
        </div>
        <div className="divide-y divide-app-border">
          {filteredEntries.length === 0 ? (
            <div className="p-8 text-center text-app-text-muted">
              Nenhuma atividade encontrada
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="flex items-center px-3 py-3 hover:bg-app-bg-soft">
                <div className="w-10 text-center">
                  <input type="checkbox" className="accent-app-accent" />
                </div>
                <div className="w-[120px] text-center">
                  <Badge className="text-xs">
                    {getActivityType(entry)}
                  </Badge>
                </div>
                <div className="w-[180px] text-sm text-app-text">
                  {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </div>
                <div className="flex-1 min-w-0 text-sm text-app-text pr-4 truncate">
                  {entry.details}
                </div>
                <div className="w-[140px] text-center">
                  <Badge variant="outline" className="text-xs">
                    {entry.data?.questionType || entry.type}
                  </Badge>
                </div>
                <div className="w-[160px] text-center">
                  {getActivityBadge(entry)}
                </div>
                <div className="w-[140px] text-center text-xs text-app-text-muted">
                  {getMetaText(entry)}
                </div>
                <div className="w-[100px] text-center">
                  <Button
                    onClick={() => setViewModal({ isOpen: true, entry })}
                    variant="ghost"
                    size="sm"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filteredEntries.length === 0 ? (
          <div className="border border-app-border rounded-xl p-8 text-center text-app-text-muted">
            Nenhuma atividade encontrada
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id} className="border border-app-border rounded-xl p-4 bg-app-bg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className="text-xs">
                    {getActivityType(entry)}
                  </Badge>
                  {getActivityBadge(entry)}
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
                {entry.details}
              </div>
              <div className="text-xs text-app-text-muted">
                {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Entry Modal */}
      <Dialog open={viewModal.isOpen} onOpenChange={(open) => setViewModal({ isOpen: open, entry: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-app-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Detalhes da Atividade
            </DialogTitle>
          </DialogHeader>
          
          {viewModal.entry && (
            <div className="space-y-4">
              <div className="text-sm text-app-text-muted">
                {format(new Date(viewModal.entry.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </div>
              
              <div className="text-lg font-semibold text-app-text">
                {viewModal.entry.details}
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                <Badge className="text-xs">
                  {getActivityType(viewModal.entry)}
                </Badge>
                {getActivityBadge(viewModal.entry)}
              </div>

              {viewModal.entry.data && (
                <div className="border border-app-border rounded-lg p-3 bg-app-bg">
                  <div className="font-semibold text-app-text mb-2">Dados da Atividade</div>
                  <pre className="text-xs text-app-text-muted overflow-auto">
                    {JSON.stringify(viewModal.entry.data, null, 2)}
                  </pre>
                </div>
              )}

              {viewModal.entry.duration && (
                <div className="text-sm text-app-text-muted">
                  <span className="font-semibold">Duração:</span> {getMetaText(viewModal.entry)}
                </div>
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};