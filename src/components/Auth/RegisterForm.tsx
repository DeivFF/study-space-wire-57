
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterFormProps {
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Por favor, insira seu e-mail';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Por favor, insira um e-mail válido';
    }

    if (!formData.password) {
      newErrors.password = 'Por favor, crie uma senha';
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Por favor, confirme sua senha';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const success = await register(formData.email, formData.password);
      if (success) {
        onSuccess();
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form className="p-5" onSubmit={handleSubmit}>
      <div className="mb-3">
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

      <div className="mb-3">
        <label className="block mb-1.5 text-sm font-medium text-app-text" htmlFor="register-password">
          Senha
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="register-password"
            className={`w-full bg-app-bg border rounded-lg p-2.5 pr-10 text-sm outline-none transition-colors text-app-text ${
              errors.password ? 'border-app-danger' : 'border-app-border focus:border-app-accent'
            }`}
            placeholder="Crie uma senha segura"
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

      <div className="mb-4">
        <label className="block mb-1.5 text-sm font-medium text-app-text" htmlFor="confirm-password">
          Confirmar senha
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirm-password"
            className={`w-full bg-app-bg border rounded-lg p-2.5 pr-10 text-sm outline-none transition-colors text-app-text ${
              errors.confirmPassword ? 'border-app-danger' : 'border-app-border focus:border-app-accent'
            }`}
            placeholder="Digite a senha novamente"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          />
          <button
            type="button"
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-app-text-muted"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <div className="text-app-danger text-xs mt-1">{errors.confirmPassword}</div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-app-accent to-app-accent-2 text-white p-2.5 rounded-lg font-semibold text-sm transition-all hover:brightness-105 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Criando conta...' : 'Criar conta'}
      </button>

      <p className="text-xs text-app-text-muted text-center mt-3">
        Ao se cadastrar, você concorda com nossos{' '}
        <a href="#" className="text-app-accent font-medium hover:underline">
          Termos de Uso
        </a>{' '}
        e{' '}
        <a href="#" className="text-app-accent font-medium hover:underline">
          Política de Privacidade
        </a>
        .
      </p>
    </form>
  );
};
