import { Flame, Star, Target, Trophy } from 'lucide-react';
import { useGamification } from '@/contexts/GamificationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StreakWidgetProps {
  variant?: 'compact' | 'full';
}

export function StreakWidget({ variant = 'compact' }: StreakWidgetProps) {
  // Static values for visual demonstration only (no backend)
  const staticState = {
    currentStreak: 5,
    longestStreak: 12,
    level: 3,
    totalXP: 285,
    todayProgress: 35,
    dailyGoal: 50,
    achievements: []
  };
  
  const progressPercentage = Math.min((staticState.todayProgress / staticState.dailyGoal) * 100, 100);
  const nextLevelXP = getNextLevelXP(staticState.level);
  const currentLevelXP = getCurrentLevelXP(staticState.level);
  const levelProgress = nextLevelXP > 0 
    ? ((staticState.totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 
    : 100;

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-3 p-3 bg-app-bg-soft rounded-lg border border-app-border">
          {/* Streak */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-app-text">{staticState.currentStreak}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sequência atual: {staticState.currentStreak} dias</p>
              <p>Melhor sequência: {staticState.longestStreak} dias</p>
            </TooltipContent>
          </Tooltip>

          {/* Level */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-app-accent" />
                <span className="font-semibold text-app-text">{staticState.level}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Nível {staticState.level}</p>
              <p>{staticState.totalXP} XP total</p>
            </TooltipContent>
          </Tooltip>

          {/* Daily Progress */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Target className="w-4 h-4 text-app-success flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Progress value={progressPercentage} className="h-2" />
                </div>
                <span className="text-xs text-app-text-muted flex-shrink-0">
                  {staticState.todayProgress ?? 0}/{staticState.dailyGoal ?? 50}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Meta diária: {staticState.todayProgress ?? 0}/{staticState.dailyGoal ?? 50} XP</p>
              <p>{Math.round(progressPercentage)}% concluído</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <Card className="bg-app-bg-soft border-app-border">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-app-text">Progresso de Hoje</h3>
            <Badge variant="secondary" className="bg-app-accent/10 text-app-accent">
              Nível {staticState.level}
            </Badge>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-2xl font-bold text-app-text">{staticState.currentStreak}</span>
              </div>
              <p className="text-xs text-app-text-muted">Sequência</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-5 h-5 text-app-accent" />
                <span className="text-2xl font-bold text-app-text">{staticState.totalXP}</span>
              </div>
              <p className="text-xs text-app-text-muted">XP Total</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-5 h-5 text-app-warning" />
                <span className="text-2xl font-bold text-app-text">{staticState.achievements.length}</span>
              </div>
              <p className="text-xs text-app-text-muted">Conquistas</p>
            </div>
          </div>

          {/* Daily Goal Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-app-text-muted">Meta diária</span>
              <span className="text-sm font-medium text-app-text">
                {staticState.todayProgress}/{staticState.dailyGoal} XP
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            {progressPercentage >= 100 && (
              <p className="text-xs text-app-success text-center">🎉 Meta de hoje concluída!</p>
            )}
          </div>

          {/* Level Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-app-text-muted">Progresso do nível</span>
              <span className="text-sm font-medium text-app-text">
                {nextLevelXP > 0 ? `${staticState.totalXP - currentLevelXP}/${nextLevelXP - currentLevelXP} XP` : 'Max'}
              </span>
            </div>
            <Progress value={levelProgress} className="h-2" />
          </div>

          {/* Recent Achievements */}
          {staticState.achievements.length > 0 && (
            <div className="pt-2 border-t border-app-border">
              <p className="text-xs text-app-text-muted mb-2">Última conquista</p>
              <div className="flex items-center gap-2 p-2 bg-app-muted rounded-lg">
                <span className="text-lg">{staticState.achievements[staticState.achievements.length - 1].icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-app-text truncate">
                    {staticState.achievements[staticState.achievements.length - 1].title}
                  </p>
                  <p className="text-xs text-app-text-muted truncate">
                    {staticState.achievements[staticState.achievements.length - 1].description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getNextLevelXP(currentLevel: number): number {
  const thresholds = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000];
  return currentLevel < thresholds.length ? thresholds[currentLevel] : 0;
}

function getCurrentLevelXP(currentLevel: number): number {
  const thresholds = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000];
  return currentLevel > 1 ? thresholds[currentLevel - 2] : 0;
}