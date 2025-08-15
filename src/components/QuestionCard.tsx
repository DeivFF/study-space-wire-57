
import React from 'react';
import { MoreHorizontal, Edit, Trash2, Play, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Questao {
  id: string;
  enunciado: string;
  alternativas: string[];
  resposta_correta: number;
  explicacao: string;
  materia: string;
  assunto: string;
  banca: string;
  ano: number;
  dificuldade: 'facil' | 'medio' | 'dificil';
  respondida: boolean;
  acertou?: boolean;
  tempo_resposta?: number;
  created_at: string;
}

interface QuestionCardProps {
  questao: Questao;
  index: number;
  onEdit: (questao: Questao) => void;
  onDelete: (id: string) => void;
  onStartExercise: (questao: Questao) => void;
}

const QuestionCard = ({ questao, index, onEdit, onDelete, onStartExercise }: QuestionCardProps) => {
  const getDifficultyColor = (dificuldade: string) => {
    switch (dificuldade) {
      case 'facil': return 'bg-green-100 text-green-800';
      case 'medio': return 'bg-yellow-100 text-yellow-800';
      case 'dificil': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (dificuldade: string) => {
    switch (dificuldade) {
      case 'facil': return 'Fácil';
      case 'medio': return 'Médio';
      case 'dificil': return 'Difícil';
      default: return 'Médio';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(questao.dificuldade)}`}>
                {getDifficultyLabel(questao.dificuldade)}
              </span>
              {questao.respondida && (
                <span className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                  questao.acertou 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {questao.acertou ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      <span>Acertou</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      <span>Errou</span>
                    </>
                  )}
                </span>
              )}
            </div>
            
            <p className="font-medium text-gray-900 mb-2 line-clamp-2">
              {questao.enunciado.slice(0, 150)}
              {questao.enunciado.length > 150 ? '...' : ''}
            </p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {questao.materia}
              </span>
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                {questao.assunto}
              </span>
              <span>{questao.banca} - {questao.ano}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <Button
              onClick={() => onStartExercise(questao)}
              size="sm"
              variant="outline"
            >
              <Play className="w-4 h-4 mr-1" />
              Resolver
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(questao)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir esta questão? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDelete(questao.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
