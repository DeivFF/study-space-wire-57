
import React, { useState } from 'react';
import { Key } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBackToLogin }) => {
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Por favor, insira seu e-mail';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Por favor, insira um e-mail válido';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const result = await resetPassword(email);
      if (result) {
        setSuccess(true);
      }
    }
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  return (
    <div>
      <div className="p-6 pb-4 text-center border-b border-app-border">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-app-accent/12 mx-auto mb-4 text-app-accent">
          <Key size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-app-text">Recuperar senha</h2>
        <p className="text-app-text-muted">
          Informe seu e-mail para receber instruções de redefinição
        </p>
      </div>

      {success ? (
        <div className="p-6">
          <div className="bg-app-success/15 border border-app-success/30 text-app-success p-4 rounded-xl mb-6 text-center">
            <p className="font-medium">Instruções enviadas!</p>
            <p className="text-sm mt-1">Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
          </div>
          <button
            onClick={onBackToLogin}
            className="w-full text-app-accent font-medium hover:underline"
          >
            Voltar para o login
          </button>
        </div>
      ) : (
        <form className="p-6" onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block mb-2 font-medium text-app-text" htmlFor="recovery-email">
              E-mail
            </label>
            <input
              type="email"
              id="recovery-email"
              className={`w-full bg-app-bg border rounded-xl p-3 outline-none transition-colors text-app-text ${
                errors.email ? 'border-app-danger' : 'border-app-border focus:border-app-accent'
              }`}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => handleInputChange(e.target.value)}
            />
            {errors.email && (
              <div className="text-app-danger text-xs mt-1">{errors.email}</div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-app-accent to-app-accent-2 text-white p-3.5 rounded-xl font-semibold text-base transition-all hover:brightness-105 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Enviando...' : 'Enviar instruções'}
          </button>

          <div className="text-center mt-6 pt-4 border-t border-app-border">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-app-accent font-medium hover:underline"
            >
              Voltar para o login
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
