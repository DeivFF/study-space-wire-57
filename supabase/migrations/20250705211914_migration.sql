
-- Remover colunas não utilizadas da tabela estatisticas_estudo
ALTER TABLE public.estatisticas_estudo 
DROP COLUMN IF EXISTS tempo_estudo,
DROP COLUMN IF EXISTS sessoes_pomodoro;
