
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterFormProps {
  onSuccess: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Por favor, insira seu nome completo';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'O nome deve ter pelo menos 2 caracteres';
    }

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


    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const result = await register(
        formData.email,
        formData.password,
        formData.name
      );
      if (result.success) {
        console.log('Registration successful, redirecting to main app');
        // User is automatically logged in, so we can call onSuccess without verification
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
        <label className="block mb-1.5 text-sm font-medium text-app-text" htmlFor="name">
          Nome completo
        </label>
        <input
          type="text"
          id="name"
          className={`w-full bg-app-bg border rounded-lg p-2.5 text-sm outline-none transition-colors text-app-text ${
            errors.name ? 'border-app-danger' : 'border-app-border focus:border-app-accent'
          }`}
          placeholder="Seu nome completo"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
        />
        {errors.name && (
          <div className="text-app-danger text-xs mt-1">{errors.name}</div>
        )}
      </div>

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
