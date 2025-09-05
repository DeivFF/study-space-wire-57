# Plano de Execução: Sistema de Adicionar Amigo
**Data:** Agosto 2025  
**Versão:** 1.0  
**Projeto:** Study Space  

## 📋 Resumo Executivo

### Problema Identificado
Durante análise técnica, foram identificados múltiplos problemas no sistema de amigos:
- **WebSocket Error**: Conexão websocket falhando (arquivo: `hook.js:608`)
- **API Fetch Failures**: Falhas em `fetchFriends`, `fetchProfile` e `usePosts`
- **Funcionalidade Incompleta**: Botão "Adicionar amigo" não funcional
- **Inconsistências Backend/Frontend**: Discrepâncias entre implementação backend e frontend

### Objetivo
Implementar um sistema completo e funcional de adição de amigos que garanta:
- Consistência entre backend e frontend
- Experiência de usuário fluida
- Sistema robusto de notificações
- Funcionalidade completa de amizade

## 🎯 Escopo do Projeto

### Funcionalidades Principais
1. **Adicionar Amigo**: Envio e recebimento de solicitações
2. **Gerenciar Solicitações**: Aceitar/Rejeitar/Cancelar
3. **Sistema de Busca**: Encontrar usuários por nome/nickname
4. **Notificações**: Tempo real para solicitações
5. **Interface Amigos**: Listar amigos e solicitações
6. **WebSocket**: Correção da conectividade

### Funcionalidades Secundárias
- Sistema de bloqueio/desbloqueio
- Status online/offline dos amigos
- Estatísticas de conexões
- Histórico de interações

## 👥 Equipe de Agentes Responsáveis

### 🏗️ Tech Lead
**Responsabilidade:** Coordenação arquitetural e decisões técnicas
- Definir arquitetura do sistema
- Resolver conflitos técnicos entre frontend/backend
- Garantir escalabilidade e performance
- Code review final de todos os componentes

### 🔧 Backend Developer
**Responsabilidade:** APIs e lógica de negócio
- Implementar/corrigir endpoints de conexões
- Resolver problemas de autenticação JWT
- Configurar WebSocket/Socket.io no servidor
- Otimizar queries de banco de dados
- Implementar sistema de notificações

### ⚛️ Frontend Developer
**Responsabilidade:** Interface e experiência do usuário
- Implementar componentes de UI para amigos
- Corrigir hooks de fetching de dados
- Integrar WebSocket no cliente
- Implementar estados de loading/error
- Criar formulários de busca e gerenciamento

### 🗄️ Database Engineer
**Responsabilidade:** Estrutura de dados
- Validar/corrigir schema de user_connections
- Otimizar índices para performance
- Implementar constraints de integridade
- Criar queries otimizadas para listagem de amigos

### 📊 Product Manager
**Responsabilidade:** Requisitos e UX
- Definir fluxos de usuário
- Especificar critérios de aceitação
- Priorizar funcionalidades
- Validar experiência do usuário

### 🎨 UI/UX Designer
**Responsabilidade:** Design e usabilidade
- Criar wireframes para telas de amigos
- Definir componentes de UI
- Garantir acessibilidade
- Definir micro-interações e feedbacks

### 🧪 QA Engineer
**Responsabilidade:** Qualidade e testes
- Criar cenários de teste
- Testes de integração API
- Testes de UI automatizados
- Validação de performance

### 🚀 DevOps Engineer
**Responsabilidade:** Infraestrutura e deploy
- Configurar WebSocket em produção
- Monitoramento de APIs
- Configurar logs e métricas
- Otimizar infraestrutura para real-time

## 🏗️ Análise Técnica Atual

### Backend - Estado Atual ✅ (Funcional)
**Estrutura Existente:**
```
backend/src/controllers/connectionsController.js - ✅ Completo
backend/src/routes/connections.js - ✅ Implementado
backend/migrations/006_create_user_connections_table.sql - ✅ Schema OK
```

**Endpoints Disponíveis:**
- `POST /api/connections` - Enviar solicitação ✅
- `GET /api/connections/search` - Buscar usuários ✅
- `GET /api/connections/requests` - Listar solicitações ✅
- `PUT /api/connections/:id` - Aceitar/Rejeitar ✅
- `DELETE /api/connections/:id` - Remover conexão ✅
- `GET /api/connections` - Listar amigos ✅
- `POST /api/connections/block` - Bloquear usuário ✅

**Problemas Identificados:**
- ❌ Socket.io não implementado no backend
- ⚠️ Inconsistência na estrutura de autenticação (userId vs user.id)
- ⚠️ Falta sistema de notificações em tempo real

### Frontend - Estado Atual ❌ (Incompleto)
**Problemas Críticos:**
```typescript
// RightSidebar.tsx:55 - Erro no fetch friends
const response = await fetch('http://localhost:3002/api/connections?status=accepted', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// Perfil.tsx:82 - Erro no fetch profile  
const response = await fetch(apiEndpoint, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

// usePosts.tsx:76 - Erro no fetch posts
const response = await fetch(endpoint, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

**Componentes Existentes:**
- `RightSidebar.tsx` - Parcialmente funcional ⚠️
- `Perfil.tsx` - Botão "Adicionar amigo" não funcional ❌
- `SocketContext.tsx` - Implementado mas com erros ❌

## 🔍 Identificação de Problemas

### 1. Problemas WebSocket
**Erro:** `hook.js:608 WebSocket connection error: websocket error`

**Análise:**
- Frontend tenta conectar via Socket.io
- Backend não possui implementação Socket.io
- Necessário implementar servidor Socket.io

### 2. Problemas de Autenticação
**Inconsistências identificadas:**
```javascript
// Backend expectativa: req.user.userId
const requesterId = req.user.userId;

// Frontend enviando: req.user.id (possível inconsistência no middleware)
```

### 3. Problemas de API Fetch
**Pattern de erro comum:**
- Todas APIs retornando "Failed to fetch"
- Possível problema de CORS
- Token JWT pode estar inválido/expirado
- Caso o Token expire, o usuário precisa ser redirecionado automaticamente para fazer login novamente.

### 4. Problemas de UI
- Botão "Adicionar amigo" não possui handler
- Sugestões de amigos são hardcoded
- Estados de loading/error não implementados

## 📋 Plano de Implementação

### FASE 1: Correções Críticas (Prioridade Alta)
**Responsáveis:** Backend Developer + Tech Lead  
**Prazo:** 3 dias  

#### 1.1 Implementar Socket.io no Backend
```javascript
// backend/src/server.js
import { Server } from 'socket.io';
import http from 'http';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    credentials: true
  }
});

// Implementar autenticação Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Validar JWT
});
```

#### 1.2 Corrigir Middleware de Autenticação
```javascript
// Verificar consistência entre userId e id
export const authenticateToken = async (req, res, next) => {
  // Garantir que req.user tenha tanto userId quanto id
  req.user = {
    id: decoded.user_id,
    userId: decoded.user_id, // Para compatibilidade
    email: decoded.email
  };
};
```

#### 1.3 Configurar CORS Adequadamente
```javascript
app.use(cors({
  origin: ['http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
```

### FASE 2: Sistema de Notificações (Prioridade Alta)
**Responsáveis:** Backend Developer + Frontend Developer  
**Prazo:** 2 dias  

#### 2.1 Implementar Eventos Socket.io
```javascript
// Backend events
socket.on('user:connect', () => {
  socket.join(`user:${userId}`);
  socket.broadcast.emit('user:online', { userId });
});

socket.on('friend:request', (data) => {
  io.to(`user:${data.receiverId}`).emit('notification:friend_request', {
    type: 'friend_request',
    from: userData,
    timestamp: Date.now()
  });
});
```

#### 2.2 Atualizar SocketContext Frontend
```typescript
// src/contexts/SocketContext.tsx
useEffect(() => {
  socket?.on('notification:friend_request', (notification) => {
    // Atualizar estado de notificações
    // Mostrar toast/popup
  });
}, [socket]);
```

### FASE 3: Interface de Usuário (Prioridade Média)
**Responsáveis:** Frontend Developer + UI/UX Designer  
**Prazo:** 4 dias  

#### 3.1 Criar Componente de Busca de Amigos
```typescript
// src/components/Friends/UserSearch.tsx
export const UserSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const { mutate: sendFriendRequest } = useMutation({
    mutationFn: (userId: string) => api.post('/api/connections', { receiverId: userId }),
    onSuccess: () => toast.success('Solicitação enviada!')
  });
};
```

#### 3.2 Implementar Lista de Solicitações
```typescript
// src/components/Friends/FriendRequests.tsx
export const FriendRequests = () => {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: () => api.get('/api/connections/requests')
  });

  const { mutate: respondToRequest } = useMutation({
    mutationFn: ({ id, action }: { id: string, action: 'accept' | 'reject' }) =>
      api.put(`/api/connections/${id}`, { action })
  });
};
```

#### 3.3 Corrigir RightSidebar
```typescript
// src/components/Feed/RightSidebar.tsx
const { data: friends, isLoading, error } = useQuery({
  queryKey: ['friends'],
  queryFn: () => api.get('/api/connections?status=accepted'),
  staleTime: 5 * 60 * 1000
});
```

### FASE 4: Página de Amigos Completa (Prioridade Média)
**Responsáveis:** Frontend Developer + Product Manager  
**Prazo:** 3 dias  

#### 4.1 Implementar Página Amigos
```typescript
// src/pages/Amigos.tsx
export default function Amigos() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Tabs defaultValue="friends">
        <TabsList>
          <TabsTrigger value="friends">Meus Amigos</TabsTrigger>
          <TabsTrigger value="requests">Solicitações</TabsTrigger>
          <TabsTrigger value="search">Buscar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends">
          <FriendsList />
        </TabsContent>
        
        <TabsContent value="requests">
          <FriendRequests />
        </TabsContent>
        
        <TabsContent value="search">
          <UserSearch />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### FASE 5: Otimizações e Polimento (Prioridade Baixa)
**Responsáveis:** Tech Lead + QA Engineer + DevOps  
**Prazo:** 2 dias  

#### 5.1 Implementar Cache e Otimizações
```typescript
// Cache de amigos com React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000
    }
  }
});
```

#### 5.2 Testes Automatizados
```typescript
// src/components/__tests__/FriendRequests.test.tsx
describe('FriendRequests', () => {
  it('should display friend requests correctly', async () => {
    // Teste de componente
  });
  
  it('should handle accept/reject actions', async () => {
    // Teste de interações
  });
});
```

## 🔄 Fluxos de Usuário

### Fluxo 1: Adicionar Amigo por Busca
```
1. [Frontend] Usuário acessa aba "Buscar" em /amigos
2. [Frontend] Usuário digita nome/nickname na busca
3. [Backend] API GET /api/connections/search?query=nome
4. [Frontend] Exibe resultados com botão "Adicionar"
5. [Frontend] Usuário clica em "Adicionar amigo"
6. [Backend] API POST /api/connections { receiverId }
7. [Backend] Socket.io emite notificação para receptor
8. [Frontend] Toast de sucesso + atualiza interface
```

### Fluxo 2: Adicionar Amigo pelo Perfil
```
1. [Frontend] Usuário acessa perfil de outro usuário
2. [Frontend] Clica em "Adicionar amigo" (implementar handler)
3. [Backend] API POST /api/connections { receiverId }
4. [Backend] Socket.io emite notificação para receptor
5. [Frontend] Botão muda para "Solicitação Enviada"
6. [Frontend] Toast de confirmação
```

### Fluxo 3: Responder Solicitação
```
1. [Backend] Socket.io recebe notificação de nova solicitação
2. [Frontend] Mostra notificação em tempo real
3. [Frontend] Usuário acessa aba "Solicitações"
4. [Frontend] Vê lista de solicitações pendentes
5. [Frontend] Clica em "Aceitar" ou "Rejeitar"
6. [Backend] API PUT /api/connections/:id { action }
7. [Backend] Socket.io emite confirmação para ambos usuários
8. [Frontend] Atualiza listas de amigos/solicitações
```

## 🐛 Identificação de Bugs Potenciais

### Bug Crítico 1: WebSocket Connection
**Problema:** Frontend tenta conectar Socket.io mas backend não implementado
**Impacto:** Alto - Sistema de tempo real não funciona
**Solução:** Implementar Socket.io no backend

### Bug Crítico 2: API Authentication
**Problema:** Inconsistência no middleware de autenticação
**Impacto:** Alto - APIs retornam 401/403 incorretamente
**Solução:** Padronizar estrutura req.user

### Bug Médio 1: CORS Configuration
**Problema:** Possível configuração inadequada de CORS
**Impacto:** Médio - Requests bloqueados pelo browser
**Solução:** Configurar CORS corretamente

### Bug Médio 2: Error Handling
**Problema:** Falta tratamento de erros consistente
**Impacto:** Médio - UX ruim em casos de erro
**Solução:** Implementar error boundaries e tratamento

### Bug Baixo 1: Loading States
**Problema:** Estados de loading não implementados
**Impacto:** Baixo - UX sub-ótima
**Solução:** Implementar skeletons e spinners

### Bug Baixo 2: Data Stale
**Problema:** Dados não atualizados em tempo real
**Impacto:** Baixo - Informações desatualizadas
**Solução:** Implementar cache invalidation

## 🧪 Estratégia de Testes

### Testes Backend
```javascript
// Testes de API
describe('Connections API', () => {
  test('POST /api/connections - should send friend request', async () => {
    const response = await request(app)
      .post('/api/connections')
      .set('Authorization', `Bearer ${token}`)
      .send({ receiverId: 'user-id' })
      .expect(201);
  });
});

// Testes Socket.io
describe('Socket.io Events', () => {
  test('should emit friend request notification', (done) => {
    clientSocket.emit('friend:request', data);
    serverSocket.on('notification:friend_request', (notification) => {
      expect(notification.type).toBe('friend_request');
      done();
    });
  });
});
```

### Testes Frontend
```typescript
// Testes de Componente
describe('FriendRequests Component', () => {
  test('should render friend requests correctly', async () => {
    render(<FriendRequests />);
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });
  });
  
  test('should handle accept friend request', async () => {
    const user = userEvent.setup();
    render(<FriendRequests />);
    
    const acceptButton = screen.getByRole('button', { name: /aceitar/i });
    await user.click(acceptButton);
    
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({ id: 'req-id', action: 'accept' });
    });
  });
});

// Testes de Hook
describe('useSocket Hook', () => {
  test('should connect to socket server', () => {
    const { result } = renderHook(() => useSocket(), {
      wrapper: SocketProvider
    });
    
    expect(result.current.isConnected).toBe(true);
  });
});
```

### Testes de Integração
```typescript
// Teste End-to-End
describe('Friend System E2E', () => {
  test('complete friend request flow', async () => {
    // 1. Login como usuário A
    await page.goto('/login');
    await page.fill('[name="email"]', 'userA@test.com');
    
    // 2. Buscar usuário B
    await page.goto('/amigos');
    await page.click('[data-tab="search"]');
    await page.fill('[name="query"]', 'User B');
    
    // 3. Enviar solicitação
    await page.click('[data-testid="add-friend-btn"]');
    await expect(page.locator('.toast')).toContainText('Solicitação enviada');
    
    // 4. Login como usuário B
    await page.context().newPage();
    // ... continuar fluxo
  });
});
```

## 📊 Métricas de Sucesso

### Métricas Técnicas
- **Uptime WebSocket:** > 99%
- **Response Time API:** < 200ms (p95)
- **Error Rate:** < 1%
- **Test Coverage:** > 85%

### Métricas de UX
- **Tempo para Adicionar Amigo:** < 5 segundos
- **Notificações em Tempo Real:** < 1 segundo delay
- **Taxa de Sucesso:** > 95%
- **Abandono de Fluxo:** < 10%

### Métricas de Negócio
- **Adoção Funcionalidade:** > 70% usuários ativos
- **Conexões por Usuário:** Média > 5
- **Retenção:** +15% após implementação
- **Satisfação:** > 4.5/5 stars

## ⚠️ Riscos e Mitigações

### Risco Alto: Complexidade Socket.io
**Impacto:** Atraso no desenvolvimento
**Mitigação:** Implementar versão simplificada primeiro, depois evoluir

### Risco Médio: Performance com Muitos Usuários
**Impacto:** Degradação de performance
**Mitigação:** Implementar rate limiting e otimização de queries

### Risco Baixo: Compatibilidade Browser
**Impacto:** Funcionalidade não disponível em alguns browsers
**Mitigação:** Fallback para polling, testes cross-browser

## 📅 Cronograma Detalhado

| Fase | Responsável | Início | Fim | Entregáveis |
|------|------------|--------|-----|-------------|
| **Fase 1** | Backend + Tech Lead | D+0 | D+3 | Socket.io, Auth Fix, CORS |
| **Fase 2** | Backend + Frontend | D+3 | D+5 | Sistema Notificações |
| **Fase 3** | Frontend + UX | D+5 | D+9 | Componentes UI |
| **Fase 4** | Frontend + PM | D+9 | D+12 | Página Amigos |
| **Fase 5** | Tech Lead + QA | D+12 | D+14 | Otimizações, Testes |

## 🚀 Deploy e Rollout

### Ambiente de Desenvolvimento
1. Implementar funcionalidades
2. Testes unitários e integração
3. Code review entre agentes

### Ambiente de Staging  
1. Deploy para staging
2. Testes E2E automatizados
3. Testes de performance
4. Validação UX com stakeholders

### Ambiente de Produção
1. Deploy gradual (feature flag)
2. Monitoramento de métricas
3. Rollback automático se necessário
4. Comunicação para usuários

## 🔧 Configurações Necessárias

### Backend Environment Variables
```env
# Socket.io Configuration
SOCKET_IO_CORS_ORIGIN=http://localhost:8080
SOCKET_IO_ENABLED=true

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/studyspace

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:8080
```

### Frontend Environment Variables  
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3002/api
VITE_SOCKET_URL=http://localhost:3002

# Feature Flags
VITE_SOCKET_ENABLED=true
VITE_FRIENDS_FEATURE=true
```

## 📚 Documentação Adicional

### Para Desenvolvedores
- **API Reference:** `/docs/api-connections.md`
- **Socket Events:** `/docs/socket-events.md`
- **Component Library:** `/docs/components-friends.md`

### Para QA
- **Test Cases:** `/docs/test-cases-friends.md`
- **Test Data:** `/docs/test-data-setup.md`

### Para Deploy
- **Deployment Guide:** `/docs/deploy-friends-system.md`
- **Monitoring Setup:** `/docs/monitoring-friends.md`

## ✅ Critérios de Aceitação

### Funcionalidade Básica
- [ ] Usuário pode buscar outros usuários por nome
- [ ] Usuário pode enviar solicitação de amizade
- [ ] Usuário recebe notificação de nova solicitação
- [ ] Usuário pode aceitar/rejeitar solicitações
- [ ] Usuário pode ver lista de amigos
- [ ] Sistema funciona em tempo real via WebSocket

### Performance
- [ ] APIs respondem em menos de 200ms
- [ ] WebSocket conecta em menos de 2 segundos
- [ ] Interface responde sem delay perceptível
- [ ] Sistema suporta 100+ usuários simultâneos

### Qualidade
- [ ] Cobertura de testes > 85%
- [ ] Zero erros críticos em produção
- [ ] Documentação completa
- [ ] Code review aprovado por todos agentes

## 🎯 Conclusão

Este plano de execução fornece uma estratégia abrangente para implementar um sistema robusto de adicionar amigos no Study Space. Com a participação coordenada de todos os agentes especializados, garantimos:

1. **Qualidade Técnica:** Arquitetura sólida e código maintível
2. **Experiência do Usuário:** Interface intuitiva e responsiva  
3. **Performance:** Sistema otimizado para escala
4. **Confiabilidade:** Testes abrangentes e monitoramento
5. **Manutenibilidade:** Documentação completa e padrões consistentes

O cronograma de 14 dias permite entregas incrementais com validação contínua, minimizando riscos e maximizando a qualidade do produto final.

---

**Próximos Passos:**
1. Aprovação do plano pelos stakeholders
2. Configuração dos ambientes de desenvolvimento  
3. Kick-off com todos os agentes
4. Início da Fase 1 - Correções Críticas

**Responsável pelo Plano:** Tech Lead  
**Aprovação Necessária:** Product Manager + Stakeholders  
**Data de Revisão:** Semanal (toda terça-feira)


Fluxos de Erro e Tratamento de Falhas
Erro 1: Solicitação duplicada de amizade

Cenário: Usuário tenta adicionar alguém que já enviou/recebeu solicitação.
Tratamento:

Backend: retornar 409 Conflict com mensagem "Solicitação já existe".

Frontend: exibir toast "Você já enviou uma solicitação para este usuário" e desabilitar botão.

Erro 2: Amizade já existente

Cenário: Usuário tenta adicionar alguém que já é amigo.
Tratamento:

Backend: retornar 400 Bad Request com mensagem "Usuário já é seu amigo".

Frontend: exibir toast "Vocês já são amigos" e mostrar botão “Remover Amigo” no lugar.

Erro 3: Token JWT expirado ou inválido

Cenário: Fetch ou WebSocket handshake falha por 401 Unauthorized.
Tratamento:

Frontend: interceptar resposta 401 → limpar localStorage/session → redirecionar para login automaticamente.

UX extra: mostrar popup "Sua sessão expirou, faça login novamente".

Erro 4: WebSocket desconectado

Cenário: Conexão cai por perda de rede ou servidor reinicia.
Tratamento:

Frontend: tentar reconectar em backoff exponencial (1s, 2s, 4s, até 30s).

UI: mostrar badge "Reconectando..." discreto na barra de status.

Fallback: se não reconectar em 1 minuto → cair para polling (/api/connections/requests a cada 15s).

Erro 5: Usuário não encontrado na busca

Cenário: Busca retorna vazio.
Tratamento:

Backend: retornar 200 OK com [].

Frontend: exibir estado "Nenhum usuário encontrado" com sugestão de refinar busca.

Erro 6: API offline ou falha de rede

Cenário: fetchFriends, fetchProfile ou usePosts não respondem.
Tratamento:

Frontend:

Exibir fallback UI (Skeleton + "Não foi possível carregar dados")

Botão “Tentar novamente”

UX extra: se a falha persistir, sugerir "Verifique sua conexão de internet".

Erro 7: Resposta lenta do servidor

Cenário: API demora > 3s para responder.
Tratamento:

Frontend: mostrar loading skeleton + spinner.

UX extra: se passar de 10s → exibir "Servidor demorando para responder".

Erro 8: Exceção inesperada no backend

Cenário: API retorna 500 Internal Server Error.
Tratamento:

Backend: logar erro com stack trace + correlation ID.

Frontend: exibir toast genérico "Ocorreu um erro inesperado" e reportar para Sentry (ou similar).

Erro 9: Conflito ao aceitar/rejeitar solicitação

Cenário: Dois usuários respondem ao mesmo tempo.
Tratamento:

Backend: transação com SELECT FOR UPDATE → garantir atomicidade.

Frontend: se resposta for "Solicitação já respondida", atualizar UI automaticamente.

Erro 10: Bloqueio de usuário

Cenário: Usuário bloqueado tenta mandar solicitação.
Tratamento:

Backend: retornar 403 Forbidden.

Frontend: exibir toast "Você não pode adicionar este usuário".


Bug Possível	Impacto no Usuário	Como Evitar (Solução Técnica)
Envio de Solicitações Duplicadas	O destinatário recebe múltiplos pedidos da mesma pessoa, gerando spam. O solicitante fica confuso sobre o status real.	Backend: Criar uma restrição única (UNIQUE constraint) na tabela de solicitações para o par (id_solicitante, id_destinatario). Frontend: Desabilitar o botão "Adicionar" imediatamente após o clique e mudar seu texto para "Solicitação Enviada".
Solicitações Cruzadas (Race Condition)	Usuário A envia um pedido para B ao mesmo tempo que B envia para A. Isso pode criar duas solicitações pendentes, travando o fluxo.	Backend: Antes de criar uma solicitação de A para B, o sistema deve verificar se já existe uma de B para A. Se sim, em vez de criar um novo pedido, o sistema deve automaticamente aceitar o pedido existente e formar a amizade.
Adicionar a si mesmo como amigo	Um usuário consegue enviar uma solicitação para o seu próprio perfil, o que não faz sentido e pode corromper dados.	Frontend: Ocultar o botão "Adicionar" no perfil do próprio usuário. Backend: Adicionar uma validação que rejeita a solicitação se id_solicitante for igual a id_destinatario.
Adicionar alguém que já é amigo	O sistema permite enviar uma solicitação para alguém que já está na lista de amigos, causando inconsistência de dados.	Backend: A API que carrega os dados de um perfil deve sempre retornar o status do relacionamento (amigos, solicitacao_enviada, etc.). O frontend deve usar essa informação para exibir o botão correto (ex: "Amigos" em vez de "Adicionar").
2. Bugs de Interface e Experiência do Usuário (UX)
Estes problemas afetam diretamente a forma como o usuário interage com a funcionalidade.

Bug Possível	Impacto no Usuário	Como Evitar (Solução Técnica)
Estado do Botão não atualiza	O usuário aceita um pedido, mas o botão no perfil da outra pessoa continua como "Aceitar Solicitação" até a página ser recarregada.	Frontend: Usar atualização de estado em tempo real (ou "otimista"). Após a ação (aceitar, recusar, etc.), a UI deve ser atualizada imediatamente, enquanto a confirmação do servidor é processada em segundo plano. O uso de WebSockets é ideal para isso.
Notificações "Fantasma"	A notificação de um pedido de amizade não desaparece depois que o pedido foi aceito ou recusado.	Backend/Frontend: O sistema de notificações deve ser atrelado ao estado da solicitação. Quando o status da solicitação muda (de pendente para aceita ou recusada), o backend deve automaticamente marcar a notificação correspondente como "lida" ou removê-la.
Desfazer Amizade sem Confirmação	Um clique acidental no botão "Desfazer Amizade" remove o amigo instantaneamente, causando frustração.	Frontend: Sempre implementar uma caixa de diálogo de confirmação. Ex: "Você tem certeza que deseja remover [Nome do Amigo] da sua lista de amigos?". A ação só deve ser executada após a confirmação explícita.
3. Bugs de Performance e Segurança
Estes problemas estão relacionados à escalabilidade e à proteção contra ataques.

Bug Possível	Impacto no Usuário	Como Evitar (Solução Técnica)
Lentidão para Carregar Listas	Usuários com muitos amigos ou muitas solicitações pendentes enfrentam lentidão ao carregar essas listas.	Backend: Implementar paginação nas APIs que retornam listas de amigos e solicitações. Utilizar índices (INDEX) nas colunas id_usuario e id_amigo no banco de dados para otimizar as consultas.
Ações Forjadas (CSRF)	Um site malicioso poderia forçar um usuário logado a aceitar um pedido de amizade ou enviar uma solicitação sem o seu conhecimento.	Backend: Implementar tokens anti-CSRF (Cross-Site Request Forgery) em todas as requisições que alteram estado (adicionar, aceitar, recusar, desfazer amizade).