import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ChipInput from './ChipInput';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

const emailRegex = /\S+@\S+\.\S+/;

const getPasswordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return (score / 4) * 100;
};

const SignupForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [studyGoal, setStudyGoal] = useState('');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  const canSubmit =
    !loading &&
    !!avatarFile &&
    avatarFile.size <= 2 * 1024 * 1024 &&
    interests.length > 0 &&
    terms;

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (fullName.trim().split(' ').length < 2) {
      newErrors.fullName = 'Informe seu nome completo';
    }
    if (!emailRegex.test(email)) {
      newErrors.email = 'Email inválido';
    }
    if (password.length < 8) {
      newErrors.password = 'Mínimo de 8 caracteres';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setStep(2);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, avatar: 'O avatar deve ter no máximo 2MB' }));
        setAvatarFile(null);
        setAvatarPreview('');
        return;
      }
      setErrors((prev) => ({ ...prev, avatar: '' }));
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!avatarFile) {
      newErrors.avatar = 'Selecione um avatar';
    } else if (avatarFile.size > 2 * 1024 * 1024) {
      newErrors.avatar = 'O avatar deve ter no máximo 2MB';
    }
    if (interests.length === 0) {
      newErrors.interests = 'Adicione ao menos um interesse';
    }
    if (!terms) {
      newErrors.terms = 'É necessário aceitar os termos';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    let avatar_url = '';
    try {
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        avatar_url = urlData.publicUrl;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            interests,
            avatar_url,
            study_goal: studyGoal,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          user_id: data.user.id,
          avatar_url,
          nickname: fullName,
          interests,
          study_goal: studyGoal,
        });
        if (profileError) throw profileError;
      }
      setSuccess(true);
    } catch (err: any) {
      setErrors({ form: err.message });
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-lg text-center space-y-4">
          <div className="p-4 rounded bg-success text-primary-foreground">
            Conta criada! Verifique seu email.
          </div>
          <Button onClick={() => navigate('/')}>Ir para login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-lg">
        <Progress value={step === 1 ? 50 : 100} className="mb-6" />

        {step === 1 && (
          <form onSubmit={handleNext} noValidate className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              />
              {errors.fullName && (
                <p id="fullName-error" className="mt-2 text-sm text-error">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-2 text-sm text-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="mt-2 text-sm text-error">
                  {errors.password}
                </p>
              )}
              <div className="mt-2 h-2 bg-muted rounded">
                <div
                  className={`h-full rounded ${
                    passwordStrength < 50
                      ? 'bg-destructive'
                      : passwordStrength < 75
                      ? 'bg-warning'
                      : 'bg-success'
                  }`}
                  style={{ width: `${passwordStrength}%` }}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? 'confirm-error' : undefined
                }
              />
              {errors.confirmPassword && (
                <p id="confirm-error" className="mt-2 text-sm text-error">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {errors.form && (
              <p id="form-error" className="text-sm text-error">
                {errors.form}
              </p>
            )}

            <Button type="submit" className="w-full">
              Próximo
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-busy={loading}>
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                {avatarPreview && <AvatarImage src={avatarPreview} alt="Avatar" />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  aria-invalid={!!errors.avatar}
                  aria-describedby={errors.avatar ? 'avatar-error' : undefined}
                />
                {errors.avatar && (
                  <p id="avatar-error" className="mt-2 text-sm text-error">
                    {errors.avatar}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="interests">Interesses</Label>
              <ChipInput
                id="interests"
                value={interests}
                onChange={setInterests}
                placeholder="Digite e pressione Enter"
                aria-describedby={errors.interests ? 'interests-error' : undefined}
              />
              {errors.interests && (
                <p id="interests-error" className="mt-2 text-sm text-error">
                  {errors.interests}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="studyGoal">Objetivo de estudo</Label>
              <Input
                id="studyGoal"
                value={studyGoal}
                onChange={(e) => setStudyGoal(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={terms}
                onCheckedChange={(checked) => setTerms(checked === true)}
                aria-invalid={!!errors.terms}
                aria-describedby={errors.terms ? 'terms-error' : undefined}
              />
              <Label htmlFor="terms" className="text-sm">
                Aceito os termos de uso
              </Label>
            </div>
            {errors.terms && (
              <p id="terms-error" className="mt-2 text-sm text-error">
                {errors.terms}
              </p>
            )}
            {errors.form && (
              <p id="form-error" className="text-sm text-error">
                {errors.form}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={!canSubmit}>
              {loading ? 'Criando...' : 'Criar conta'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignupForm;

