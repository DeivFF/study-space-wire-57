
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthCard } from '../components/Auth/AuthCard';
import { LoginForm } from '../components/Auth/LoginForm';
import { RegisterForm } from '../components/Auth/RegisterForm';
import { ForgotPasswordForm } from '../components/Auth/ForgotPasswordForm';
import { VerificationForm } from '../components/Auth/VerificationForm';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'verification';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { user, isLoading, clearVerificationData } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to home page
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="text-app-text">Carregando...</div>
      </div>
    );
  }

  const handleRegisterSuccess = () => {
    // User is automatically logged in after registration, so we don't need verification
    console.log('Registration successful, user automatically logged in');
    setMode('login');
    setShowSuccessMessage(true);
  };

  const handleBackToLogin = () => {
    setMode('login');
    setShowSuccessMessage(false);
    clearVerificationData();
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

  if (mode === 'verification') {
    return (
      <AuthCard>
        <VerificationForm 
          email="" 
          onSuccess={handleBackToLogin} 
          onBack={handleBackToLogin} 
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      showTabs={true}
      activeTab={mode as 'login' | 'register'}
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
