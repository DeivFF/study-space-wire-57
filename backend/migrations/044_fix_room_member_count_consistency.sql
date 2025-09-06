-- Migration 044: Fix room member count consistency
-- Date: 2025-09-06
-- Description: Corrige inconsistências no contador de membros e adiciona trigger para prevenção

-- 1. Corrigir todas as inconsistências existentes
UPDATE rooms 
SET current_members = (
  SELECT COUNT(*) 
  FROM room_members 
  WHERE room_id = rooms.id
) 
WHERE current_members != (
  SELECT COUNT(*) 
  FROM room_members 
  WHERE room_id = rooms.id
);

-- 2. Criar função de trigger para manter consistência automática
CREATE OR REPLACE FUNCTION update_room_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE rooms SET current_members = current_members + 1 WHERE id = NEW.room_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE rooms SET current_members = current_members - 1 WHERE id = OLD.room_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger para executar a função automaticamente
DROP TRIGGER IF EXISTS room_member_count_trigger ON room_members;
CREATE TRIGGER room_member_count_trigger
  AFTER INSERT OR DELETE ON room_members
  FOR EACH ROW EXECUTE FUNCTION update_room_member_count();

-- 4. Verificar se a correção foi aplicada corretamente
DO $$
DECLARE
  inconsistent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inconsistent_count
  FROM rooms r
  WHERE r.current_members != (
    SELECT COUNT(*) 
    FROM room_members rm 
    WHERE rm.room_id = r.id
  );
  
  IF inconsistent_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % rooms still have inconsistent member counts', inconsistent_count;
  ELSE
    RAISE NOTICE 'Migration successful: All room member counts are consistent';
  END IF;
END $$;