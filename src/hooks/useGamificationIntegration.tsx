import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGamification } from '@/contexts/GamificationContext';

/**
 * Hook to integrate gamification system with auth and other app events
 */
export function useGamificationIntegration() {
  const { user } = useAuth();
  const { addXP, checkAchievements } = useGamification();

  // Give XP for first login of the day
  useEffect(() => {
    if (user) {
      // Add first login XP and check achievements
      addXP('first_login');
      checkAchievements();
    }
  }, [user, addXP, checkAchievements]);

  // Return utility functions for other components to use
  return {
    addXP,
    checkAchievements,
  };
}