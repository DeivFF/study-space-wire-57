import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CheckCircle, TrendingUp, Target } from 'lucide-react';
import { useSupabaseStats } from '@/hooks/useSupabaseStats';
const EstatisticasResumo = () => {
  const {
    stats,
    loading
  } = useSupabaseStats();
  if (loading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>)}
      </div>;
  }
  const acuraciaPercentual = stats.questoes_resolvidas > 0 ? Math.round(stats.questoes_corretas / stats.questoes_resolvidas * 100) : 0;
  
  const estatisticas = [
    {
      titulo: "Questões Resolvidas",
      valor: stats.questoes_resolvidas || 0,
      descricao: "Total de questões respondidas hoje",
      icone: BookOpen,
      cor: "text-primary",
      corFundo: "bg-primary/10"
    },
    {
      titulo: "Questões Corretas",
      valor: stats.questoes_corretas || 0,
      descricao: "Questões respondidas corretamente",
      icone: CheckCircle,
      cor: "text-emerald-500",
      corFundo: "bg-emerald-50"
    },
    {
      titulo: "Acurácia",
      valor: `${acuraciaPercentual}%`,
      descricao: "Percentual de acertos",
      icone: Target,
      cor: "text-blue-500",
      corFundo: "bg-blue-50"
    },
    {
      titulo: "Progresso",
      valor: stats.questoes_resolvidas > 0 ? "Ativo" : "Inativo",
      descricao: "Status de estudo hoje",
      icone: TrendingUp,
      cor: "text-orange-500",
      corFundo: "bg-orange-50"
    }
  ];

  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {estatisticas.map((stat, index) => (
        <Card key={index} className="transition-all hover:shadow-md">
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.titulo}</p>
              <p className="text-2xl font-bold">{stat.valor}</p>
              <p className="text-xs text-muted-foreground">{stat.descricao}</p>
            </div>
            <div className={`rounded-full p-3 ${stat.corFundo}`}>
              <stat.icone className={`h-6 w-6 ${stat.cor}`} />
            </div>
          </div>
        </Card>
      ))}
    </div>;
};
export default EstatisticasResumo;