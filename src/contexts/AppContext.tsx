
import React, { createContext, useContext, useMemo } from 'react';
import { useAppState, AppState } from '@/hooks/useAppState';
import { useActivityTracker } from '@/hooks/useActivityTracker';

interface AppContextType {
  state: AppState;
  actions: any;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { state, actions } = useAppState();

  // Track user activity with debouncing
  useActivityTracker({ 
    onActivity: actions.markActivity,
    debounceMs: 2000 // Increased debounce to reduce excessive updates
  });

  const value = useMemo(() => ({
    state,
    actions,
  }), [state, actions]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
