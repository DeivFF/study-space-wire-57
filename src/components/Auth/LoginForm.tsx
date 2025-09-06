
import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onForgotPassword: () => void;
  showSuccessMessage?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onForgotPassword, showSuccessMessage }) => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Por favor, insira seu e-mail';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Por favor, insira um e-mail válido';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Por favor, insira sua senha';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const success = await login(formData.email, formData.password);
      if (!success) {
        setErrors({ general: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
      }
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  return (
    <form className="p-5" onSubmit={handleSubmit}>
      {showSuccessMessage && (
        <div className="flex items-center gap-3 bg-app-success/15 border border-app-success/30 text-app-success p-3 rounded-xl mb-5">
          <CheckCircle size={20} />
          <span>Cadastro realizado com sucesso! Faça login para continuar.</span>
        </div>
      )}

      {errors.general && (
        <div className="bg-app-danger/15 border border-app-danger/30 text-app-danger p-3 rounded-xl mb-5">
          {errors.general}
        </div>
      )}

      <div className="mb-4">
        <label className="block mb-1.5 text-sm font-medium text-app-text" htmlFor="email">
          E-mail
        </label>
        <input
          type="email"
          id="email"
          className={`w-full bg-app-bg border rounded-lg p-2.5 text-sm outline-none transition-colors text-app-text ${
            errors.email ? 'border-app-danger' : 'border-app-border focus:border-app-accent'
          }`}
          placeholder="seu@email.com"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
        />
        {errors.email && (
          <div className="text-app-danger text-xs mt-1">{errors.email}</div>
        )}
      </div>

      <div className="mb-4">
        <label className="block mb-1.5 text-sm font-medium text-app-text" htmlFor="password">
          Senha
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            className={`w-full bg-app-bg border rounded-lg p-2.5 pr-10 text-sm outline-none transition-colors text-app-text ${
              errors.password ? 'border-app-danger' : 'border-app-border focus:border-app-accent'
            }`}
            placeholder="Sua senha"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
          />
          <button
            type="button"
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-app-text-muted"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <div className="text-app-danger text-xs mt-1">{errors.password}</div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-app-text">
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
            className="text-app-accent"
          />
          Lembrar-me
        </label>
        <button
          type="button"
          className="text-app-accent text-sm font-medium hover:underline"
          onClick={onForgotPassword}
        >
          Esqueci a senha
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-app-accent to-app-accent-2 text-white p-2.5 rounded-lg font-semibold text-sm mt-2 transition-all hover:brightness-105 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
};
