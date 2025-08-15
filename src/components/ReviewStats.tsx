
import { AlertCircle, CheckCircle, Calendar, TrendingUp, Clock, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ReviewStatsProps {
  pendingCount: number;
  completedCount: number;
  upcomingCount: number;
  streak: number;
  averageInterval: number;
  successRate: number;
}

const ReviewStats = ({ 
  pendingCount, 
  completedCount, 
  upcomingCount, 
  streak, 
  averageInterval, 
  successRate 
}: ReviewStatsProps) => {
  const stats = [
    {
      icon: AlertCircle,
      label: 'Para Revisar',
      value: pendingCount,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Revisões pendentes hoje'
    },
    {
      icon: CheckCircle,
      label: 'Concluídas',
      value: completedCount,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Revisões feitas recentemente'
    },
    {
      icon: Calendar,
      label: 'Próximos Dias',
      value: upcomingCount,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Nos próximos 3 dias'
    },
    {
      icon: TrendingUp,
      label: 'Sequência',
      value: streak,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Dias consecutivos'
    },
    {
      icon: Clock,
      label: 'Intervalo Médio',
      value: `${averageInterval}d`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Tempo entre revisões'
    },
    {
      icon: Target,
      label: 'Taxa de Sucesso',
      value: `${successRate}%`,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      description: 'Avaliações positivas'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 truncate">{stat.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReviewStats;
