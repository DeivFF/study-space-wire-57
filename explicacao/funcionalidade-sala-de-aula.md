# Documentação Técnica - Funcionalidade Sala de Estudo

## Visão Geral

A funcionalidade de **Sala de Estudo** é um sistema completo de salas virtuais colaborativas que permite aos usuários criar, participar e gerenciar salas de estudo em tempo real. O sistema inclui chat em tempo real, gerenciamento de membros, feed de atividades e navegação entre salas.

### ⚠️ Mudanças Recentes
- **Removido**: Campo `maxMembers` (quantidade máxima de membros) - salas não têm mais limite de membros
- **Removido**: Campo `types` (tipos de conteúdo suportado) - não há mais restrições de tipo de conteúdo  
- **Removido**: Campo `email` dos dados de usuários/membros - informação considerada irrelevante para a funcionalidade

---

## 1. Estrutura de Arquivos

### 1.1 Arquivos Principais

**Página Principal:**
- `src/pages/Sala.tsx` - Página principal da funcionalidade

**Componentes da Sala:**
- `src/components/Sala/StudyRoomHeader.tsx` - Cabeçalho com controles da sala
- `src/components/Sala/ChatPanel.tsx` - Painel de chat em tempo real
- `src/components/Sala/MembersPanel.tsx` - Painel de gerenciamento de membros
- `src/components/Sala/FeedAndRoomsPanel.tsx` - Feed de atividades e lista de salas
- `src/components/Sala/EmptyRoomState.tsx` - Estado vazio quando não há sala ativa
- `src/components/Sala/CreateRoomModal.tsx` - Modal para criação de salas
- `src/components/Sala/InviteModal.tsx` - Modal para convite de usuários

**Configuração de Rotas:**
- `src/App.tsx` - Rota `/sala` configurada
- `src/components/LeftSidebar.tsx` - Item "Sala" no menu lateral

---

## 2. Modelos de Dados

### 2.1 Modelo de Sala (Room)

```typescript
interface Room {
  id: string;                    // ID único da sala
  name: string;                  // Nome da sala (ex: "Matemática — Álgebra")
  code: string;                  // Código da sala (ex: "#A1")
  description?: string;          // Descrição opcional da sala
  isOwner: boolean;             // Se o usuário atual é o dono
  visibility: "pública" | "privada";  // Visibilidade da sala
  members: number;              // Número atual de membros
  isFavorite?: boolean;         // Se a sala está favoritada pelo usuário
  createdAt?: Date;             // Data de criação
  updatedAt?: Date;             // Data de última atualização
  ownerId?: string;             // ID do proprietário da sala
}
```

### 2.2 Modelo de Membro (Member)

```typescript
interface Member {
  id: string;                   // ID único do membro
  name: string;                 // Nome do usuário
  initials: string;             // Iniciais para avatar (ex: "PA")
  activity: string;             // Atividade atual (ex: "Foco em Português")
  isOnline: boolean;            // Status online/offline
  isHost?: boolean;             // Se é o host/proprietário da sala
  joinedAt?: Date;              // Data de entrada na sala
  avatar?: string;              // URL do avatar do usuário
}
```

### 2.3 Modelo de Mensagem do Chat (ChatMessage)

```typescript
interface ChatMessage {
  id: string;                   // ID único da mensagem
  sender: string;               // Nome do remetente
  senderId?: string;            // ID do usuário remetente
  content: string;              // Conteúdo da mensagem
  timestamp: string;            // Timestamp formatado (ex: "há 2 min")
  isOwn?: boolean;              // Se a mensagem é do usuário atual
  messageType?: "user" | "system"; // Tipo da mensagem
  createdAt?: Date;             // Data/hora de criação
}
```

### 2.4 Modelo de Atividade do Feed (ActivityItem)

```typescript
interface ActivityItem {
  id: string;                   // ID único da atividade
  icon: "check-circle" | "graduation-cap" | "book-open"; // Tipo de ícone
  content: string;              // Conteúdo HTML da atividade
  timestamp: string;            // Timestamp formatado
  userId?: string;              // ID do usuário que executou a ação
  roomId?: string;              // ID da sala onde ocorreu
  activityType?: string;        // Tipo específico da atividade
  createdAt?: Date;             // Data/hora da atividade
}
```

### 2.5 Modelo de Usuário para Convites (InviteUser)

```typescript
interface InviteUser {
  id: string;                   // ID único do usuário
  name: string;                 // Nome completo
  initials: string;             // Iniciais para avatar
  status: "disponível" | "convidado" | "na_sala"; // Status do convite
  invitedAt?: string;           // Timestamp do convite
  avatar?: string;              // URL do avatar
}
```

---

## 3. Endpoints de API Necessários

### 3.1 Gerenciamento de Salas

#### **GET** `/api/rooms`
**Descrição:** Lista todas as salas disponíveis para o usuário
**Query Parameters:**
- `filter` (opcional): "mine" | "all" - filtrar salas próprias ou todas
- `search` (opcional): string - busca por nome da sala
- `page` (opcional): number - paginação
- `limit` (opcional): number - limite de resultados

**Resposta:**
```json
{
  "rooms": [
    {
      "id": "room_123",
      "name": "Matemática — Álgebra",
      "code": "#A1",
      "description": "Sala focada em álgebra linear",
      "visibility": "pública",
      "members": 18,
      "isFavorite": false,
      "isOwner": true,
      "ownerId": "user_456",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

#### **POST** `/api/rooms`
**Descrição:** Cria uma nova sala de estudo
**Body:**
```json
{
  "name": "História — Revolução Francesa",
  "description": "Estudos sobre a revolução francesa",
  "visibility": "pública"
}
```

**Resposta:**
```json
{
  "room": {
    "id": "room_789",
    "name": "História — Revolução Francesa",
    "code": "#H7",
    "description": "Estudos sobre a revolução francesa",
    "visibility": "pública",
    "members": 1,
    "isOwner": true,
    "ownerId": "user_456",
    "createdAt": "2024-01-15T14:20:00Z"
  }
}
```

#### **GET** `/api/rooms/{roomId}`
**Descrição:** Obtém detalhes de uma sala específica
**Resposta:** Objeto Room completo

#### **PUT** `/api/rooms/{roomId}`
**Descrição:** Atualiza configurações da sala (apenas proprietário)
**Body:** Campos atualizáveis do Room

#### **DELETE** `/api/rooms/{roomId}`
**Descrição:** Exclui uma sala (apenas proprietário)

#### **POST** `/api/rooms/{roomId}/join`
**Descrição:** Entra em uma sala existente
**Resposta:**
```json
{
  "success": true,
  "message": "Entrou na sala com sucesso",
  "room": { /* dados da sala */ }
}
```

#### **POST** `/api/rooms/{roomId}/leave`
**Descrição:** Sai de uma sala
**Resposta:**
```json
{
  "success": true,
  "message": "Saiu da sala com sucesso"
}
```

#### **POST** `/api/rooms/{roomId}/favorite`
**Descrição:** Adiciona/remove sala dos favoritos
**Body:**
```json
{
  "isFavorite": true
}
```

### 3.2 Gerenciamento de Membros

#### **GET** `/api/rooms/{roomId}/members`
**Descrição:** Lista membros de uma sala
**Resposta:**
```json
{
  "members": [
    {
      "id": "user_123",
      "name": "Paulo Andrade",
      "initials": "PA",
      "activity": "Foco em Português",
      "isOnline": true,
      "isHost": true,
      "joinedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### **POST** `/api/rooms/{roomId}/invite`
**Descrição:** Convida um usuário para a sala
**Body:**
```json
{
  "userId": "user_789",
  "message": "Convite personalizado opcional"
}
```

#### **DELETE** `/api/rooms/{roomId}/members/{userId}`
**Descrição:** Remove um membro da sala (apenas host)

### 3.3 Sistema de Chat

#### **GET** `/api/rooms/{roomId}/messages`
**Descrição:** Obtém histórico de mensagens
**Query Parameters:**
- `page` (opcional): number - paginação
- `limit` (opcional): number - limite de mensagens (padrão 50)
- `before` (opcional): string - ID da mensagem para carregar anteriores

**Resposta:**
```json
{
  "messages": [
    {
      "id": "msg_123",
      "senderId": "user_456",
      "sender": "Paulo Andrade",
      "content": "Começando os exercícios de álgebra",
      "messageType": "user",
      "createdAt": "2024-01-15T14:30:00Z",
      "isOwn": false
    }
  ],
  "hasMore": true,
  "nextCursor": "msg_122"
}
```

#### **POST** `/api/rooms/{roomId}/messages`
**Descrição:** Envia nova mensagem
**Body:**
```json
{
  "content": "Mensagem a ser enviada"
}
```

**Resposta:**
```json
{
  "message": {
    "id": "msg_124",
    "senderId": "user_456",
    "sender": "Paulo Andrade",
    "content": "Mensagem a ser enviada",
    "messageType": "user",
    "createdAt": "2024-01-15T14:35:00Z",
    "isOwn": true
  }
}
```

### 3.4 Feed de Atividades

#### **GET** `/api/rooms/{roomId}/activities`
**Descrição:** Obtém feed de atividades da sala
**Query Parameters:**
- `limit` (opcional): number - limite de atividades (padrão 20)
- `before` (opcional): string - ID da atividade para carregar anteriores

**Resposta:**
```json
{
  "activities": [
    {
      "id": "act_123",
      "userId": "user_456",
      "icon": "check-circle",
      "content": "Paulo fez o exercício vinculado à aula <b>\"Adjetivos\"</b> e acertou.",
      "activityType": "exercise_completed",
      "createdAt": "2024-01-15T14:20:00Z"
    }
  ],
  "hasMore": true,
  "nextCursor": "act_122"
}
```

### 3.5 Busca de Usuários para Convite

#### **GET** `/api/users/search`
**Descrição:** Busca usuários para convitar
**Query Parameters:**
- `q`: string - termo de busca (nome)
- `roomId`: string - ID da sala (para filtrar usuários já presentes)
- `limit` (opcional): number - limite de resultados

**Resposta:**
```json
{
  "users": [
    {
      "id": "user_789",
      "name": "Maria Silva",
      "initials": "MS",
      "status": "disponível",
      "avatar": "https://example.com/avatar.jpg"
    }
  ]
}
```

---

## 4. Integração WebSocket/Tempo Real

### 4.1 Eventos do Cliente para o Servidor

```javascript
// Entrar em uma sala
socket.emit('join_room', { roomId: 'room_123' });

// Sair de uma sala
socket.emit('leave_room', { roomId: 'room_123' });

// Enviar mensagem
socket.emit('send_message', {
  roomId: 'room_123',
  content: 'Olá pessoal!'
});

// Atualizar status de atividade
socket.emit('update_activity', {
  roomId: 'room_123',
  activity: 'Estudando matemática'
});
```

### 4.2 Eventos do Servidor para o Cliente

```javascript
// Nova mensagem recebida
socket.on('new_message', (data) => {
  // data: ChatMessage
});

// Membro entrou na sala
socket.on('member_joined', (data) => {
  // data: { member: Member, roomId: string }
});

// Membro saiu da sala
socket.on('member_left', (data) => {
  // data: { memberId: string, roomId: string }
});

// Status de membro atualizado
socket.on('member_updated', (data) => {
  // data: { member: Member, roomId: string }
});

// Nova atividade no feed
socket.on('new_activity', (data) => {
  // data: { activity: ActivityItem, roomId: string }
});

// Sala atualizada
socket.on('room_updated', (data) => {
  // data: { room: Room }
});
```

---

## 5. Pontos de Integração com Dados Mockados

### 5.1 Arquivo: `src/pages/Sala.tsx`

**Linhas 11-144:** Dados mockados que devem ser substituídos por chamadas API:

```typescript
// SUBSTITUIR: Dados mockados de membros
const initialMembers = [ /* ... */ ];

// SUBSTITUIR: Dados mockados de mensagens
const initialMessages = [ /* ... */ ];

// SUBSTITUIR: Dados mockados de atividades
const initialActivities = [ /* ... */ ];

// SUBSTITUIR: Dados mockados de salas
const initialRooms = [ /* ... */ ];
```

**Substituir por:**
```typescript
// Usar React Query ou SWR para gerenciar estado
const { data: members } = useQuery(['roomMembers', roomId], () => 
  fetchRoomMembers(roomId)
);

const { data: messages } = useQuery(['roomMessages', roomId], () => 
  fetchRoomMessages(roomId)
);

const { data: activities } = useQuery(['roomActivities', roomId], () => 
  fetchRoomActivities(roomId)
);

const { data: rooms } = useQuery(['userRooms'], () => 
  fetchUserRooms()
);
```

### 5.2 Arquivo: `src/components/Sala/InviteModal.tsx`

**Linhas 28-88:** Dados mockados de usuários para convite:

```typescript
// SUBSTITUIR: Mock data de usuários
const mockUsers: User[] = [ /* ... */ ];
```

**Substituir por:**
```typescript
// Implementar busca dinâmica
const { data: users, refetch } = useQuery(
  ['searchUsers', searchQuery, roomId], 
  () => searchUsersForInvite(searchQuery, roomId),
  { enabled: searchQuery.length >= 2 }
);
```

### 5.3 Funcionalidades que necessitam integração backend:

1. **Persistência de estado da sala atual** (localStorage → banco de dados)
2. **Geração dinâmica de códigos de sala** (função local → API)
3. **Validação de limites de membros** (cliente → servidor)
4. **Sistema de notificações de convites** (mock → real)
5. **Histórico de mensagens persistente** (array local → banco de dados)

---

## 6. Considerações Técnicas

### 6.1 Performance
- Implementar paginação para mensagens antigas
- Usar virtual scrolling para listas grandes de salas
- Cache inteligente com React Query/SWR
- Debounce na busca de usuários

### 6.2 Segurança
- Validar permissões de sala no backend
- Sanitizar mensagens do chat
- Rate limiting para criação de salas e mensagens
- Validação de ownership para operações sensíveis

### 6.3 Escalabilidade
- Usar rooms do Socket.IO para isolar comunicação
- Implementar clustering para WebSockets
- Cache de dados de sala com Redis
- Otimização de queries do banco de dados

### 6.4 UX/UI
- Estados de loading durante operações
- Feedback visual para ações do usuário
- Tratamento de erros de conexão
- Responsividade em dispositivos móveis

---

## 7. Fluxos Principais

### 7.1 Fluxo de Criação de Sala
1. Usuário clica "Criar Sala"
2. Modal aberto com formulário
3. Validação frontend básica
4. POST `/api/rooms` com dados
5. Sala criada, usuário redirecionado
6. Socket.emit('join_room')
7. Interface atualizada com nova sala

### 7.2 Fluxo de Entrada em Sala
1. Usuário clica em sala na lista
2. Verificação de disponibilidade de vagas
3. POST `/api/rooms/{id}/join`
4. Socket.emit('join_room')
5. Interface atualizada
6. Mensagem do sistema no chat
7. Outros membros notificados

### 7.3 Fluxo de Chat em Tempo Real
1. Usuário digita mensagem
2. POST `/api/rooms/{id}/messages`
3. Socket.emit('send_message')
4. Servidor processa e valida
5. Socket broadcast para membros da sala
6. Interface atualizada em tempo real

---

## 8. Próximos Passos para Implementação

1. **Configurar WebSocket/Socket.IO no backend**
2. **Implementar modelos de dados no banco**
3. **Criar endpoints de API listados**
4. **Integrar autenticação JWT nos endpoints**
5. **Substituir dados mockados por chamadas reais**
6. **Implementar sistema de notificações**
7. **Testes de integração e performance**
8. **Deploy e monitoramento**

---

*Documentação gerada para o sistema de salas de estudo colaborativo. Para dúvidas técnicas, consultar os arquivos de implementação frontend listados na seção "Estrutura de Arquivos".*