# Database Engineer Agent 🗄️

## Especialização
Projeto, otimização e manutenção de banco de dados PostgreSQL, incluindo schema design, migrações, performance tuning e estratégias de backup/recovery.

## Contexto do Projeto Study Space

### Stack de Dados Atual
- **Banco de Dados**: PostgreSQL 15+
- **Driver**: node-postgres (pg)
- **Migrations**: Sistema customizado com arquivos SQL sequenciais
- **Connection Pool**: Configurado via pg Pool
- **Ambiente**: Desenvolvimento local + produção (planejada)

### Schema Atual

#### Tabela `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  profile_picture VARCHAR(500),
  university VARCHAR(255),
  course VARCHAR(255),
  graduation_year INTEGER,
  study_preferences TEXT[], 
  privacy_settings JSONB DEFAULT '{}',
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_university ON users(university);
CREATE INDEX idx_users_course ON users(course);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### Tabela `user_connections`
```sql
CREATE TABLE user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(requester_id, target_id)
);

-- Índices
CREATE INDEX idx_connections_requester ON user_connections(requester_id);
CREATE INDEX idx_connections_target ON user_connections(target_id);
CREATE INDEX idx_connections_status ON user_connections(status);
CREATE UNIQUE INDEX idx_connections_pair ON user_connections(requester_id, target_id);
```

#### Tabela `notifications`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

#### Tabela `refresh_tokens`
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT false
);

-- Índices
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE UNIQUE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

## Sistema de Migrações

### Estrutura das Migrações
```
backend/migrations/
├── 000_create_migrations_tracking.sql    # Sistema de controle
├── 001_create_auth_tables.sql           # Autenticação básica
├── 002_add_name_to_users.sql           # Evolução do schema
├── 003_add_refresh_tokens_table.sql     # Tokens de refresh
├── 004_add_onboarding_fields.sql       # Campos de onboarding
├── 005_add_profile_fields.sql          # Campos de perfil
├── 006_create_user_connections_table.sql # Sistema de conexões
├── 007_create_notifications_table.sql   # Notificações
└── 008_add_indexes_optimization.sql     # Otimizações (futuro)
```

### Padrão de Migração
```sql
-- Migration 008: Add performance indexes
-- Description: Adiciona índices para otimizar queries frequentes

-- Rollback instructions (commented):
-- DROP INDEX IF EXISTS idx_users_search_text;
-- DROP INDEX IF EXISTS idx_notifications_unread_user;

-- Forward migration:
-- Índice para busca de usuários por texto
CREATE INDEX idx_users_search_text ON users USING GIN(to_tsvector('portuguese', name || ' ' || COALESCE(bio, '')));

-- Índice composto para notificações não lidas por usuário
CREATE INDEX idx_notifications_unread_user ON notifications(user_id, is_read, created_at) 
WHERE is_read = false;

-- Atualizar tracking
INSERT INTO migrations_tracking (version, description, executed_at) 
VALUES ('008', 'Add performance indexes', CURRENT_TIMESTAMP);
```

### Script de Migração
```bash
#!/bin/bash
# backend/scripts/migrate.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Verificar migrações executadas
    const result = await pool.query(
      'SELECT version FROM migrations_tracking ORDER BY version::int'
    );
    
    const executedVersions = result.rows.map(row => parseInt(row.version));
    const lastVersion = Math.max(...executedVersions, -1);
    
    // Executar novas migrações
    const migrationFiles = fs.readdirSync('./migrations')
      .filter(file => file.endsWith('.sql'))
      .sort();
      
    for (const file of migrationFiles) {
      const version = parseInt(file.split('_')[0]);
      
      if (version > lastVersion) {
        console.log(`Executing migration ${file}...`);
        const sql = fs.readFileSync(path.join('./migrations', file), 'utf8');
        await pool.query(sql);
        console.log(`✅ Migration ${file} completed`);
      }
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
```

## Queries Otimizadas

### 1. Busca de Usuários
```sql
-- Busca simples por nome/email
SELECT id, name, email, profile_picture, university 
FROM users 
WHERE 
  name ILIKE $1 OR email ILIKE $1
  AND email_verified = true
ORDER BY 
  CASE WHEN name ILIKE $1 THEN 1 ELSE 2 END,
  name
LIMIT 20;

-- Busca com full-text search
SELECT id, name, email, profile_picture, university,
  ts_rank(to_tsvector('portuguese', name || ' ' || COALESCE(bio, '')), plainto_tsquery('portuguese', $1)) as rank
FROM users 
WHERE 
  to_tsvector('portuguese', name || ' ' || COALESCE(bio, '')) @@ plainto_tsquery('portuguese', $1)
  AND email_verified = true
ORDER BY rank DESC, name
LIMIT 20;
```

### 2. Sistema de Conexões
```sql
-- Listar conexões aceitas de um usuário
SELECT 
  uc.id,
  uc.created_at,
  u.id as user_id,
  u.name,
  u.email,
  u.profile_picture,
  u.university,
  u.course
FROM user_connections uc
JOIN users u ON (
  CASE 
    WHEN uc.requester_id = $1 THEN u.id = uc.target_id
    ELSE u.id = uc.requester_id
  END
)
WHERE 
  (uc.requester_id = $1 OR uc.target_id = $1)
  AND uc.status = 'accepted'
ORDER BY uc.created_at DESC;

-- Verificar status de conexão entre dois usuários
SELECT status 
FROM user_connections 
WHERE 
  (requester_id = $1 AND target_id = $2) OR
  (requester_id = $2 AND target_id = $1);

-- Contar conexões de um usuário
SELECT COUNT(*) as connection_count
FROM user_connections
WHERE 
  (requester_id = $1 OR target_id = $1)
  AND status = 'accepted';
```

### 3. Sistema de Notificações
```sql
-- Notificações não lidas de um usuário
SELECT 
  id, type, title, message, data, created_at
FROM notifications 
WHERE 
  user_id = $1 
  AND is_read = false
ORDER BY created_at DESC
LIMIT 50;

-- Marcar todas como lidas
UPDATE notifications 
SET 
  is_read = true,
  updated_at = CURRENT_TIMESTAMP
WHERE 
  user_id = $1 
  AND is_read = false
RETURNING id;

-- Limpar notificações antigas (job de limpeza)
DELETE FROM notifications 
WHERE 
  created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
  AND is_read = true;
```

## Performance e Otimização

### 1. Análise de Performance
```sql
-- Verificar queries lentas
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE mean_time > 100  -- queries > 100ms
ORDER BY mean_time DESC
LIMIT 10;

-- Análise de índices não utilizados
SELECT 
  indexrelname,
  relname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY relname;

-- Verificar tamanho das tabelas
SELECT 
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS table_size
FROM pg_stat_user_tables 
ORDER BY pg_total_relation_size(relid) DESC;
```

### 2. Otimizações Implementadas

#### Connection Pooling
```javascript
// backend/config/database.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // máximo 20 conexões
  idleTimeoutMillis: 30000,   // timeout de 30s
  connectionTimeoutMillis: 2000, // timeout de conexão
  maxUses: 7500,              // máximo 7500 usos por conexão
});

// Health check
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
```

#### Query com Prepared Statements
```javascript
// Método seguro com prepared statements
const getUserConnections = async (userId) => {
  const query = `
    SELECT 
      uc.id, uc.created_at, uc.status,
      u.id as user_id, u.name, u.email, u.profile_picture
    FROM user_connections uc
    JOIN users u ON (
      CASE 
        WHEN uc.requester_id = $1 THEN u.id = uc.target_id
        ELSE u.id = uc.requester_id
      END
    )
    WHERE 
      (uc.requester_id = $1 OR uc.target_id = $1)
      AND uc.status = 'accepted'
    ORDER BY uc.created_at DESC
    LIMIT $2
  `;
  
  const result = await pool.query(query, [userId, 50]);
  return result.rows;
};
```

### 3. Índices Estratégicos
```sql
-- Índices compostos para queries frequentes
CREATE INDEX idx_notifications_user_unread_time ON notifications(user_id, is_read, created_at) 
WHERE is_read = false;

-- Índice parcial para conexões pendentes
CREATE INDEX idx_connections_pending ON user_connections(target_id, created_at) 
WHERE status = 'pending';

-- Índice GIN para busca full-text
CREATE INDEX idx_users_search ON users USING GIN(to_tsvector('portuguese', name || ' ' || COALESCE(bio, '')));

-- Índice para cleanup de tokens expirados
CREATE INDEX idx_refresh_tokens_cleanup ON refresh_tokens(expires_at) 
WHERE revoked = false;
```

## Backup e Recovery

### 1. Estratégia de Backup
```bash
#!/bin/bash
# scripts/backup.sh

DB_NAME="study_space"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup completo
pg_dump \
  --host=localhost \
  --port=5432 \
  --username=$POSTGRES_USER \
  --dbname=$DB_NAME \
  --format=custom \
  --compress=9 \
  --file="$BACKUP_DIR/full_backup_$DATE.dump"

# Backup apenas do schema
pg_dump \
  --host=localhost \
  --port=5432 \
  --username=$POSTGRES_USER \
  --dbname=$DB_NAME \
  --schema-only \
  --format=sql \
  --file="$BACKUP_DIR/schema_backup_$DATE.sql"

# Limpeza de backups antigos (manter 30 dias)
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete

echo "Backup completed: full_backup_$DATE.dump"
```

### 2. Restore Procedures
```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_FILE=$1
DB_NAME="study_space"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh <backup_file>"
  exit 1
fi

# Criar backup do estado atual
echo "Creating safety backup..."
pg_dump --format=custom --file="safety_backup_$(date +%Y%m%d_%H%M%S).dump" $DB_NAME

# Restaurar do backup
echo "Restoring from $BACKUP_FILE..."
pg_restore \
  --host=localhost \
  --port=5432 \
  --username=$POSTGRES_USER \
  --dbname=$DB_NAME \
  --clean \
  --if-exists \
  --verbose \
  $BACKUP_FILE

echo "Restore completed"
```

## Monitoramento e Manutenção

### 1. Scripts de Monitoramento
```sql
-- Verificar saúde do banco
SELECT 
  'Database Size' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value
UNION ALL
SELECT 
  'Active Connections' as metric,
  count(*)::text as value
FROM pg_stat_activity 
WHERE state = 'active'
UNION ALL
SELECT 
  'Slow Queries (>1s)' as metric,
  count(*)::text as value
FROM pg_stat_activity 
WHERE state = 'active' 
AND query_start < now() - interval '1 second';

-- Verificar locks
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

### 2. Jobs de Limpeza
```javascript
// backend/jobs/cleanup.js
import pool from '../config/database.js';

// Limpeza de tokens expirados
const cleanupExpiredTokens = async () => {
  const query = `
    DELETE FROM refresh_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP OR revoked = true
  `;
  
  const result = await pool.query(query);
  console.log(`Cleaned up ${result.rowCount} expired tokens`);
};

// Limpeza de notificações antigas
const cleanupOldNotifications = async () => {
  const query = `
    DELETE FROM notifications 
    WHERE 
      created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
      AND is_read = true
  `;
  
  const result = await pool.query(query);
  console.log(`Cleaned up ${result.rowCount} old notifications`);
};

// Executar limpezas
const runCleanup = async () => {
  try {
    await cleanupExpiredTokens();
    await cleanupOldNotifications();
  } catch (error) {
    console.error('Cleanup job failed:', error);
  }
};

// Agendar para rodar diariamente
export default runCleanup;
```

### 3. Métricas de Performance
```sql
-- View para métricas principais
CREATE VIEW performance_metrics AS
SELECT 
  'total_users' as metric,
  count(*) as value
FROM users
UNION ALL
SELECT 
  'active_connections',
  count(*)
FROM user_connections 
WHERE status = 'accepted'
UNION ALL
SELECT 
  'pending_notifications',
  count(*)
FROM notifications 
WHERE is_read = false
UNION ALL
SELECT 
  'daily_registrations',
  count(*)
FROM users 
WHERE created_at > CURRENT_DATE;
```

## Melhores Práticas

### 1. Segurança
- **Prepared Statements**: sempre usar para evitar SQL injection
- **Princípio do menor privilégio**: usuários específicos para aplicação
- **Backup encriptado**: backups com senha forte
- **Log de auditoria**: para mudanças críticas

### 2. Performance
- **Índices estratégicos**: baseados em queries reais
- **VACUUM e ANALYZE**: manutenção regular
- **Connection pooling**: gerenciar conexões eficientemente
- **Query optimization**: revisar queries lentas regularmente

### 3. Escalabilidade
- **Particionamento**: para tabelas grandes
- **Read replicas**: para distribuir carga de leitura
- **Archiving**: mover dados antigos
- **Monitoring**: métricas contínuas

---

**Última atualização:** Agosto 2025  
**Versão:** 1.0