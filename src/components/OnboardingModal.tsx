import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Check, X, AlertTriangle, ArrowRight, ArrowLeft, Image, AtSign, CheckCircle } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (nickname: string, avatarUrl?: string) => Promise<boolean>;
  userEmail: string;
}

interface AvatarOption {
  id: string;
  bg: string;
  fg: string;
  emoji: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ 
  isOpen, 
  onComplete, 
  userEmail 
}) => {
  const [currentStep, setCurrentStep] = useState<'nickname' | 'avatar'>('nickname');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const avatarOptions: AvatarOption[] = [
    { id: 'a1', bg: '#FEE2E2', fg: '#991B1B', emoji: '😀' },
    { id: 'a2', bg: '#E0F2FE', fg: '#075985', emoji: '😎' },
    { id: 'a3', bg: '#ECFDF5', fg: '#065F46', emoji: '👋' },
    { id: 'a4', bg: '#FFF7ED', fg: '#9A3412', emoji: '✨' },
    { id: 'a5', bg: '#EEF2FF', fg: '#3730A3', emoji: '👩‍🎓' },
    { id: 'a6', bg: '#FAE8FF', fg: '#86198F', emoji: '👾' },
    { id: 'a7', bg: '#F0FDFA', fg: '#155E75', emoji: '🤩' },
    { id: 'a8', bg: '#F5F5F4', fg: '#1C1917', emoji: '💻' },
    { id: 'a9', bg: '#E9D5FF', fg: '#6B21A8', emoji: '🔥' },
    { id: 'a10', bg: '#DCFCE7', fg: '#166534', emoji: '🌱' },
    { id: 'a11', bg: '#FFE4E6', fg: '#9F1239', emoji: '💜' },
    { id: 'a12', bg: '#E2E8F0', fg: '#0F172A', emoji: '🔍' }
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('nickname');
      setNickname('');
      setSelectedAvatar(null);
      setNicknameStatus('idle');
      setErrorMessage('');
      setCompletionError('');
    }
  }, [isOpen]);

  const validateNickname = (nick: string): boolean => {
    const pattern = /^[a-zA-Z0-9._-]{3,16}$/;
    return pattern.test(nick);
  };

  const checkNicknameAvailability = async (nick: string) => {
    if (!validateNickname(nick)) {
      setNicknameStatus('invalid');
      setErrorMessage('Formato inválido. Use 3–16 caracteres (letras, números, ponto, hífen ou underline).');
      return false;
    }

    setIsChecking(true);
    setNicknameStatus('checking');

    try {
      const response = await fetch(`http://localhost:3002/api/profile/nickname/check?nickname=${encodeURIComponent(nick)}`);
      const data = await response.json();

      if (data.success) {
        if (data.data.available) {
          setNicknameStatus('available');
          setErrorMessage('');
          return true;
        } else {
          setNicknameStatus('taken');
          setErrorMessage('Este nickname já existe. Tente outro.');
          return false;
        }
      } else {
        setNicknameStatus('invalid');
        setErrorMessage(data.message || 'Erro ao verificar disponibilidade.');
        return false;
      }
    } catch (error) {
      console.error('Error checking nickname availability:', error);
      setNicknameStatus('invalid');
      setErrorMessage('Erro de conexão. Verifique se o servidor está rodando e tente novamente.');
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const handleNicknameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);

    if (value.length === 0) {
      setNicknameStatus('idle');
      setErrorMessage('');
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the API call
    timeoutRef.current = setTimeout(async () => {
      if (value.length >= 3) {
        await checkNicknameAvailability(value);
      } else if (value.length > 0) {
        setNicknameStatus('invalid');
        setErrorMessage('Mínimo 3 caracteres');
      }
    }, 500);
  };

  const handleNextStep = async () => {
    if (currentStep === 'nickname') {
      const isValid = await checkNicknameAvailability(nickname);
      if (isValid) {
        setCurrentStep('avatar');
      }
    }
  };

  const handleComplete = async () => {
    if (currentStep === 'avatar') {
      setIsCompleting(true);
      setCompletionError('');
      
      try {
        const success = await onComplete(nickname, selectedAvatar || undefined);
        if (!success) {
          setCompletionError('Falha ao completar o onboarding. Tente novamente.');
        }
      } catch (error) {
        setCompletionError('Erro ao completar o onboarding. Tente novamente.');
      } finally {
        setIsCompleting(false);
      }
    }
  };

  const getStatusIcon = () => {
    switch (nicknameStatus) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'taken':
      case 'invalid':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (nicknameStatus) {
      case 'idle':
        return 'Digite um nickname para validar disponibilidade...';
      case 'checking':
        return 'Verificando disponibilidade...';
      case 'available':
        return 'Disponível!';
      case 'taken':
      case 'invalid':
        return errorMessage;
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-app-panel border border-app-border rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-app-border">
          <div className="w-5 h-5 flex items-center justify-center">
            {currentStep === 'nickname' ? <AtSign className="w-4 h-4" /> : <Image className="w-4 h-4" />}
          </div>
          <h2 className="font-semibold text-app-text">
            Bem-vindo! Complete seu perfil
          </h2>
        </div>

        {/* Steps Indicator */}
        <div className="p-4 border-b border-app-border">
          <div className="flex gap-2 bg-app-bg p-1 rounded-lg border border-app-border">
            <div
              className={`flex-1 flex items-center gap-2 p-3 rounded-lg justify-center border ${
                currentStep === 'nickname'
                  ? 'bg-app-panel border-app-border'
                  : 'border-transparent'
              }`}
            >
              <AtSign className="w-4 h-4" />
              <span className="text-sm font-medium">Nickname</span>
            </div>
            <div
              className={`flex-1 flex items-center gap-2 p-3 rounded-lg justify-center border ${
                currentStep === 'avatar'
                  ? 'bg-app-panel border-app-border'
                  : 'border-transparent'
              }`}
            >
              <Image className="w-4 h-4" />
              <span className="text-sm font-medium">Avatar</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {currentStep === 'nickname' && (
            <div className="space-y-3">
              <div className="bg-app-panel border border-app-border rounded-lg p-3">
                <label className="block text-sm text-app-text-muted mb-2">
                  Escolha seu nickname (3–16, letras/números, ". _ -")
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-app-text-muted">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={nickname}
                      onChange={handleNicknameChange}
                      maxLength={16}
                      placeholder="ex.: bea.lima"
                      className="w-full bg-app-bg border border-app-border rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-app-accent text-app-text"
                    />
                  </div>
                  <button
                    onClick={handleNextStep}
                    disabled={nicknameStatus !== 'available' || isChecking}
                    className="bg-gradient-to-r from-app-accent to-app-accent-2 text-white px-4 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className={`flex items-center gap-2 mt-3 p-2 rounded-lg border border-app-border bg-app-bg ${
                  nicknameStatus === 'available' ? 'text-green-600' :
                  nicknameStatus === 'taken' || nicknameStatus === 'invalid' ? 'text-red-600' :
                  'text-app-text-muted'
                }`}>
                  {getStatusIcon()}
                  <span className="text-sm">{getStatusText()}</span>
                </div>
              </div>
              <div className="text-xs text-app-text-muted">
                Dica: mantenha o apelido curto; ele será usado em URLs públicas (ex.: <code>@seu.nickname</code>).
              </div>
            </div>
          )}

          {currentStep === 'avatar' && (
            <div className="space-y-3">
              <p className="text-sm text-app-text-muted">
                Escolha um avatar padrão ou conclua para manter o avatar <span className="font-semibold">default</span>.
              </p>
              
              <div className="grid grid-cols-6 gap-2 mt-2">
                {avatarOptions.map((avatar) => (
                  <div
                    key={avatar.id}
                    className={`relative aspect-square border rounded-lg bg-app-panel cursor-pointer transition-all ${
                      selectedAvatar === avatar.id
                        ? 'ring-2 ring-app-accent ring-offset-2'
                        : 'border-app-border hover:border-app-accent'
                    }`}
                    onClick={() => setSelectedAvatar(avatar.id === selectedAvatar ? null : avatar.id)}
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mt-2.5 border"
                      style={{
                        backgroundColor: avatar.bg,
                        borderColor: `${avatar.fg}66`,
                        color: avatar.fg
                      }}
                    >
                      {avatar.emoji}
                    </div>
                    {selectedAvatar === avatar.id && (
                      <div className="absolute top-1 right-1 bg-app-panel border border-app-border rounded-full p-1">
                        <Check className="w-3 h-3 text-app-accent" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setCurrentStep('nickname')}
                  className="flex items-center gap-2 px-3 py-2 text-app-text-muted hover:text-app-text"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isCompleting}
                  className="flex items-center gap-2 bg-gradient-to-r from-app-accent to-app-accent-2 text-white px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCompleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isCompleting ? 'Processando...' : 'Concluir'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-app-border">
          {completionError && (
            <div className="mb-2 p-2 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {completionError}
            </div>
          )}
          <p className="text-xs text-app-text-muted">
            Este passo é obrigatório no primeiro login.
          </p>
        </div>
      </div>
    </div>
  );
};