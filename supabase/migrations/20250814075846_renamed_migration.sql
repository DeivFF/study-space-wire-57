-- Criar tabela de profiles se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nickname TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'offline'::text,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY IF NOT EXISTS "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();