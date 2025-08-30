# API e Backend

## Visão Geral do Backend

O backend do Study Space é uma API REST construída em Node.js com Express, focada em segurança, performance e escalabilidade. Utiliza PostgreSQL como banco de dados e implementa autenticação JWT.

### Stack Tecnológico

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT + bcrypt
- **Validação**: Joi + express-validator
- **Segurança**: Helmet, CORS, Rate Limiting
- **Email**: Nodemailer
- **Tests**: Jest

## Estrutura da API

### Base URL

```
http://localhost:3002/api
```

### Headers Padrão

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>  # Para rotas protegidas
```

## Endpoints de Autenticação

### POST /auth/register

Registra um novo usuário no sistema.

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "senhaSegura123",
  "name": "Nome do Usuário"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "email_verified": true
  },
  "token": "jwt_token_here",
  "refresh_token": "refresh_token_here"
}
```

**Validações:**
- Email deve ser único
- Senha mínimo 8 caracteres
- Nome obrigatório

### POST /auth/login

Autentica usuário existente.

**Request:**
```json
{
  "email": "usuario@example.com", 
  "password": "senhaSegura123"
}
```

**Response (200):**
```json
{
  "token": "jwt_token_here",
  "refresh_token": "refresh_token_here",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "profile_picture": null
  }
}
```

### POST /auth/refresh

Renova token JWT usando refresh token.

**Request:**
```json
{
  "refresh_token": "refresh_token_here"
}
```

**Response (200):**
```json
{
  "token": "new_jwt_token",
  "refresh_token": "new_refresh_token"
}
```

### POST /auth/logout

Faz logout removendo refresh token.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

### POST /auth/request-password-reset

Solicita reset de senha por email.

**Request:**
```json
{
  "email": "usuario@example.com"
}
```

**Response (200):**
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

### POST /auth/reset-password

Redefine senha usando token enviado por email.

**Request:**
```json
{
  "token": "reset_token",
  "new_password": "novaSenhaSegura123"
}
```

## Endpoints de Perfil

### GET /profile

Obtém perfil do usuário autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "usuario@example.com",
  "name": "Nome do Usuário",
  "bio": "Biografia do usuário",
  "profile_picture": "url_da_imagem",
  "university": "Nome da Universidade",
  "course": "Nome do Curso",
  "graduation_year": 2025,
  "study_preferences": ["matematica", "fisica"],
  "privacy_settings": {
    "profile_visibility": "public",
    "show_study_activity": true
  },
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

### PUT /profile

Atualiza perfil do usuário.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Novo Nome",
  "bio": "Nova biografia",
  "university": "Nova Universidade",
  "course": "Novo Curso",
  "graduation_year": 2026,
  "study_preferences": ["quimica", "biologia"],
  "privacy_settings": {
    "profile_visibility": "friends_only",
    "show_study_activity": false
  }
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    // dados atualizados do perfil
  }
}
```

### POST /profile/avatar

Upload de foto de perfil.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `avatar`: arquivo de imagem (max 5MB)

**Response (200):**
```json
{
  "message": "Avatar uploaded successfully",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

## Endpoints de Conexões

### GET /connections

Lista conexões do usuário (amigos).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "connections": [
    {
      "id": "uuid",
      "name": "Nome do Amigo",
      "email": "amigo@example.com",
      "profile_picture": "url_da_imagem",
      "status": "accepted",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 10
}
```

### POST /connections/send

Envia solicitação de conexão.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "target_user_id": "uuid_do_usuario_alvo"
}
```

**Response (201):**
```json
{
  "message": "Connection request sent successfully",
  "request_id": "uuid_da_solicitacao"
}
```

### POST /connections/accept

Aceita solicitação de conexão.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "request_id": "uuid_da_solicitacao"
}
```

**Response (200):**
```json
{
  "message": "Connection request accepted",
  "connection": {
    "id": "uuid",
    "user": {
      "id": "uuid",
      "name": "Nome do Usuário",
      "email": "usuario@example.com"
    }
  }
}
```

### DELETE /connections/:connectionId

Remove conexão existente.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Connection removed successfully"
}
```

### GET /connections/pending

Lista solicitações pendentes.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "pending_requests": [
    {
      "id": "uuid",
      "requester": {
        "id": "uuid", 
        "name": "Nome do Solicitante",
        "profile_picture": "url_da_imagem"
      },
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

## Endpoints de Notificações

### GET /notifications

Lista notificações do usuário.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit`: número de itens (padrão: 20)
- `offset`: offset para paginação (padrão: 0)
- `unread_only`: mostrar apenas não lidas (padrão: false)

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "connection_request",
      "title": "Nova solicitação de conexão",
      "message": "João Silva enviou uma solicitação de conexão",
      "data": {
        "request_id": "uuid",
        "requester_id": "uuid"
      },
      "is_read": false,
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 5,
  "unread_count": 2
}
```

### PUT /notifications/:id/read

Marca notificação como lida.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Notification marked as read"
}
```

### PUT /notifications/read-all

Marca todas as notificações como lidas.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "All notifications marked as read",
  "updated_count": 3
}
```

## Códigos de Status HTTP

### Sucessos (2xx)
- **200 OK**: Requisição bem-sucedida
- **201 Created**: Recurso criado com sucesso
- **204 No Content**: Sucesso sem conteúdo de resposta

### Erros do Cliente (4xx)
- **400 Bad Request**: Dados inválidos na requisição
- **401 Unauthorized**: Token inválido ou ausente
- **403 Forbidden**: Acesso negado
- **404 Not Found**: Recurso não encontrado
- **409 Conflict**: Conflito (ex: email já existe)
- **422 Unprocessable Entity**: Falha de validação
- **429 Too Many Requests**: Rate limit excedido

### Erros do Servidor (5xx)
- **500 Internal Server Error**: Erro interno do servidor

## Estrutura de Respostas de Erro

```json
{
  "error": {
    "message": "Mensagem descritiva do erro",
    "code": "ERROR_CODE",
    "details": {
      "field": "campo específico com erro",
      "validation": "tipo de validação que falhou"
    }
  },
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

### Exemplos de Erros Comuns

**Token Inválido (401):**
```json
{
  "error": {
    "message": "Invalid or expired token",
    "code": "INVALID_TOKEN"
  }
}
```

**Validação de Dados (422):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "email": "Email is required",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

## Autenticação e Autorização

### JWT (JSON Web Token)

**Estrutura do Payload:**
```json
{
  "user_id": "uuid",
  "email": "usuario@example.com", 
  "iat": 1640995200,
  "exp": 1641081600
}
```

**Configuração:**
- **Algoritmo**: HS256
- **Expiração**: 24 horas
- **Refresh Token**: 7 dias

### Middleware de Autenticação

Todas as rotas protegidas verificam:
1. Presença do header `Authorization`
2. Formato `Bearer <token>`
3. Validade do token JWT
4. Existência do usuário no banco

### Rate Limiting

**Configurações por Endpoint:**

| Endpoint | Janela | Max Requests |
|----------|--------|--------------|
| `/auth/login` | 15 min | 5 tentativas |
| `/auth/register` | 15 min | 3 tentativas |
| `/auth/password-reset` | 15 min | 2 tentativas |
| Demais endpoints | 15 min | 100 requests |

## Banco de Dados

### Tabelas Principais

#### users
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
```

#### user_connections
```sql
CREATE TABLE user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(requester_id, target_id)
);
```

#### notifications
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
```

### Migrações

Sistema de migrações sequenciais em `backend/migrations/`:

- `000_create_migrations_tracking.sql`
- `001_create_auth_tables.sql`
- `002_add_name_to_users.sql`
- `003_add_refresh_tokens_table.sql`
- `004_add_onboarding_fields.sql`
- `005_add_profile_fields.sql`
- `006_create_user_connections_table.sql`
- `007_create_notifications_table.sql`

**Executar Migrações:**
```bash
cd backend
bun run migrate
```

## Segurança

### Medidas Implementadas

1. **Helmet**: Headers de segurança
2. **CORS**: Controle de origem
3. **Rate Limiting**: Prevenção de ataques
4. **bcrypt**: Hash seguro de senhas
5. **Validation**: Sanitização de inputs
6. **SQL Injection**: Queries parametrizadas
7. **JWT Secrets**: Chaves fortes e rotativas

### Configurações de Produção

```env
# Usar valores seguros em produção
JWT_SECRET=sua-chave-extremamente-forte-256-bits-aqui
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX_REQUESTS=50
NODE_ENV=production
```

## Monitoramento e Logs

### Logging
- **Morgan**: Logs HTTP estruturados
- **Console.error**: Erros críticos
- **Timestamp**: Todos os logs com timestamp

### Health Check

**GET /health**
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Métricas Recomendadas (Futuro)
- Tempo de resposta das APIs
- Taxa de erro por endpoint
- Uso de CPU e memória
- Conexões ativas do banco

## Desenvolvimento

### Scripts Úteis

```bash
# Desenvolvimento
bun run dev

# Testes
bun run test

# Migrações
bun run migrate

# Limpar usuários
bun run clear-users

# Testar conexão DB
bun run test-connection
```

### Estrutura de Controller

```javascript
// controllers/exampleController.js
import { asyncHandler, AppError } from '../utils/validation.js';
import pool from '../config/database.js';

export const exampleFunction = asyncHandler(async (req, res) => {
  // Lógica do controller
  const { param } = req.body;
  
  // Validação personalizada
  if (!param) {
    throw new AppError('Parameter is required', 400);
  }
  
  // Query no banco
  const result = await pool.query('SELECT * FROM table WHERE param = $1', [param]);
  
  // Resposta
  res.status(200).json({
    message: 'Success',
    data: result.rows
  });
});
```

### Middleware Personalizado

```javascript
// middleware/example.js
export const exampleMiddleware = (req, res, next) => {
  // Lógica do middleware
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
};
```