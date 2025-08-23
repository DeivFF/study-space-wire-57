
import React, { useState } from 'react';
import { AuthCard } from '../components/Auth/AuthCard';
import { LoginForm } from '../components/Auth/LoginForm';
import { RegisterForm } from '../components/Auth/RegisterForm';
import { ForgotPasswordForm } from '../components/Auth/ForgotPasswordForm';

type AuthMode = 'login' | 'register' | 'forgot-password';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleRegisterSuccess = () => {
    setMode('login');
    setShowSuccessMessage(true);
  };

  const handleBackToLogin = () => {
    setMode('login');
    setShowSuccessMessage(false);
  };

  const handleForgotPassword = () => {
    setMode('forgot-password');
    setShowSuccessMessage(false);
  };

  const handleTabChange = (tab: 'login' | 'register') => {
    setMode(tab);
    setShowSuccessMessage(false);
  };

  if (mode === 'forgot-password') {
    return (
      <AuthCard>
        <ForgotPasswordForm onBackToLogin={handleBackToLogin} />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      showTabs={true}
      activeTab={mode}
      onTabChange={handleTabChange}
    >
      {mode === 'login' ? (
        <>
          <LoginForm
            onForgotPassword={handleForgotPassword}
            showSuccessMessage={showSuccessMessage}
          />
          <div className="p-3 pt-2 pb-4 text-center border-t border-app-border">
            <span className="text-sm text-app-text-muted">
              Não tem uma conta?{' '}
              <button
                className="text-app-accent font-medium hover:underline"
                onClick={() => handleTabChange('register')}
              >
                Cadastre-se
              </button>
            </span>
          </div>
        </>
      ) : (
        <>
          <RegisterForm onSuccess={handleRegisterSuccess} />
          <div className="p-3 pt-2 pb-4 text-center border-t border-app-border">
            <span className="text-sm text-app-text-muted">
              Já tem uma conta?{' '}
              <button
                className="text-app-accent font-medium hover:underline"
                onClick={() => handleTabChange('login')}
              >
                Entrar
              </button>
            </span>
          </div>
        </>
      )}
    </AuthCard>
  );
};

export default Auth;
