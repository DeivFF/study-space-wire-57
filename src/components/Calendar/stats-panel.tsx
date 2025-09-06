import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudyStore } from '@/lib/calendar-store';
import { todayStr } from '@/lib/utils';

export function StatsPanel() {
  const { sessions } = useStudyStore();

  const totalPlanned = sessions.reduce((acc, s) => acc + s.durationMin, 0);
  const totalDone = sessions
    .filter(s => s.status === 'done')
    .reduce((acc, s) => acc + (s.actualMin || s.durationMin), 0);
  
  const adherence = totalPlanned > 0 ? Math.round((totalDone / totalPlanned) * 100) : 0;
  const totalPomos = sessions.reduce((acc, s) => acc + (s.pomos || 0), 0);
  
  const uniqueDays = [...new Set(sessions.map(s => s.date))];
  const activeDays = uniqueDays.length;

  // Calculate streak (consecutive days with at least one completed session)
  let streak = 0;
  const today = todayStr();
  let checkDate = new Date();
  
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const hasCompletedSession = sessions.some(s => 
      s.date === dateStr && s.status === 'done'
    );
    
    if (hasCompletedSession) {
      streak++;
    } else {
      break;
    }
    
    if (dateStr === today) break;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
        <BarChart3 className="h-4 w-4" />
        <h3 className="font-medium">Estatísticas</h3>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            Planejado <strong>{totalPlanned}</strong> min
          </Badge>
          <Badge variant="outline" className="text-xs">
            Concluído <strong>{totalDone}</strong> min
          </Badge>
          <Badge variant="outline" className="text-xs">
            Adesão <strong>{totalPlanned > 0 ? `${adherence}%` : '—'}</strong>
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            Pomodoros <strong>{totalPomos}</strong>
          </Badge>
          <Badge variant="outline" className="text-xs">
            Dias ativos <strong>{activeDays}</strong>
          </Badge>
          <Badge variant="outline" className="text-xs">
            Streak <strong>{streak}</strong>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}