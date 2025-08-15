
import { BarChart3, Clock, CheckCircle, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryStatsProps {
  categoryName: string;
  totalLessons: number;
  watchedLessons: number;
  totalHours: number;
  watchedHours: number;
  filterComponent?: React.ReactNode;
}

const CategoryStats = ({ 
  categoryName, 
  totalLessons, 
  watchedLessons, 
  totalHours, 
  watchedHours,
  filterComponent
}: CategoryStatsProps) => {
  const progressPercentage = totalLessons > 0 ? Math.round((watchedLessons / totalLessons) * 100) : 0;
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Estatísticas - {categoryName}
          </span>
          {filterComponent}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="w-5 h-5 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalLessons}</div>
            <div className="text-sm text-gray-600">Total de Aulas</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{watchedLessons}</div>
            <div className="text-sm text-gray-600">Aulas Assistidas</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{Math.floor(totalHours / 60)}h {totalHours % 60}m</div>
            <div className="text-sm text-gray-600">Tempo Total</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{Math.floor(watchedHours / 60)}h {watchedHours % 60}m</div>
            <div className="text-sm text-gray-600">Tempo Assistido</div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progresso</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryStats;
