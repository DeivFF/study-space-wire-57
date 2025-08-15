import { useState } from 'react';
import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
interface FiltersState {
  search: string;
  difficulty: string;
  watchedStatus: string;
}
interface ResumosFiltersProps {
  onFilterChange: (filters: FiltersState) => void;
}
const ResumosFilters = ({
  onFilterChange
}: ResumosFiltersProps) => {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [watchedStatus, setWatchedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({
      search: value,
      difficulty,
      watchedStatus
    });
  };
  const handleDifficultyChange = (value: string) => {
    setDifficulty(value);
    onFilterChange({
      search,
      difficulty: value,
      watchedStatus
    });
  };
  const handleWatchedStatusChange = (value: string) => {
    setWatchedStatus(value);
    onFilterChange({
      search,
      difficulty,
      watchedStatus: value
    });
  };
  const clearFilters = () => {
    setSearch('');
    setDifficulty('all');
    setWatchedStatus('all');
    onFilterChange({
      search: '',
      difficulty: 'all',
      watchedStatus: 'all'
    });
  };
  return <div className="mb-6 space-y-4">
      {/* Barra de busca principal */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar aulas por nome..." value={search} onChange={e => handleSearchChange(e.target.value)} className="pl-10 h-12 text-base" />
      </div>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
          <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} className="h-8">
            <Filter className="w-3 h-3 mr-1" />
            {showFilters ? "Ocultar" : "Mostrar"}
          </Button>
        </div>

        {/* Filtros rápidos de status */}
        <div className="flex gap-1">
          <Button variant={watchedStatus === 'watched' ? "default" : "outline"} size="sm" onClick={() => handleWatchedStatusChange(watchedStatus === 'watched' ? 'all' : 'watched')} className="h-8 ">
            Assistidas
          </Button>
          <Button variant={watchedStatus === 'unwatched' ? "default" : "outline"} size="sm" onClick={() => handleWatchedStatusChange(watchedStatus === 'unwatched' ? 'all' : 'unwatched')} className="h-8 text-xs">
            Não assistidas
          </Button>
        </div>

        {/* Botão limpar filtros */}
        {(search || difficulty !== 'all' || watchedStatus !== 'all') && <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-muted-foreground">
            Limpar tudo
          </Button>}
      </div>

      {/* Filtros avançados */}
      {showFilters && <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Dificuldade
                </label>
                <Select value={difficulty} onValueChange={handleDifficultyChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecionar dificuldade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as dificuldades</SelectItem>
                    <SelectItem value="easy">🟢 Fácil (4-5 estrelas)</SelectItem>
                    <SelectItem value="medium">🟡 Médio (3 estrelas)</SelectItem>
                    <SelectItem value="hard">🔴 Difícil (1-2 estrelas)</SelectItem>
                    <SelectItem value="unrated">⚪ Sem avaliação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Status de visualização
                </label>
                <Select value={watchedStatus} onValueChange={handleWatchedStatusChange}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecionar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as aulas</SelectItem>
                    <SelectItem value="watched">✅ Assistidas</SelectItem>
                    <SelectItem value="unwatched">📝 Não assistidas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>}
    </div>;
};
export default ResumosFilters;