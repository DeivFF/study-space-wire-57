
import { useState } from 'react';
import { Filter, SortAsc, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface ReviewFiltersProps {
  onFilterChange: (filters: {
    search: string;
    difficulty: string;
    sortBy: string;
  }) => void;
}

const ReviewFilters = ({ onFilterChange }: ReviewFiltersProps) => {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ search: value, difficulty, sortBy });
  };

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value);
    onFilterChange({ search, difficulty: value, sortBy });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onFilterChange({ search, difficulty, sortBy: value });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar aulas..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="flex gap-4 pt-4 border-t">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Dificuldade
              </label>
              <Select value={difficulty} onValueChange={handleDifficultyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Ordenar por
              </label>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Data de revisão</SelectItem>
                  <SelectItem value="difficulty">Dificuldade</SelectItem>
                  <SelectItem value="name">Nome da aula</SelectItem>
                  <SelectItem value="repetition">Repetições</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewFilters;
