
import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FiltrosQuestoes {
  materia: string;
  status: string;
  busca: string;
}

interface QuestoesFiltrosProps {
  filtros: FiltrosQuestoes;
  setFiltros: (filtros: FiltrosQuestoes) => void;
  materias: string[];
  onLimpar: () => void;
}

const QuestoesFiltros = ({ filtros, setFiltros, materias, onLimpar }: QuestoesFiltrosProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        <Button onClick={onLimpar} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-2" />
          Limpar Filtros
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Busca */}
        <div>
          <Label htmlFor="busca">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="busca"
              value={filtros.busca}
              onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
              placeholder="Buscar questões..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Matéria */}
        <div>
          <Label htmlFor="materia">Matéria</Label>
          <Select
            value={filtros.materia}
            onValueChange={(value) => setFiltros({ ...filtros, materia: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as matérias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {materias.map(materia => (
                <SelectItem key={materia} value={materia}>{materia}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={filtros.status}
            onValueChange={(value) => setFiltros({ ...filtros, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="nao-respondidas">Não Respondidas</SelectItem>
              <SelectItem value="respondidas">Respondidas</SelectItem>
              <SelectItem value="acertadas">Acertadas</SelectItem>
              <SelectItem value="erradas">Erradas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtros Ativos */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filtros.busca && (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
            Busca: "{filtros.busca}"
          </span>
        )}
        {filtros.materia !== 'todas' && (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
            Matéria: {filtros.materia}
          </span>
        )}
        {filtros.status !== 'todas' && (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
            Status: {filtros.status}
          </span>
        )}
      </div>
    </div>
  );
};

export default QuestoesFiltros;
