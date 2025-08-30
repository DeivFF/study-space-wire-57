-- Migration 018: Criar sistema de salas completo
-- Baseado no sistema-sala.md

-- Enums necessários
CREATE TYPE room_visibility AS ENUM ('public', 'private');
CREATE TYPE room_member_role AS ENUM ('owner', 'moderator', 'member');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE access_request_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE moderation_action AS ENUM ('kick', 'promote', 'demote', 'mute', 'unmute');

-- Tabela principal de salas
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (length(trim(name)) >= 3 AND length(trim(name)) <= 50),
    description TEXT CHECK (length(description) <= 200),
    visibility room_visibility NOT NULL DEFAULT 'public',
    code TEXT NOT NULL UNIQUE CHECK (code ~ '^#[A-Z0-9]{2,4}$'),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_members INTEGER DEFAULT 10 CHECK (max_members > 0),
    current_members INTEGER NOT NULL DEFAULT 0 CHECK (current_members >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_rooms_owner_id ON rooms(owner_id);
CREATE INDEX idx_rooms_visibility ON rooms(visibility);
CREATE INDEX idx_rooms_code ON rooms(code);
CREATE INDEX idx_rooms_name_gin ON rooms USING gin(to_tsvector('portuguese', name));
CREATE INDEX idx_rooms_active ON rooms(is_active) WHERE is_active = true;

-- Tabela de membros das salas
CREATE TABLE room_members (
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role room_member_role NOT NULL DEFAULT 'member',
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    is_silenced BOOLEAN NOT NULL DEFAULT false,
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMPTZ,
    PRIMARY KEY (room_id, user_id)
);

-- Constraint: máximo um owner por sala
CREATE UNIQUE INDEX idx_room_members_unique_owner ON room_members(room_id) WHERE role = 'owner';

-- Índices para membros
CREATE INDEX idx_room_members_user_id ON room_members(user_id);
CREATE INDEX idx_room_members_role ON room_members(role);
CREATE INDEX idx_room_members_favorite ON room_members(user_id, is_favorite) WHERE is_favorite = true;

-- Tabela de convites diretos
CREATE TABLE room_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status invitation_status NOT NULL DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    responded_at TIMESTAMPTZ,
    UNIQUE(room_id, invitee_id, status) -- Previne convites duplicados pendentes
);

-- Índices para convites
CREATE INDEX idx_room_invitations_room_id ON room_invitations(room_id);
CREATE INDEX idx_room_invitations_invitee_id ON room_invitations(invitee_id);
CREATE INDEX idx_room_invitations_status ON room_invitations(status);
CREATE INDEX idx_room_invitations_expires_at ON room_invitations(expires_at);

-- Tabela de links de convite
CREATE TABLE room_invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_uses INTEGER CHECK (max_uses > 0),
    current_uses INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMPTZ
);

-- Índices para links de convite
CREATE INDEX idx_room_invite_links_room_id ON room_invite_links(room_id);
CREATE INDEX idx_room_invite_links_code ON room_invite_links(code);
CREATE INDEX idx_room_invite_links_active ON room_invite_links(is_active) WHERE is_active = true;

-- Tabela de solicitações de acesso para salas privadas
CREATE TABLE room_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status access_request_status NOT NULL DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    UNIQUE(room_id, user_id, status) -- Previne múltiplas solicitações pendentes
);

-- Índices para solicitações de acesso
CREATE INDEX idx_room_access_requests_room_id ON room_access_requests(room_id);
CREATE INDEX idx_room_access_requests_user_id ON room_access_requests(user_id);
CREATE INDEX idx_room_access_requests_status ON room_access_requests(status);

-- Tabela de favoritos (para rápida consulta)
CREATE TABLE room_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, room_id)
);

-- Índices para favoritos
CREATE INDEX idx_room_favorites_user_id ON room_favorites(user_id);

-- Tabela de conversas das salas (ligação 1:1 com conversations)
CREATE TABLE room_conversations (
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id),
    UNIQUE (conversation_id)
);

-- Tabela de logs de moderação
CREATE TABLE room_moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES users(id),
    target_user_id UUID REFERENCES users(id),
    action moderation_action NOT NULL,
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para logs de moderação
CREATE INDEX idx_room_moderation_logs_room_id ON room_moderation_logs(room_id);
CREATE INDEX idx_room_moderation_logs_moderator_id ON room_moderation_logs(moderator_id);
CREATE INDEX idx_room_moderation_logs_created_at ON room_moderation_logs(created_at DESC);

-- Função para gerar código único da sala
CREATE OR REPLACE FUNCTION generate_room_code() RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '#';
    i INTEGER;
    random_char TEXT;
BEGIN
    FOR i IN 1..3 LOOP
        random_char := substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        result := result || random_char;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at em rooms
CREATE OR REPLACE FUNCTION update_room_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_room_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_room_updated_at();

-- Função para incrementar contagem de membros
CREATE OR REPLACE FUNCTION increment_room_members_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE rooms 
    SET current_members = current_members + 1,
        last_activity = CURRENT_TIMESTAMP
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para decrementar contagem de membros
CREATE OR REPLACE FUNCTION decrement_room_members_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE rooms 
    SET current_members = current_members - 1,
        last_activity = CURRENT_TIMESTAMP
    WHERE id = OLD.room_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers para manter contagem de membros
CREATE TRIGGER trigger_increment_room_members
    AFTER INSERT ON room_members
    FOR EACH ROW
    EXECUTE FUNCTION increment_room_members_count();

CREATE TRIGGER trigger_decrement_room_members
    AFTER DELETE ON room_members
    FOR EACH ROW
    EXECUTE FUNCTION decrement_room_members_count();

-- Função para prevenir remoção do último owner
CREATE OR REPLACE FUNCTION prevent_last_owner_removal()
RETURNS TRIGGER AS $$
BEGIN
    -- Se está tentando remover um owner
    IF OLD.role = 'owner' THEN
        -- Verifica se há outro owner na sala
        IF NOT EXISTS (
            SELECT 1 FROM room_members 
            WHERE room_id = OLD.room_id 
            AND role = 'owner' 
            AND user_id != OLD.user_id
        ) THEN
            -- Se não há outros owners, tenta promover um moderador
            IF EXISTS (
                SELECT 1 FROM room_members 
                WHERE room_id = OLD.room_id 
                AND role = 'moderator'
            ) THEN
                -- Promove o moderador mais antigo
                UPDATE room_members 
                SET role = 'owner' 
                WHERE room_id = OLD.room_id 
                AND role = 'moderator'
                AND user_id = (
                    SELECT user_id FROM room_members 
                    WHERE room_id = OLD.room_id 
                    AND role = 'moderator' 
                    ORDER BY joined_at ASC 
                    LIMIT 1
                );
            ELSE
                -- Se não há moderadores, desativa a sala
                UPDATE rooms SET is_active = false WHERE id = OLD.room_id;
            END IF;
        END IF;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_last_owner_removal
    BEFORE DELETE ON room_members
    FOR EACH ROW
    EXECUTE FUNCTION prevent_last_owner_removal();

-- Função para sincronizar favoritos
CREATE OR REPLACE FUNCTION sync_room_favorites()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.is_favorite = true THEN
            INSERT INTO room_favorites (user_id, room_id)
            VALUES (NEW.user_id, NEW.room_id)
            ON CONFLICT DO NOTHING;
        ELSE
            DELETE FROM room_favorites 
            WHERE user_id = NEW.user_id AND room_id = NEW.room_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM room_favorites 
        WHERE user_id = OLD.user_id AND room_id = OLD.room_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_room_favorites
    AFTER INSERT OR UPDATE OF is_favorite OR DELETE ON room_members
    FOR EACH ROW
    EXECUTE FUNCTION sync_room_favorites();

-- Inserir dados de migração
INSERT INTO migrations (name) VALUES ('018_create_rooms_system.sql') 
ON CONFLICT (name) DO NOTHING;