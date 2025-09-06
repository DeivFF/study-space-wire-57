
import React from 'react';
import { BookOpen } from 'lucide-react';

interface AuthCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showTabs?: boolean;
  activeTab?: 'login' | 'register';
  onTabChange?: (tab: 'login' | 'register') => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  children,
  title = "Azurk",
  subtitle = "Conecte-se para continuar sua jornada de aprendizado",
  showTabs = false,
  activeTab = 'login',
  onTabChange
}) => {
  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      <div className="bg-app-panel border border-app-border rounded-[16px] w-full max-w-[400px] overflow-hidden shadow-lg">
        <div className="p-5 pb-3 text-center border-b border-app-border">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3">
            <img src="/assets/images/Logo.svg" alt="Azurk" className="w-12 h-12" />
          </div>
          <h1 className="text-xl font-bold mb-1 text-app-text">{title}</h1>
          <p className="text-sm text-app-text-muted mb-1">{subtitle}</p>
        </div>
        
        {showTabs && (
          <div className="flex border-b border-app-border">
            <button
              className={`flex-1 text-center py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'login'
                  ? 'text-app-accent border-app-accent'
                  : 'text-app-text-muted border-transparent'
              }`}
              onClick={() => onTabChange?.('login')}
            >
              Entrar
            </button>
            <button
              className={`flex-1 text-center py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'register'
                  ? 'text-app-accent border-app-accent'
                  : 'text-app-text-muted border-transparent'
              }`}
              onClick={() => onTabChange?.('register')}
            >
              Cadastrar
            </button>
          </div>
        )}
        
        {children}
      </div>
    </div>
  );
};
