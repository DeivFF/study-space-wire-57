# Plano de Execução - Sistema de Presença Dinâmica

## Análise do Problema Atual

### Estado Atual (FriendsDropdown.tsx:330:18)
- ✅ **Componente identificado**: `FriendsDropdown.tsx` linha 330
- 🔴 **Status hardcoded**: `Math.random() > 0.5 ? 'online' : 'offline'` (linha 131)
- 🔴 **Nota fake**: `friend.note` gerado com valores aleatórios (linha 132)
- 🔴 **Sem integração com sistema de presença real**

### Recursos Disponíveis Identificados
1. **Backend**: Campo `last_login` na tabela `users` ✅
2. **Socket.io**: Sistema `onlineUsers` no `SocketContext` ✅
3. **WebSocket**: Eventos de presença (`user:online`, `user:offline`) ✅

## Regras de Negócio para Status de Presença

### 🟢 Status Online
- **Condição**: Usuário está na lista `onlineUsers` do SocketContext
- **Indicador Visual**: Bolinha verde
- **Status Text**: "Online"
- **Nota**: "Disponível"

### 🔴 Status Offline  
- **Condição**: Usuário não está online
- **Indicador Visual**: Bolinha cinza
- **Status Text**: "Offline"
- **Nota**: Calculada com base no `last_login`

### ⏰ Cálculo de "Última Vez"
1. **< 1 hora**: "Visto há X minutos"
2. **< 24 horas**: "Visto há X horas"  
3. **< 10 dias**: "Visto há X dias"
4. **> 15 dias**: "Visto há muito tempo"

## Arquitetura da Solução

### Frontend
```
SocketContext ──────► onlineUsers: Set<string>
      │
      ▼
FriendsDropdown ────► Hook personalizado: useUserPresence()
      │                     │
      ▼                     ▼
 renderStatus()       formatLastSeen()
```

### Backend Enhancement
```
API /connections ───► Include last_login field
      │
      ▼
Enhanced user data with presence info
```

## Implementação Detalhada

### 1. Hook Personalizado: `useUserPresence()`

**Localização**: `src/hooks/useUserPresence.tsx`

**Funcionalidades**:
```typescript
interface UserPresenceHook {
  isUserOnline: (userId: string) => boolean;
  getUserStatus: (userId: string, lastLogin?: Date) => UserStatus;
  formatLastSeen: (lastLogin: Date) => string;
}

interface UserStatus {
  status: 'online' | 'offline';
  statusText: string;
  note: string;
  dotColor: string;
}
```

### 2. Utility Functions para Tempo

**Função**: `formatTimeAgo()`
```typescript
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `Visto há ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
  } else if (diffHours < 24) {
    return `Visto há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  } else if (diffDays <= 10) {
    return `Visto há ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
  } else if (diffDays > 15) {
    return 'Visto há muito tempo';
  }
  
  return `Visto há ${diffDays} dias`;
};
```

### 3. Backend API Enhancement

**Arquivo**: `backend/src/routes/connections.js`

**Modificação**: Incluir campo `last_login` na resposta
```javascript
const transformedFriends = data.data.map((connection) => ({
  id: connection.user.id,
  name: connection.user.name,
  nickname: connection.user.nickname,
  avatarUrl: connection.user.avatarUrl,
  lastLogin: connection.user.last_login, // 🆕 Adicionar este campo
  // Remove o status mock
}));
```

### 4. SocketContext Integration

**Arquivo**: `src/contexts/SocketContext.tsx`

**Enhancement**: Expor função para verificar status online
```typescript
interface SocketContextType {
  // ... existing properties
  isUserOnline: (userId: string) => boolean; // 🆕 Adicionar
}

const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};
```

### 5. FriendsDropdown.tsx Modifications

**Substituições principais**:

1. **Remover lógica fake** (linhas 131-133):
```typescript
// ANTES (REMOVER):
status: Math.random() > 0.5 ? 'online' : 'offline',
note: connection.user.status === 'online' ? 'Disponível' : `Última vez há ${Math.floor(Math.random() * 24)}h`

// DEPOIS:
lastLogin: connection.user.last_login ? new Date(connection.user.last_login) : null,
```

2. **Usar hook personalizado**:
```typescript
const { getUserStatus, isUserOnline } = useUserPresence();

const transformedFriends: Friend[] = data.data.map((connection: any) => {
  const userStatus = getUserStatus(connection.user.id, connection.user.last_login);
  
  return {
    id: connection.user.id,
    name: connection.user.name,
    nickname: connection.user.nickname,
    avatarUrl: connection.user.avatarUrl,
    status: userStatus.status,
    note: userStatus.note,
    lastLogin: connection.user.last_login ? new Date(connection.user.last_login) : null,
  };
});
```

3. **Atualizar função de status** (linhas 200-228):
```typescript
const getStatusDot = (status: string) => {
  return status === 'online' ? 'bg-green-500' : 'bg-gray-400';
};

const getStatusLabel = (status: string) => {
  return status === 'online' ? 'Online' : 'Offline';  
};
```

## Plano de Implementação

### Fase 1: Preparação Backend ⚡ (10 min)
1. ✅ **Modificar API connections**: Incluir campo `last_login`
2. ✅ **Testar endpoint**: Verificar se dados chegam corretamente

### Fase 2: Utilities & Hooks 🔧 (15 min)
1. ✅ **Criar `useUserPresence` hook**
2. ✅ **Implementar função `formatTimeAgo`**
3. ✅ **Integrar com SocketContext**

### Fase 3: Frontend Integration 🎨 (20 min)
1. ✅ **Modificar FriendsDropdown.tsx**:
   - Remover lógica fake
   - Integrar hook personalizado
   - Atualizar rendering de status
2. ✅ **Testes visuais**: Verificar indicadores dinâmicos

### Fase 4: Testing & Polish ✨ (10 min)
1. ✅ **Testar cenários**:
   - Usuário online
   - Usuário offline recente
   - Usuário offline antigo (>15 dias)
2. ✅ **Refinamentos visuais**

## Interface Final Esperada

### Usuário Online
```
[Avatar] João Silva        🟢 Online
         Disponível
```

### Usuário Offline (Recente)
```
[Avatar] Maria Santos      ⚪ Offline  
         Visto há 2 horas
```

### Usuário Offline (Antigo)
```
[Avatar] Pedro Costa       ⚪ Offline
         Visto há muito tempo
```

## Considerações Técnicas

### Performance
- **Cache**: Hook usa memoização para evitar recálculos
- **Updates**: Reativa quando `onlineUsers` muda via SocketContext

### Timezone
- **UTC**: Banco armazena em UTC
- **Local**: Frontend converte para timezone local do usuário

### Edge Cases
- **Sem last_login**: Tratar usuários que nunca fizeram login
- **Dados inválidos**: Validação de datas malformadas
- **Socket desconectado**: Fallback para dados cached

## Testing Scenarios

### Cenário 1: Status Online
1. **Setup**: Usuário @Deivin está online
2. **Expected**: 🟢 Verde + "Online" + "Disponível"

### Cenário 2: Offline Recente  
1. **Setup**: Usuário @Deivid fez logout há 30min
2. **Expected**: ⚪ Cinza + "Offline" + "Visto há 30 minutos"

### Cenário 3: Offline Antigo
1. **Setup**: Usuário fez último login há 20 dias
2. **Expected**: ⚪ Cinza + "Offline" + "Visto há muito tempo"

### Cenário 4: Mudança Dinâmica
1. **Setup**: Usuário vai de offline para online
2. **Expected**: Status atualiza automaticamente via WebSocket

## Métricas de Sucesso

- ✅ **Status dinâmico**: Mudanças em tempo real via WebSocket
- ✅ **Precisão temporal**: Cálculos corretos de "última vez"  
- ✅ **Performance**: Sem lags na UI ao mudar status
- ✅ **UX consistente**: Visual intuitivo e informativo

## Próximos Passos (Futuro)

1. **Cache persistence**: Armazenar status offline no localStorage
2. **Presença avançada**: "Digitando...", "Ausente", "Não perturbe"
3. **Notificações**: Alertar quando amigos ficam online
4. **Analytics**: Métricas de tempo online dos usuários