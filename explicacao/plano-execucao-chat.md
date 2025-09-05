# Plano de Execução - Chat Popup Individual

## 1. Análise Atual

### Componente Alvo
- **Arquivo**: `src/components/Feed/FriendsDropdown.tsx:267:6`
- **Localização**: Botão com ícone `MoreHorizontal` que abre menu dropdown
- **Funcionalidade Atual**: Menu com "Ver perfil" e "Chamar para estudar"

### Estrutura Existente
- Sistema de amigos com status (online/offline/busy)
- Interface `Friend` definida com: id, name, nickname, avatarUrl, status, lastSeen, note
- Context de autenticação já implementado
- Sistema de navegação com React Router

## 2. Implementação do Chat Popup

### 2.1 Criação de Componentes

#### 2.1.1 ChatProvider Context
- **Arquivo**: `src/contexts/ChatContext.tsx`
- **Responsabilidades**:
  - Gerenciar estado global do chat
  - Lista de conversas ativas
  - Controle de mensagens não lidas
  - WebSocket para mensagens em tempo real

#### 2.1.2 Componente ChatWindow
- **Arquivo**: `src/components/Chat/ChatWindow.tsx`
- **Base**: Estrutura do `explicacao/html.html`
- **Funcionalidades**:
  - Janela popup fixa no canto direito
  - Header com avatar, nome e status do amigo
  - Thread de mensagens com scroll
  - Composer para envio de mensagens
  - Botões para minimizar, tema e fechar
  - Animação de entrada/saída

#### 2.1.3 Componente ChatFab
- **Arquivo**: `src/components/Chat/ChatFab.tsx`
- **Funcionalidades**:
  - Botão flutuante para mostrar chats ativos
  - Badge com número de mensagens não lidas
  - Lista de conversas em andamento

#### 2.1.4 Componente ChatManager
- **Arquivo**: `src/components/Chat/ChatManager.tsx`
- **Responsabilidades**:
  - Gerenciar múltiplas janelas de chat abertas
  - Posicionamento inteligente das janelas
  - Limite de janelas simultâneas (máx. 3)

### 2.2 Integração com API Backend

#### 2.2.1 Endpoints de Chat
- `GET /api/chat/conversations` - Listar conversas
- `GET /api/chat/messages/:conversationId` - Mensagens de uma conversa
- `POST /api/chat/send` - Enviar mensagem
- `PUT /api/chat/read/:conversationId` - Marcar como lida

#### 2.2.2 WebSocket Integration
- Usar contexto `SocketContext` existente
- Eventos: `message_received`, `user_typing`, `user_online_status`

### 2.3 Modificação do FriendsDropdown

#### 2.3.1 Adição de Opção "Enviar mensagem"
- Adicionar nova opção no menu dropdown
- Função `handleSendMessage(friend: Friend)`
- Integração com ChatContext para abrir chat

## 3. Estrutura de Dados

### 3.1 Interfaces TypeScript

```typescript
interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'file';
}

interface ChatConversation {
  id: string;
  participants: Friend[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isMinimized: boolean;
  isActive: boolean;
}

interface ChatContextValue {
  conversations: ChatConversation[];
  activeChats: string[];
  openChat: (friendId: string) => void;
  closeChat: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
  markAsRead: (conversationId: string) => void;
}
```

### 3.2 Estado Local Storage
- Persistir conversas minimizadas
- Cache de mensagens recentes
- Preferências de tema do chat

## 4. Fluxo de Implementação

### Fase 1: Infraestrutura Base
1. Criar ChatContext com estado inicial
2. Implementar componente ChatWindow básico
3. Adicionar opção "Enviar mensagem" no FriendsDropdown

### Fase 2: Funcionalidades Core
1. Implementar envio/recebimento de mensagens
2. Sistema de notificações não lidas
3. Persistência com localStorage

### Fase 3: Features Avançadas
1. Integração WebSocket tempo real
2. Indicadores de status (online/digitando)
3. Suporte a múltiplas janelas de chat
4. Otimizações de performance

### Fase 4: Refinamentos
1. Animações e transições
2. Responsividade mobile
3. Testes de acessibilidade
4. Temas claro/escuro

## 5. Pontos de Integração

### 5.1 FriendsDropdown.tsx
- **Linha 376**: Adicionar nova opção "Enviar mensagem" após "Chamar para estudar"
- **Nova função**: `handleSendMessage(friend: Friend)`
- **Import**: `import { useChatContext } from '@/contexts/ChatContext'`

### 5.2 Layout Principal
- Adicionar `<ChatManager />` no componente raiz
- Envolver aplicação com `<ChatProvider>`

### 5.3 Estilos
- Reutilizar design tokens existentes
- Manter consistência com tema atual
- Adaptar estilos do `html.html` para Tailwind CSS

## 6. Considerações Técnicas

### 6.1 Performance
- Virtualização de mensagens para conversas longas
- Debounce para indicador de digitação
- Lazy loading de histórico de mensagens

### 6.2 UX/UI
- Máximo 3 janelas de chat simultâneas
- Posicionamento inteligente para evitar sobreposição
- Indicadores visuais claros para status

### 6.3 Acessibilidade
- ARIA labels para screen readers
- Navegação por teclado
- Contraste adequado para temas

## 7. Cronograma Estimado

- **Fase 1**: 2-3 horas
- **Fase 2**: 4-5 horas  
- **Fase 3**: 3-4 horas
- **Fase 4**: 2-3 horas
- **Total**: 11-15 horas de desenvolvimento

## 8. Arquivos a Serem Criados/Modificados

### Novos Arquivos
- `src/contexts/ChatContext.tsx`
- `src/components/Chat/ChatWindow.tsx`
- `src/components/Chat/ChatFab.tsx`
- `src/components/Chat/ChatManager.tsx`
- `src/hooks/useChat.ts`
- `src/types/chat.ts`

### Arquivos Modificados
- `src/components/Feed/FriendsDropdown.tsx`
- `src/App.tsx` ou layout principal
- Backend: Novos endpoints de chat
- `src/contexts/SocketContext.tsx` (eventos de chat)