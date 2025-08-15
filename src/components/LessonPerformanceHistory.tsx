
import { useState, useEffect } from 'react';
import { Edit, Trash2, Calendar, Target, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSupabaseLessonPerformance } from '@/hooks/useSupabaseLessonPerformance';
import { useToast } from '@/hooks/use-toast';
import LessonPerformanceEditModal from './LessonPerformanceEditModal';
import type { Tables } from '@/integrations/supabase/types';

type LessonPerformance = Tables<'lesson_performances'>;

interface LessonPerformanceHistoryProps {
  lessonId: string;
  refreshTrigger: number;
}

const LessonPerformanceHistory = ({ lessonId, refreshTrigger }: LessonPerformanceHistoryProps) => {
  const { performances, loading, loadPerformances, deletePerformance } = useSupabaseLessonPerformance();
  const { toast } = useToast();
  const [editingRecord, setEditingRecord] = useState<LessonPerformance | null>(null);
  
  const lessonPerformances = performances.filter(p => p.lesson_id === lessonId);

  useEffect(() => {
    loadPerformances();
    console.log('LessonPerformanceHistory: Loading performances for lesson', lessonId, 'trigger:', refreshTrigger);
  }, [refreshTrigger, loadPerformances, lessonId]);

  const handleDelete = async (performanceId: string) => {
    const success = await deletePerformance(performanceId);
    if (success) {
      toast({
        title: "Registro excluído",
        description: "O registro de desempenho foi removido com sucesso"
      });
    }
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 70) return 'text-blue-600 bg-blue-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPerformanceLabel = (percentage: number) => {
    if (percentage >= 80) return 'Excelente';
    if (percentage >= 70) return 'Bom';
    if (percentage >= 60) return 'Regular';
    return 'Precisa Melhorar';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (lessonPerformances.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum registro encontrado</h3>
        <p className="text-gray-600">Registre seu primeiro desempenho na aba "Novo Registro"</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Histórico de Desempenho</h3>
          <span className="text-sm text-gray-500">
            {lessonPerformances.length} registro{lessonPerformances.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {lessonPerformances.map((performance) => (
            <Card key={performance.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {new Date(performance.created_at).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(performance.created_at).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRecord(performance)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(performance.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {performance.questions_correct}
                    </div>
                    <div className="text-xs text-gray-500">Corretas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {performance.questions_incorrect}
                    </div>
                    <div className="text-xs text-gray-500">Incorretas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {performance.total_questions}
                    </div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="text-center">
                    <Badge className={getPerformanceColor(performance.accuracy_percentage)}>
                      {performance.accuracy_percentage}%
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {getPerformanceLabel(performance.accuracy_percentage)}
                    </div>
                  </div>
                </div>

                {performance.incorrect_questions && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Questões Erradas:</span>
                    </div>
                    <p className="text-sm text-gray-600 bg-orange-50 p-2 rounded">
                      {performance.incorrect_questions}
                    </p>
                  </div>
                )}

                {performance.notes && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Anotações:</span>
                    </div>
                    <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                      {performance.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {editingRecord && (
        <LessonPerformanceEditModal
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          performance={editingRecord}
          onSave={() => {
            setEditingRecord(null);
            loadPerformances();
          }}
        />
      )}
    </>
  );
};

export default LessonPerformanceHistory;
