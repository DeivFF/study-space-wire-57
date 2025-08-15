
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface AudioFiltersProps {
  searchTerm: string;
  selectedCategory: string;
  categories: Category[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

const AudioFilters = ({
  searchTerm,
  selectedCategory,
  categories,
  onSearchChange,
  onCategoryChange
}: AudioFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Category filter */}
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder="Filtrar por categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Pesquisar áudios..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
};

export default AudioFilters;
