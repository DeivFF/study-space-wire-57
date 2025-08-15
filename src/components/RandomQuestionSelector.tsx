
import { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RandomQuestionSelectorProps {
  categories: Array<{ id: string; name: string }>;
  onRandomQuestion: (categoryId?: string) => void;
}

const RandomQuestionSelector = ({ categories, onRandomQuestion }: RandomQuestionSelectorProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleRandomQuestion = () => {
    onRandomQuestion(selectedCategory === 'all' ? undefined : selectedCategory);
  };

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Próxima Questão Aleatória</h4>
            <div className="flex items-center space-x-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={handleRandomQuestion} variant="outline">
            <Shuffle className="w-4 h-4 mr-2" />
            Questão Aleatória
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RandomQuestionSelector;
