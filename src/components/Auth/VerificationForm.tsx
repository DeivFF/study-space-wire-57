import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface VerificationFormProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export const VerificationForm: React.FC<VerificationFormProps> = ({ 
  email, 
  onSuccess, 
  onBack 
}) => {
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!code.trim()) {
      newErrors.code = 'Por favor, insira o código de verificação';
    } else if (code.trim().length !== 6) {
      newErrors.code = 'O código deve ter 6 dígitos';
    } else if (!/^\d+$/.test(code)) {
      newErrors.code = 'O código deve conter apenas números';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:3002/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setErrors({ general: errorData.message || 'Código inválido. Tente novamente.' });
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        console.log('Email verified successfully:', data);
        onSuccess();
      } catch (error) {
        console.error('Verification error:', error);
        setErrors({ general: 'Erro ao verificar email. Tente novamente.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (value: string) => {
    setCode(value);
    if (errors.code || errors.general) {
      setErrors({});
    }
  };

  return (
    <form className="p-5" onSubmit={handleSubmit}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-app-text mb-2">Verificação de Email</h3>
        <p className="text-sm text-app-text-muted mb-4">
          Enviamos um código de verificação para <span className="font-medium">{email}</span>. 
          Insira o código abaixo para confirmar sua conta.
        </p>
      </div>

      {errors.general && (
        <div className="bg-app-danger/15 border border-app-danger/30 text-app-danger p-3 rounded-xl mb-4">
          {errors.general}
        </div>
      )}

      <div className="mb-4">
        <label className="block mb-1.5 text-sm font-medium text-app-text" htmlFor="verification-code">
          Código de verificação
        </label>
        <input
          type="text"
          id="verification-code"
          className={`w-full bg-app-bg border rounded-lg p-2.5 text-sm outline-none transition-colors text-app-text ${
            errors.code ? 'border-app-danger' : 'border-app-border focus:border-app-accent'
          }`}
          placeholder="000000"
          value={code}
          onChange={(e) => handleInputChange(e.target.value)}
          maxLength={6}
        />
        {errors.code && (
          <div className="text-app-danger text-xs mt-1">{errors.code}</div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-app-accent to-app-accent-2 text-white p-2.5 rounded-lg font-semibold text-sm transition-all hover:brightness-105 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Verificando...' : 'Verificar Email'}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full bg-app-muted text-app-text p-2.5 rounded-lg font-semibold text-sm mt-2 transition-all hover:brightness-105 active:translate-y-px"
      >
        Voltar
      </button>
    </form>
  );
};