import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface AuthProps {
  onSuccess?: () => void;
}

const Auth = ({ onSuccess }: AuthProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [statusMessage, setStatusMessage] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;

    setStatusMessage('');
    setErrors({});

    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email é obrigatório';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Email inválido';

    if (!password) newErrors.password = 'Senha é obrigatória';
    else if (password.length < 6) newErrors.password = 'Mínimo de 6 caracteres';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setStatusMessage('Corrija os erros antes de continuar.');
      return;
    }

    setLoading(true);
    setStatusMessage(isLogin ? 'Entrando...' : 'Criando conta...');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: 'Login realizado!', description: 'Bem-vindo de volta!' });
        setStatusMessage('Login realizado!');
        onSuccess?.();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({ title: 'Conta criada!', description: 'Verifique seu email para confirmar.' });
        setStatusMessage('Conta criada! Verifique seu email.');
        setShowSuccessBanner(true);
        setIsLogin(true);
      }
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, form: error.message }));
      setStatusMessage(error.message);
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setIsCapsLock(e.getModifierState('CapsLock'));
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrors((prev) => ({ ...prev, email: 'Informe seu email para recuperar a senha' }));
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Email enviado', description: 'Verifique seu email para redefinir a senha.' });
    }
  };

  const handleBannerDismiss = () => {
    setShowSuccessBanner(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        {showSuccessBanner && (
          <div className="mb-4 p-4 rounded bg-success text-primary-foreground flex items-center justify-between">
            <span>Conta criada! Verifique seu email.</span>
            <button onClick={handleBannerDismiss} aria-label="Fechar" className="ml-4">
              ×
            </button>
          </div>
        )}
        <div className="text-center mb-8">
          <img
            src="/logo.svg"
            alt="CNU Study logo"
            className="mx-auto mb-4 h-16 w-auto"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Entrar' : 'Criar conta'}
          </h1>
          <p className="text-gray-600">
            {isLogin
              ? 'Entre na sua conta para continuar estudando'
              : 'Crie sua conta para começar a estudar'}
          </p>
        </div>

        <form
          onSubmit={handleAuth}
          className="space-y-4"
          noValidate
          aria-busy={loading}
        >
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="pl-10 focus-visible:shadow-focus"
                aria-invalid={!!errors.email}
                aria-describedby={
                  [errors.email ? 'email-error' : null, statusMessage ? 'form-status' : null]
                    .filter(Boolean)
                    .join(' ') || undefined
                }
                required
              />
            </div>
            {errors.email && (
              <p id="email-error" className="mt-2 text-sm text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={handleKeyUp}
                placeholder="********"
                className="pl-10 pr-10 focus-visible:shadow-focus"
                aria-invalid={!!errors.password}
                aria-describedby={
                  [
                    errors.password ? 'password-error' : null,
                    isCapsLock ? 'caps-lock' : null,
                    statusMessage ? 'form-status' : null,
                  ]
                    .filter(Boolean)
                    .join(' ') || undefined
                }
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-500"
                aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {isCapsLock && (
                <span
                  id="caps-lock"
                  className="absolute right-10 top-3 text-xs text-red-600"
                >
                  Caps Lock
                </span>
              )}
            </div>
            {errors.password && (
              <p id="password-error" className="mt-2 text-sm text-red-600">
                {errors.password}
              </p>
            )}
          </div>

          <div className="hidden" aria-hidden="true">
            <Label htmlFor="hp-field" className="sr-only">
              Não preencha este campo
            </Label>
            <Input
              id="hp-field"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="focus-visible:shadow-focus"
            />
          </div>

          {statusMessage && (
            <p
              id="form-status"
              className={`text-sm ${errors.form ? 'text-red-600' : 'text-gray-600'}`}
            >
              {statusMessage}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        <div className="mt-6 flex justify-between text-sm">
          {isLogin && (
            <Button
              type="button"
              onClick={handleForgotPassword}
              variant="link"
              className="p-0 h-auto text-primary"
            >
              Esqueci a senha
            </Button>
          )}
          <Button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            variant="link"
            className="p-0 h-auto text-primary ml-auto"
          >
            {isLogin ? 'Criar conta' : 'Já tenho conta'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
