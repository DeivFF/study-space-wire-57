# 📚 Sistema de Salas de Estudo - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
4. [Permissões e Hierarquia de Roles](#permissões-e-hierarquia-de-roles)
5. [APIs e Endpoints](#apis-e-endpoints)
6. [Funcionalidades por Tipo de Usuário](#funcionalidades-por-tipo-de-usuário)
7. [Regras de Negócio](#regras-de-negócio)
8. [Sistema de Chat](#sistema-de-chat)
9. [Sistema de Convites](#sistema-de-convites)
10. [Sistema de Moderação](#sistema-de-moderação)
11. [Problemas e Limitações](#problemas-e-limitações)
12. [Componentes Frontend](#componentes-frontend)

---

## 🎯 Visão Geral

O sistema de **Salas de Estudo** é uma funcionalidade completa que permite aos usuários criar, gerenciar e participar de salas virtuais para estudos colaborativos. O sistema suporta chat em tempo real, moderação avançada, convites personalizados e controle granular de permissões.

### Características Principais:
- 🏠 Criação e gerenciamento de salas públicas e privadas
- 👥 Sistema hierárquico de roles (Owner → Moderator → Member)
- 💬 Chat em tempo real com WebSockets
- 🎫 Sistema completo de convites e solicitações de acesso
- ⚖️ Ferramentas de moderação avançadas
- 🔒 Controle rigoroso de acesso baseado em amizades
- 📊 Logs de auditoria e moderação

---

## 🏗️ Arquitetura do Sistema

### Backend (Node.js/Express)
- **Controlador**: `backend/src/controllers/roomsController.js` - Lógica principal das salas
- **Rotas**: `backend/src/routes/rooms.js` - Definição de endpoints REST
- **Database**: PostgreSQL com estrutura relacional complexa
- **WebSocket**: Socket.io para comunicação em tempo real

### Frontend (React/TypeScript)
- **Hook Principal**: `src/hooks/useRooms.tsx` - Gerenciamento de estado
- **Página Principal**: `src/pages/Sala.tsx` - Interface principal
- **Componentes**: Diversos componentes especializados em `src/components/Sala/`

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### 1. **rooms** - Salas de Estudo
```sql
id                 uuid PRIMARY KEY
name               text NOT NULL (3-50 caracteres)
description        text (máx 200 caracteres)
visibility         room_visibility NOT NULL DEFAULT 'public'
code               text UNIQUE NOT NULL (formato: #XXXX)
owner_id           uuid REFERENCES users(id)
max_members        integer DEFAULT 10
current_members    integer DEFAULT 0
is_active          boolean DEFAULT true
created_at         timestamp
updated_at         timestamp
last_activity      timestamp
```

**Constraints:**
- Nome deve ter entre 3-50 caracteres
- Código único no formato `#[A-Z0-9]{2,4}`
- Máximo de membros deve ser > 0
- Contador de membros automaticamente atualizado via trigger

#### 2. **room_members** - Membros das Salas
```sql
room_id               uuid REFERENCES rooms(id)
user_id               uuid REFERENCES users(id)
role                  room_member_role DEFAULT 'member'
is_favorite           boolean DEFAULT false
is_silenced           boolean DEFAULT false
notifications_enabled boolean DEFAULT true
joined_at             timestamp
last_seen_at          timestamp
```

**Roles Hierárquicos:**
- `owner` - Proprietário (apenas 1 por sala)
- `moderator` - Moderador (múltiplos permitidos)
- `member` - Membro comum

#### 3. **room_conversations** - Chat das Salas
```sql
room_id         uuid REFERENCES rooms(id) PRIMARY KEY
conversation_id uuid REFERENCES conversations(id) UNIQUE
created_at      timestamp
```

#### 4. **room_invitations** - Sistema de Convites
```sql
id           uuid PRIMARY KEY
room_id      uuid REFERENCES rooms(id)
inviter_id   uuid REFERENCES users(id)
invitee_id   uuid REFERENCES users(id)
status       invitation_status DEFAULT 'pending'
message      text
created_at   timestamp
expires_at   timestamp DEFAULT (NOW() + '7 days')
responded_at timestamp
```

**Status de Convite:**
- `pending` - Aguardando resposta
- `accepted` - Aceito
- `declined` - Recusado
- `expired` - Expirado

#### 5. **room_access_requests** - Solicitações de Acesso
```sql
id          uuid PRIMARY KEY
room_id     uuid REFERENCES rooms(id)
user_id     uuid REFERENCES users(id)
status      access_request_status DEFAULT 'pending'
message     text
created_at  timestamp
reviewed_by uuid REFERENCES users(id)
reviewed_at timestamp
```

#### 6. **room_invite_links** - Links de Convite
```sql
id           uuid PRIMARY KEY
room_id      uuid REFERENCES rooms(id)
created_by   uuid REFERENCES users(id)
code         text UNIQUE
is_active    boolean DEFAULT true
max_uses     integer
current_uses integer DEFAULT 0
expires_at   timestamp
created_at   timestamp
last_used_at timestamp
```

#### 7. **room_moderation_logs** - Logs de Moderação
```sql
id             uuid PRIMARY KEY
room_id        uuid REFERENCES rooms(id)
moderator_id   uuid REFERENCES users(id)
target_user_id uuid REFERENCES users(id)
action         moderation_action
reason         text
metadata       jsonb
created_at     timestamp
```

**Ações de Moderação:**
- `kick` - Expulsão
- `promote` - Promoção
- `demote` - Rebaixamento
- `mute` - Silenciar
- `unmute` - Dessilenciar

### Enums do Sistema

#### room_visibility
- `public` - Sala pública (visível para amigos)
- `private` - Sala privada (apenas por convite)

#### room_member_role
- `owner` - Proprietário
- `moderator` - Moderador
- `member` - Membro

---

## 🔐 Permissões e Hierarquia de Roles

### 👑 Owner (Proprietário)
**Permissões Exclusivas:**
- Excluir a sala completamente
- Transferir propriedade (automático ao sair)
- Promover membros a moderador
- Rebaixar moderadores a membro
- Todas as permissões de moderador

### 🛡️ Moderator (Moderador) 
**Permissões:**
- Convidar novos membros
- Expulsar membros comuns (não outros moderadores)
- Aprovar/rejeitar solicitações de acesso
- Criar links de convite
- Gerenciar chat da sala
- Silenciar/dessilenciar membros

### 👤 Member (Membro)
**Permissões:**
- Participar do chat
- Sair da sala voluntariamente
- Favoritar a sala
- Visualizar outros membros

---

## 📡 APIs e Endpoints

### Endpoint Base: `/api/rooms`

#### Salas - CRUD Principal
```http
POST   /                           # Criar sala
GET    /                           # Listar salas
POST   /:roomId/join               # Entrar em sala
DELETE /:roomId                    # Excluir sala
POST   /:roomId/leave              # Sair da sala
PATCH  /:roomId/favorite           # Favoritar/desfavoritar
GET    /:roomId/members            # Listar membros
```

#### Sistema de Convites
```http
POST   /:roomId/invites            # Enviar convite
GET    /:roomId/invites            # Listar convites pendentes
DELETE /:roomId/invites/:inviteId  # Revogar convite
POST   /invites/:inviteId/accept   # Aceitar convite
POST   /invites/:inviteId/reject   # Rejeitar convite
```

#### Solicitações de Acesso
```http
POST   /:roomId/request-access                    # Solicitar acesso
GET    /:roomId/access-requests                   # Listar solicitações
POST   /:roomId/access-requests/:requestId/approve # Aprovar solicitação
POST   /:roomId/access-requests/:requestId/reject  # Rejeitar solicitação
```

#### Links de Convite
```http
POST   /:roomId/invite-links        # Criar link de convite
GET    /:roomId/invite-links/active # Obter link ativo
```

#### Moderação
```http
POST   /:roomId/members/:memberId/promote  # Promover membro
POST   /:roomId/members/:memberId/demote   # Rebaixar moderador
POST   /:roomId/members/:memberId/kick     # Expulsar membro
```

#### Chat da Sala
```http
GET    /:roomId/messages  # Buscar mensagens
POST   /:roomId/messages  # Enviar mensagem
```

---

## 👥 Funcionalidades por Tipo de Usuário

### 🌟 Usuário Não-Membro

**Pode:**
- ❌ Visualizar salas públicas (apenas de amigos)
- ❌ Solicitar acesso a salas privadas
- ❌ Entrar em salas via convite ou link

**Não Pode:**
- ❌ Ver membros ou chat
- ❌ Criar salas (precisa estar logado)

### 👤 Membro Comum

**Pode:**
- ✅ Participar do chat em tempo real
- ✅ Ver lista de membros
- ✅ Sair da sala a qualquer momento
- ✅ Favoritar a sala
- ✅ Visualizar atividades da sala

**Não Pode:**
- ❌ Convidar outros usuários
- ❌ Expulsar outros membros
- ❌ Alterar configurações da sala
- ❌ Ver solicitações de acesso

### 🛡️ Moderador

**Pode (além das permissões de membro):**
- ✅ Convidar novos membros
- ✅ Expulsar membros comuns
- ✅ Aprovar/rejeitar solicitações de acesso
- ✅ Criar e gerenciar links de convite
- ✅ Silenciar/dessilenciar outros membros

**Não Pode:**
- ❌ Expulsar outros moderadores
- ❌ Promover/rebaixar outros usuários
- ❌ Excluir a sala
- ❌ Alterar configurações da sala

### 👑 Proprietário (Owner)

**Pode (todas as permissões anteriores mais):**
- ✅ Excluir a sala completamente
- ✅ Promover membros a moderador
- ✅ Rebaixar moderadores a membro
- ✅ Expulsar qualquer membro (incluindo moderadores)
- ✅ Alterar configurações da sala
- ✅ Transferir propriedade (automático ao sair)

---

## ⚖️ Regras de Negócio

### 🏠 Criação de Salas

1. **Validações:**
   - Nome: 3-50 caracteres obrigatório
   - Descrição: Máximo 200 caracteres (opcional)
   - Código único gerado automaticamente no formato `#XXXX`

2. **Processo:**
   - Usuário criador torna-se owner automaticamente
   - Sala criada com conversa associada
   - Owner adicionado como participante da conversa
   - Rate limit: máximo 5 salas por 15 minutos

### 🚪 Acesso a Salas

#### Salas Públicas:
- Apenas **amigos** do proprietário podem visualizar
- Entrada automática para amigos
- Solicitação de amizade necessária para não-amigos

#### Salas Privadas:
- Invisíveis para não-membros
- Acesso apenas por convite direto
- Aprovação do owner/moderator obrigatória

### 👥 Gerenciamento de Membros

#### Entrada:
- Verificação de amizade com owner
- Adição automática ao chat da sala
- Notificação via WebSocket

#### Saída:
- Membros podem sair voluntariamente
- Expulsão por moderadores/owner
- Transferência de propriedade automática

#### Transferência de Propriedade (quando owner sai):
1. **Prioridade 1:** Moderador mais antigo
2. **Prioridade 2:** Membro mais antigo
3. **Sem membros:** Sala desativada

### 💬 Sistema de Chat

- Mensagens em tempo real via WebSocket
- Suporte a respostas (reply)
- Tipos: text, image, file, system
- Histórico persistente no banco
- Notificações de digitação

### 🎫 Sistema de Convites

#### Convite Direto:
- Enviado por moderadores/owners
- Notificação em tempo real
- Expiração em 7 dias
- Estado: pending → accepted/declined/expired

#### Links de Convite:
- Criados por moderadores/owners
- Configuráveis (expiração, máximo de usos)
- Apenas um link ativo por sala
- Desativação automática do link anterior

#### Solicitações de Acesso:
- Para salas privadas sem convite
- Mensagem opcional do solicitante
- Aprovação/rejeição por moderadores/owners

---

## 💬 Sistema de Chat

### Características:
- **Tempo Real:** WebSocket com Socket.io
- **Persistência:** Mensagens armazenadas no PostgreSQL
- **Tipos de Mensagem:** text, image, file, system
- **Respostas:** Sistema de reply para outras mensagens
- **Paginação:** Carregamento de histórico por lotes

### Estrutura de Mensagem:
```typescript
interface RoomMessage {
  id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  sender_id: string;
  sender_name: string;
  sender_email: string;
  reply_to_id?: string;
  reply_to?: {
    id: string;
    content: string;
    sender_name: string;
  };
  created_at: string;
  updated_at: string;
}
```

### WebSocket Events:
- `room:new_message` - Nova mensagem recebida
- `room:typing_start` - Usuário começou a digitar
- `room:typing_stop` - Usuário parou de digitar

---

## 🔧 Sistema de Moderação

### Ações Disponíveis:

#### Promoção/Rebaixamento:
- `promote`: Member → Moderator (apenas Owner)
- `demote`: Moderator → Member (apenas Owner)

#### Controle de Membros:
- `kick`: Expulsar membro (Owner/Moderator)
  - Moderador não pode expulsar outro moderador
  - Remove da sala e conversa
  - Limpa convites pendentes

#### Sistema de Logs:
- Todas as ações registradas em `room_moderation_logs`
- Inclui: quem fez, quando, em quem, que ação
- Metadata adicional em formato JSON

### WebSocket Events para Moderação:
- `room:member_role_changed` - Mudança de role
- `room:role_updated` - Atualização do próprio role
- `room:ownership_transferred` - Transferência de propriedade
- `room:deleted` - Sala excluída
- `room:removed_from_room` - Removido da sala

---

## ⚠️ Problemas e Limitações

### 🐛 Bugs Conhecidos:

#### 1. **Rate Limiting**
- **Local:** `backend/src/routes/rooms.js:9-24`
- **Problema:** Rate limiting configurado mas pode ser inconsistente
- **Status:** ⚠️ Requer monitoramento

#### 2. **Validação de Amizade**
- **Local:** `roomsController.js:260-301`
- **Problema:** Verificação de amizade aplicada tanto para salas públicas quanto privadas
- **Status:** ⚠️ Possível over-engineering

#### 3. **Transferência de Propriedade**
- **Local:** `roomsController.js:1812-1926`
- **Problema:** Lógica complexa com múltiplos cenários
- **Status:** ⚠️ Precisa de testes extensivos

#### 4. **WebSocket Race Conditions**
- **Local:** `useRooms.tsx:804-964`
- **Problema:** Múltiplos listeners podem causar conflitos
- **Status:** 🔧 Requer refatoração

### 📋 Funcionalidades Mal Acabadas:

#### 1. **Sistema de Notificações Push**
- **Status:** 🚧 Parcialmente implementado
- **Faltando:** Notificações para mobile, configurações de usuário

#### 2. **Links de Convite**
- **Status:** 🚧 Backend completo, frontend básico
- **Faltando:** Interface avançada, configurações de expiração

#### 3. **Moderação Avançada**
- **Status:** 🚧 Funcionalidade básica
- **Faltando:** Silenciar usuários, timeouts temporários, warnings

#### 4. **Analytics da Sala**
- **Status:** 🚧 Estrutura criada
- **Faltando:** Relatórios, estatísticas de uso, métricas de engajamento

#### 5. **Sistema de Arquivos**
- **Status:** 🚧 Estrutura para files no chat
- **Faltando:** Upload de arquivos, preview de imagens

### 🔒 Limitações de Segurança:

#### 1. **Validação de Input**
- XSS protection básica
- Falta validação robusta de arquivos
- Rate limiting pode ser burlado

#### 2. **Autorização**
- Verificação de permissões em cada endpoint
- Falta middleware centralizado de autorização
- Possíveis race conditions em mudanças de role

#### 3. **Auditoria**
- Logs básicos implementados
- Falta rastreamento completo de ações sensíveis
- Não há sistema de backup/recovery de mensagens

---

## 🧩 Componentes Frontend

### Arquivos Principais:

#### 1. **Sala.tsx** - Página Principal
- **Local:** `src/pages/Sala.tsx`
- **Função:** Interface principal do sistema de salas
- **Estado:** ✅ Funcional
- **Características:**
  - Gerenciamento de estado da sala atual
  - Integração com WebSocket
  - Roteamento dinâmico por roomId
  - Layout responsivo

#### 2. **useRooms.tsx** - Hook Principal
- **Local:** `src/hooks/useRooms.tsx`
- **Função:** Gerenciamento de estado e API calls
- **Estado:** ✅ Funcional
- **Características:**
  - React Query para cache
  - WebSocket integration
  - Type-safe interfaces
  - Error handling

#### 3. **StudyRoomHeader.tsx** - Cabeçalho
- **Local:** `src/components/Sala/StudyRoomHeader.tsx`
- **Estado:** ✅ Funcional
- **Funcionalidades:**
  - Botões de ação baseados em permissões
  - Copiar link da sala
  - Modais de confirmação

#### 4. **MembersPanel.tsx** - Lista de Membros
- **Local:** `src/components/Sala/MembersPanel.tsx`
- **Estado:** ✅ Funcional
- **Funcionalidades:**
  - Lista de membros com roles
  - Busca de membros
  - Ações de moderação
  - Status online/offline

#### 5. **GroupChat.tsx** - Chat da Sala
- **Local:** `src/components/Sala/GroupChat.tsx`
- **Estado:** ✅ Funcional
- **Funcionalidades:**
  - Mensagens em tempo real
  - Sistema de reply
  - Indicador de digitação

#### 6. **CreateRoomModal.tsx** - Criação de Sala
- **Estado:** ✅ Funcional
- **Funcionalidades:**
  - Formulário de criação
  - Validação de input
  - Seleção de visibilidade

#### 7. **InviteModal.tsx** - Sistema de Convites
- **Estado:** ✅ Funcional
- **Funcionalidades:**
  - Busca de usuários
  - Envio de convites
  - Lista de convites pendentes

---

## 📊 Métricas e Performance

### Database Indexes:
- **rooms:** Indexes em código, nome, owner_id, visibilidade
- **room_members:** Indexes em user_id, role, favoritos
- **messages:** Index composto em conversation_id + created_at

### Otimizações:
- Paginação em listas de membros e mensagens
- Rate limiting configurado
- Triggers para atualização automática de contadores
- Cache no frontend via React Query

### Limites Configurados:
- **Membros por sala:** 10 (configurável)
- **Nome da sala:** 3-50 caracteres
- **Descrição:** Máximo 200 caracteres
- **Mensagens por request:** 50
- **Convites por usuário:** Rate limited
- **Salas criadas:** Máximo 5 por 15 minutos

---

## 🚀 Próximos Passos Recomendados

### Alta Prioridade:
1. **Completar sistema de notificações**
2. **Implementar upload de arquivos no chat**
3. **Adicionar testes automatizados**
4. **Melhorar tratamento de erros**

### Média Prioridade:
1. **Sistema de moderação avançado**
2. **Analytics e métricas da sala**
3. **Interface para links de convite**
4. **Sistema de backup de mensagens**

### Baixa Prioridade:
1. **Temas personalizados para salas**
2. **Sistema de badges/conquistas**
3. **Integração com calendário**
4. **Bot de sala automatizado**

---

**📅 Última Atualização:** Setembro 2024  
**📝 Versão:** 1.0  
**🔧 Status:** Funcional com limitações documentadas